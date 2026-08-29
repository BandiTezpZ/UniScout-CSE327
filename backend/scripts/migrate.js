require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const fallbackFilePath = path.join(__dirname, '../data/local_db.json');
  if (!fs.existsSync(fallbackFilePath)) {
    console.error('No local_db.json found');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'uniscout',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Clearing existing data...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE recommendation_requests');
    await pool.query('TRUNCATE TABLE student_profiles');
    await pool.query('TRUNCATE TABLE verification_tokens');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Inserting users...');
    for (const user of data.users || []) {
      await pool.query(`
        INSERT INTO users (id, fullName, email, password, mobileNumber, role, institution, department, designation, email_verified, isVerified, isBlocked, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id, user.fullName, user.email, user.password, user.mobileNumber || null,
        user.role || 'Student', user.institution || null, user.department || null,
        user.designation || null, user.email_verified ? 1 : 0, user.isVerified ? 1 : 0,
        user.isBlocked ? 1 : 0, user.createdAt
      ]);
    }

    console.log('Inserting verification tokens...');
    for (const token of data.verification_tokens || []) {
      await pool.query(`
        INSERT INTO verification_tokens (id, userId, token, expiresAt, createdAt, verifiedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        token.id, token.userId, token.token, token.expiresAt, token.createdAt, token.verifiedAt || null
      ]);
    }

    console.log('Inserting student profiles...');
    for (const profile of data.student_profiles || []) {
      await pool.query(`
        INSERT INTO student_profiles (id, userId, degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, skills, latestCvName, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        profile.id, profile.userId, profile.degreeLevel || null, profile.intendedMajor || null,
        profile.cgpa || null, profile.ieltsToefl || null, profile.gresatgmat || null,
        profile.budget || null, profile.researchPapers || 0, profile.projects || 0,
        profile.internships || 0, profile.extracurriculars || null,
        JSON.stringify(profile.skills || []), profile.latestCvName || null, profile.createdAt
      ]);
    }

    console.log('Inserting recommendation requests...');
    for (const req of data.recommendation_requests || []) {
      await pool.query(`
        INSERT INTO recommendation_requests (id, studentId, studentName, studentEmail, facultyName, facultyEmail, facultyInstitution, facultyDepartment, facultyDesignation, relationshipToStudent, coursesTaught, purpose, studentMessage, deadline, status, respondedAt, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        req.id, req.studentId, req.studentName, req.studentEmail, req.facultyName,
        req.facultyEmail, req.facultyInstitution || null, req.facultyDepartment || null,
        req.facultyDesignation || null, req.relationshipToStudent, req.coursesTaught || null,
        req.purpose, req.studentMessage || null, req.deadline, req.status || 'pending',
        req.respondedAt || null, req.createdAt
      ]);
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
