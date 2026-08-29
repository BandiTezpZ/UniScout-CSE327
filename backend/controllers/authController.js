const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require('../config/db');

const OTP_EXPIRY_MINUTES = 2;
const RESEND_COOLDOWN_SECONDS = 30;
const resendAttempts = new Map();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isTrue(value) {
  return value === true || value === 1 || value === '1';
}

function isBlocked(user) {
  return isTrue(user.isBlocked) || String(user.status || '').toLowerCase() === 'blocked';
}

function getStoredPassword(user) {
  return user.password ?? '';
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function getOtpExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

function secondsUntil(dateValue) {
  return Math.max(0, Math.ceil((new Date(dateValue).getTime() - Date.now()) / 1000));
}

function createTransporter() {
  const host = process.env.SMTP_HOST || (process.env.SMTP_USER || process.env.EMAIL_USER ? 'smtp.gmail.com' : '');
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user;

  if (!host || !port || !user || !pass || !from) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, and SMTP_SECURE.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false' }
  });
}

async function sendOtpEmail(email, otp) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your UniScout account',
    text: `Your UniScout verification code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `<p>Your UniScout verification code is <b>${otp}</b>.</p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`
  });
  console.log(`[OTP EMAIL SENT] To: ${email}`);
}

function isSmtpConfigured() {
  return Boolean((process.env.SMTP_USER || process.env.EMAIL_USER) && (process.env.SMTP_PASSWORD || process.env.EMAIL_PASS));
}

async function getNextUserId() {
  const rows = await db.query('SELECT id FROM users ORDER BY CAST(id AS UNSIGNED) DESC LIMIT 1');
  const max = rows.reduce((highest, row) => {
    const value = Number(row.id);
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return max + 1;
}

async function createOtpForUser(user, { enforceCooldown = false } = {}) {
  const email = normalizeEmail(user.email);
  const now = Date.now();
  const attempt = resendAttempts.get(email);
  if (enforceCooldown && attempt && now - attempt.lastSentAt < RESEND_COOLDOWN_SECONDS * 1000) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - attempt.lastSentAt)) / 1000);
    const error = new Error(`Please wait ${waitSeconds} seconds before requesting another code.`);
    error.statusCode = 429;
    throw error;
  }
  if (attempt && attempt.windowStartedAt && now - attempt.windowStartedAt < 10 * 60 * 1000 && attempt.count >= 5) {
    const error = new Error('Too many verification emails requested. Please try again later.');
    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtp();
  const expiresAt = getOtpExpiryDate();
  await db.query('UPDATE users SET verification_otp = ?, otp_expires_at = ? WHERE id = ?', [otp, expiresAt, user.id]);
  await db.query('DELETE FROM verification_tokens WHERE userId = ?', [user.id]);
  await db.query('INSERT INTO verification_tokens (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)', [uuidv4(), user.id, otp, expiresAt]);
  let emailSent = false;
  if (isSmtpConfigured()) {
    await sendOtpEmail(email, otp);
    emailSent = true;
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, and SMTP_SECURE.');
  } else {
    console.log(`[LOCAL DEV OTP] ${email}: ${otp}`);
  }

  const nextAttempt = attempt && now - attempt.windowStartedAt < 10 * 60 * 1000
    ? { windowStartedAt: attempt.windowStartedAt, count: attempt.count + 1, lastSentAt: now }
    : { windowStartedAt: now, count: 1, lastSentAt: now };
  resendAttempts.set(email, nextAttempt);
  return { otpExpiresAt: expiresAt.toISOString(), otpExpiresInSeconds: OTP_EXPIRY_MINUTES * 60, emailSent, devOtp: emailSent ? undefined : otp };
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture || null
  };
}

function signUser(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error('Server authentication is not configured');
    error.statusCode = 500;
    throw error;
  }
  return jwt.sign(publicUser(user), secret, { expiresIn: '7d' });
}

// Register a new user (Student or Faculty).
exports.register = async (req, res) => {
  const { fullName, email, password, role, mobileNumber, institution, department, designation } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password || !fullName) return res.status(400).json({ message: 'Full name, email, and password are required' });
  if (!emailRegex.test(normalizedEmail)) return res.status(400).json({ message: 'Invalid email format' });
  if (role === 'Admin') return res.status(403).json({ message: 'Public Admin registration is disabled' });

  const userRole = role === 'Faculty' ? 'Faculty' : 'Student';
  if (userRole === 'Faculty' && (!institution?.trim() || !department?.trim() || !designation?.trim())) {
    return res.status(400).json({ message: 'Institution, department, and designation are required for Faculty' });
  }
  if (!mobileNumber || !/^\d{11}$/.test(mobileNumber)) return res.status(400).json({ message: 'Mobile number requires exactly 11 digits' });

  try {
    const existingUsers = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUsers.length > 0) return res.status(400).json({ message: 'User already exists with this email' });

    const userId = await getNextUserId();
    // Temporary XAMPP course-demo behavior: plaintext passwords must be replaced with secure hashing before production deployment.
    await db.query(
      'INSERT INTO users (id, fullName, email, password, mobileNumber, role, email_verified, institution, department, designation, isBlocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, fullName.trim(), normalizedEmail, password, mobileNumber, userRole, false, institution?.trim() || null, department?.trim() || null, designation?.trim() || null, false]
    );

    if (userRole === 'Student') {
      await db.query(
        'INSERT INTO student_profiles (id, userId, degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, fundingNeed, skills, latestCvName, institution, graduationYear, researchInterests, publications, desiredDegree, preferredCountries, fundingPreference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), userId, null, null, null, null, null, null, 0, 0, 0, null, null, JSON.stringify([]), null, null, null, JSON.stringify([]), JSON.stringify([]), null, JSON.stringify([]), null]
      );
    }

    const user = { id: userId, fullName: fullName.trim(), email: normalizedEmail, role: userRole };
    const otp = await createOtpForUser(user);
    res.status(201).json({
      message: otp.emailSent ? 'Registration successful! Verification email sent.' : 'Registration successful! Use the local OTP shown below.',
      delivery: otp.emailSent ? 'email' : 'local',
      requiresVerification: true,
      otpExpiresAt: otp.otpExpiresAt,
      otpExpiresInSeconds: otp.otpExpiresInSeconds,
      devOtp: otp.devOtp,
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error during registration' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, token } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !token) return res.status(400).json({ message: 'Email and verification code are required' });

  try {
    const users = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!users.length) return res.status(400).json({ message: 'Invalid or expired verification token' });
    const user = users[0];

    if (isTrue(user.email_verified) || isTrue(user.isVerified)) {
      return res.status(200).json({ message: 'Email has already been verified' });
    }
    if (isBlocked(user)) return res.status(403).json({ message: 'Your account has been blocked. Please contact the administrator.' });
    if (!user.verification_otp || String(user.verification_otp) !== String(token)) {
      return res.status(400).json({ message: 'The verification code is incorrect.' });
    }
    if (!user.otp_expires_at || new Date(user.otp_expires_at) <= new Date()) {
      await db.query('UPDATE users SET verification_otp = ?, otp_expires_at = ? WHERE id = ?', [null, null, user.id]);
      return res.status(400).json({ message: 'This verification code has expired.' });
    }

    await db.query('UPDATE users SET email_verified = ?, isVerified = ?, verification_otp = ?, otp_expires_at = ? WHERE id = ?', [true, true, null, null, user.id]);
    await db.query('DELETE FROM verification_tokens WHERE userId = ?', [user.id]);

    res.status(200).json({
      message: 'Email verification successful!',
      token: signUser(user),
      user: publicUser({ ...user, email_verified: true, isVerified: true })
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error during email verification' });
  }
};

exports.resendOtp = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });

  try {
    const users = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!users.length) return res.status(404).json({ message: 'User not found' });
    const user = users[0];
    if (isTrue(user.email_verified) || isTrue(user.isVerified)) return res.status(400).json({ message: 'This email is already verified.' });
    if (isBlocked(user)) return res.status(403).json({ message: 'Your account has been blocked. Please contact the administrator.' });

    const otp = await createOtpForUser(user, { enforceCooldown: true });
    res.json({
      message: 'A new verification code has been sent.',
      requiresVerification: true,
      email: normalizedEmail,
      otpExpiresAt: otp.otpExpiresAt,
      otpExpiresInSeconds: otp.otpExpiresInSeconds,
      devOtp: otp.devOtp
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Unable to resend verification code' });
  }
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) return res.status(400).json({ message: 'Email and password are required' });

  try {
    const users = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (users.length === 0) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    const user = users[0];

    if (role && user.role !== role) return res.status(403).json({ code: 'ROLE_MISMATCH', message: `Access denied. Account is registered as ${user.role}.` });
    if (getStoredPassword(user) !== password) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    if (isBlocked(user)) return res.status(403).json({ code: 'ACCOUNT_BLOCKED', message: 'Your account has been blocked. Please contact the administrator.' });

    if (!isTrue(user.email_verified) && !isTrue(user.isVerified)) {
      const otp = await createOtpForUser(user);
      return res.status(403).json({
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Your email is not verified. A new verification code has been sent.',
        requiresVerification: true,
        email: normalizedEmail,
        role: user.role,
        otpExpiresAt: otp.otpExpiresAt,
        otpExpiresInSeconds: otp.otpExpiresInSeconds,
        devOtp: otp.devOtp
      });
    }

    res.status(200).json({ code: 'LOGIN_SUCCESS', message: 'Login successful', token: signUser(user), user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error during login' });
  }
};

exports.resetPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new password are required' });

  try {
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = users[0];
    if (getStoredPassword(user) !== oldPassword) return res.status(401).json({ message: 'Incorrect old password' });

    // Temporary XAMPP course-demo behavior: plaintext passwords must be replaced with secure hashing before production deployment.
    await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Update User
exports.forgotPassword = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });

  try {
    const users = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!users.length) return res.status(404).json({ message: 'User not found' });
    const user = users[0];
    if (isBlocked(user)) return res.status(403).json({ message: 'Your account has been blocked.' });

    const otp = await createOtpForUser(user, { enforceCooldown: true });
    res.json({
      message: 'A password reset code has been sent.',
      email: normalizedEmail,
      otpExpiresAt: otp.otpExpiresAt,
      otpExpiresInSeconds: otp.otpExpiresInSeconds,
      devOtp: otp.devOtp
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Unable to send reset code' });
  }
};

exports.resetPasswordOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !otp || !newPassword) return res.status(400).json({ message: 'Email, code, and new password are required' });

  try {
    const users = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!users.length) return res.status(400).json({ message: 'Invalid or expired verification token' });
    const user = users[0];

    if (isBlocked(user)) return res.status(403).json({ message: 'Your account has been blocked.' });
    if (!user.verification_otp || String(user.verification_otp) !== String(otp)) {
      return res.status(400).json({ message: 'The verification code is incorrect.' });
    }
    if (!user.otp_expires_at || new Date(user.otp_expires_at) <= new Date()) {
      await db.query('UPDATE users SET verification_otp = ?, otp_expires_at = ? WHERE id = ?', [null, null, user.id]);
      return res.status(400).json({ message: 'This verification code has expired.' });
    }

    // Update password, consume OTP
    await db.query('UPDATE users SET password = ?, verification_otp = ?, otp_expires_at = ? WHERE id = ?', [newPassword, null, null, user.id]);
    await db.query('DELETE FROM verification_tokens WHERE userId = ?', [user.id]);

    res.status(200).json({ message: 'Password reset successful!' });
  } catch (error) {
    console.error('Password reset OTP error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error during password reset' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, email, role, isBlocked } = req.body;

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await db.query('UPDATE users SET fullName = ?, email = ?, role = ?, isBlocked = ? WHERE id = ?', [fullName, email, role, !!isBlocked, id]);
    res.status(200).json({ message: 'User updated successfully', user: { id, fullName, email, role, isBlocked: !!isBlocked } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.setUserBlocked = async (req, res) => {
  const { id } = req.params;
  const { isBlocked } = req.body;
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });
  if (String(req.user.id) === String(id) && isBlocked) return res.status(400).json({ message: 'You cannot block your own admin account' });
  try {
    await db.query('UPDATE users SET isBlocked = ? WHERE id = ?', [!!isBlocked, id]);
    res.status(200).json({ message: isBlocked ? 'User blocked successfully' : 'User unblocked successfully', user: { id, isBlocked: !!isBlocked } });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Delete User
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.adminCreateUser = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password || !fullName || !role) {
    return res.status(400).json({ message: 'Full name, email, password, and role are required' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const nextId = await getNextUserId();
    const newUser = {
      id: nextId,
      fullName,
      email: normalizedEmail,
      password,
      role,
      email_verified: 1,
      isVerified: 1,
      isBlocked: 0
    };

    const sql = `
      INSERT INTO users (id, fullName, email, password, role, email_verified, isVerified, isBlocked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [newUser.id, newUser.fullName, newUser.email, newUser.password, newUser.role, newUser.email_verified, newUser.isVerified, newUser.isBlocked];

    await db.query(sql, params);

    res.status(201).json({ message: 'User created successfully', user: publicUser(newUser) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
