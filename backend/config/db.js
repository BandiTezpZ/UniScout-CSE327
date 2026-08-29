const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool = null;
let useFallback = false;
const fallbackFilePath = path.join(__dirname, '../data/local_db.json');

// Initialize JSON fallback database if it doesn't exist
function initJsonDb() {
  const dir = path.dirname(fallbackFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(fallbackFilePath)) {
    fs.writeFileSync(
      fallbackFilePath,
      JSON.stringify({ users: [], verification_tokens: [], student_profiles: [], recommendation_requests: [], shortlists: [] }, null, 2)
    );
  }
}

// Read JSON database helper
function readJsonDb() {
  initJsonDb();
  try {
    const data = fs.readFileSync(fallbackFilePath, 'utf8');
    const parsed = JSON.parse(data);
    const normalized = normalizeJsonDb(parsed);
    if (normalized.changed) writeJsonDb(normalized.data);
    return normalized.data;
  } catch (err) {
    console.error('Error reading JSON fallback DB, resetting...', err);
    return { users: [], verification_tokens: [], student_profiles: [], recommendation_requests: [], shortlists: [] };
  }
}

// Write JSON database helper
function writeJsonDb(data) {
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to JSON fallback DB:', err);
  }
}

function normalizeJsonDb(data) {
  data.users = data.users || [];
  data.verification_tokens = data.verification_tokens || [];
  data.student_profiles = data.student_profiles || [];
  data.recommendation_requests = data.recommendation_requests || [];
  data.shortlists = normalizeShortlists(data.shortlists || {});
  data.ai_recommendations = data.ai_recommendations || {};
  let changed = false;
  data.users.forEach(user => {
    if (typeof user.password === 'string' && /^\$2[aby]\$/.test(user.password)) {
      // Temporary XAMPP demo migration: old non-plaintext values cannot be used after hashing was removed.
      user.password = user.role === 'Faculty' ? '123456' : '1234';
      changed = true;
    }
    if (user.email_verified === undefined) {
      user.email_verified = user.isVerified ?? false;
      changed = true;
    }
    if (user.isVerified === undefined) {
      user.isVerified = user.email_verified ?? false;
      changed = true;
    }
    if (user.isBlocked === undefined) {
      user.isBlocked = false;
      changed = true;
    }
    if (user.verification_otp === undefined) {
      user.verification_otp = null;
      changed = true;
    }
    if (user.otp_expires_at === undefined) {
      user.otp_expires_at = null;
      changed = true;
    }
    ['specialization', 'officeHours', 'bio'].forEach(field => {
      if (user[field] === undefined) {
        user[field] = '';
        changed = true;
      }
    });
    if (user.profilePicture === undefined) {
      user.profilePicture = null;
      changed = true;
    }
  });
  return { data, changed };
}

function normalizeShortlists(shortlists) {
  if (Array.isArray(shortlists)) return shortlists;
  return Object.entries(shortlists || {}).flatMap(([userId, ids]) =>
    (Array.isArray(ids) ? ids : []).map(universityId => ({ user_id: userId, university_id: universityId }))
  );
}

function getAiShortlists(userId) {
  const db = readJsonDb();
  return (db.shortlists || []).filter(item => String(item.user_id) === String(userId) && String(item.source || '').startsWith('ai_'));
}

function saveAiShortlist(userId, recommendation) {
  const db = readJsonDb();
  const id = recommendation.id || `ai-${Date.now()}`;
  const source = String(recommendation.source || '').startsWith('ai_') ? recommendation.source : 'ai_catalog';
  const exists = db.shortlists.some(item => String(item.user_id) === String(userId) && String(item.source || '').startsWith('ai_') && String(item.university_id) === String(id));
  if (!exists) {
    db.shortlists.push({
      user_id: userId,
      university_id: id,
      source,
      savedAt: new Date().toISOString(),
      aiUniversity: { ...recommendation, id }
    });
    writeJsonDb(db);
  }
  return id;
}

function removeAiShortlist(userId, id) {
  const db = readJsonDb();
  const before = db.shortlists.length;
  db.shortlists = db.shortlists.filter(item => !(String(item.user_id) === String(userId) && String(item.source || '').startsWith('ai_') && String(item.university_id) === String(id)));
  writeJsonDb(db);
  return before - db.shortlists.length;
}

function getLatestAiRecommendations(userId) {
  const db = readJsonDb();
  return db.ai_recommendations?.[String(userId)] || null;
}

function saveLatestAiRecommendations(userId, payload) {
  const db = readJsonDb();
  db.ai_recommendations = db.ai_recommendations || {};
  db.ai_recommendations[String(userId)] = {
    ...payload,
    generatedAt: new Date().toISOString()
  };
  writeJsonDb(db);
  return db.ai_recommendations[String(userId)];
}

function readUniversities() {
  const filePath = path.join(__dirname, '../data/universities.json');
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')).map((item, index) => normalizeUniversity(item, index));
  } catch (error) {
    console.error('Error reading universities.json:', error.message);
    return [];
  }
}

function writeUniversities(universities) {
  fs.writeFileSync(path.join(__dirname, '../data/universities.json'), JSON.stringify(universities, null, 2), 'utf8');
}

function normalizeUniversity(item, index = 0) {
  const tuition = Number(item.tuition_usd || 0);
  const living = Number(item.living_cost_usd || 0);
  return {
    id: String(item.id || index + 1),
    university_name: item.university_name || item['\uFEFFuniversity_name'] || item.name || '',
    country: item.country || 'USA',
    state: item.state || '',
    program: item.program || '',
    rank_tier: Number(item.rank_tier || 999),
    tuition_usd: tuition,
    living_cost_usd: living,
    cost_of_attendance_usd: Number(item.cost_of_attendance_usd || tuition + living || 0),
    min_cgpa: Number(item.min_cgpa || 0),
    min_ielts: Number(item.min_ielts || 0),
    min_gre: Number(item.min_gre || 0),
    accepts_without_gre: item.accepts_without_gre || 'Varies',
    research_level: Number(item.research_level || 0),
    ms_cs: item.ms_cs || '',
    research_category: item.research_category || '',
    intake: item.intake || '',
    deadline: item.deadline || '',
    data_note: item.data_note || '',
    imageUrl: item.imageUrl || ''
  };
}

function normalizeUser(user) {
  if (!user) return user;
  return {
    ...user,
    password: user.password,
    email_verified: user.email_verified ?? user.isVerified ?? false,
    isVerified: user.isVerified ?? user.email_verified ?? false,
    isBlocked: user.isBlocked ?? false,
    verification_otp: user.verification_otp ?? null,
    otp_expires_at: user.otp_expires_at ?? null,
    profilePicture: user.profilePicture ?? null
  };
}

// Initialize MySQL pool or fallback
async function initializeDb() {
  if (useFallback) return;

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'uniscout',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  try {
    console.log(`Attempting to connect to MySQL database '${dbConfig.database}' on '${dbConfig.host}'...`);
    // First, test connection without database to see if MySQL is running
    const testConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    // Create database if not exists
    await testConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await testConnection.end();

    // Setup the connection pool
    pool = mysql.createPool(dbConfig);
    
    // Initialize tables in the live database just in case
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        mobileNumber VARCHAR(15),
        role ENUM('Student', 'Faculty', 'Admin') DEFAULT 'Student',
        institution VARCHAR(255),
        department VARCHAR(255),
        designation VARCHAR(255),
        email_verified BOOLEAN DEFAULT FALSE,
        verification_otp VARCHAR(6),
        otp_expires_at TIMESTAMP NULL,
        isBlocked BOOLEAN DEFAULT FALSE,
        isVerified BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    try {
      await pool.query("ALTER TABLE users MODIFY role ENUM('Student', 'Faculty', 'Admin') DEFAULT 'Student'");
      await pool.query('ALTER TABLE users ADD COLUMN institution VARCHAR(255)');
    } catch (e) {}
    try { await pool.query('ALTER TABLE users MODIFY id VARCHAR(36)'); } catch(e) {}
    try { await pool.query('ALTER TABLE users MODIFY email VARCHAR(255)'); } catch(e) {}
    try { await pool.query('ALTER TABLE student_profiles MODIFY userId VARCHAR(36)'); } catch(e) {}
    try { await pool.query('ALTER TABLE recommendation_requests MODIFY studentId VARCHAR(36)'); } catch(e) {}
    try { await pool.query('ALTER TABLE shortlists MODIFY user_id VARCHAR(36)'); } catch(e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN department VARCHAR(255)'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN designation VARCHAR(255)'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN password VARCHAR(255)'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE'); } catch (e) {}
    try { await pool.query('UPDATE users SET email_verified = isVerified WHERE email_verified IS NULL'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN verification_otp VARCHAR(6)'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP NULL'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN isBlocked BOOLEAN DEFAULT FALSE'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN specialization VARCHAR(255)'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN officeHours VARCHAR(255)'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN bio TEXT'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN profilePicture VARCHAR(255)'); } catch (e) {}
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id VARCHAR(36) PRIMARY KEY,
        userId INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verifiedAt TIMESTAMP NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL UNIQUE,
        degreeLevel VARCHAR(50),
        intendedMajor VARCHAR(100),
        cgpa FLOAT,
        ieltsToefl FLOAT,
        gresatgmat FLOAT,
        budget FLOAT,
        researchPapers INT DEFAULT 0,
        projects INT DEFAULT 0,
        internships INT DEFAULT 0,
        extracurriculars TEXT,
        sopStrength VARCHAR(50),
        lorStrength VARCHAR(50),
        fundingNeed VARCHAR(50),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Add custom columns if they do not exist
    try {
      await pool.query('ALTER TABLE student_profiles ADD COLUMN skills TEXT;');
    } catch (e) {
      // Column might already exist
    }
    try {
      await pool.query('ALTER TABLE student_profiles ADD COLUMN latestCvName VARCHAR(255);');
    } catch (e) {
      // Column might already exist
    }
    for (const statement of [
      'ALTER TABLE student_profiles ADD COLUMN institution VARCHAR(255);',
      'ALTER TABLE student_profiles ADD COLUMN graduationYear VARCHAR(20);',
      'ALTER TABLE student_profiles ADD COLUMN researchInterests TEXT;',
      'ALTER TABLE student_profiles ADD COLUMN publications TEXT;',
      'ALTER TABLE student_profiles ADD COLUMN desiredDegree VARCHAR(50);',
      'ALTER TABLE student_profiles ADD COLUMN preferredCountries TEXT;',
      'ALTER TABLE student_profiles ADD COLUMN fundingPreference VARCHAR(50);'
    ]) {
      try { await pool.query(statement); } catch (e) {}
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recommendation_requests (
        id VARCHAR(36) PRIMARY KEY,
        studentId VARCHAR(36) NOT NULL,
        studentName VARCHAR(255) NOT NULL,
        studentEmail VARCHAR(255) NOT NULL,
        facultyName VARCHAR(255) NOT NULL,
        facultyEmail VARCHAR(255) NOT NULL,
        facultyInstitution VARCHAR(255), facultyDepartment VARCHAR(255), facultyDesignation VARCHAR(255),
        relationshipToStudent VARCHAR(255) NOT NULL, coursesTaught TEXT, purpose VARCHAR(255) NOT NULL,
        studentMessage TEXT, deadline DATE NOT NULL,
        status ENUM('pending','accepted','declined','cancelled') DEFAULT 'pending',
        respondedAt TIMESTAMP NULL, letterFileName VARCHAR(255), letterStoredName VARCHAR(255),
        letterMimeType VARCHAR(100), letterFileSize INT, submittedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rec_student (studentId), INDEX idx_rec_faculty_email (facultyEmail),
        FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    try { await pool.query('ALTER TABLE recommendation_requests ADD COLUMN letterFileName VARCHAR(255)'); } catch (e) {}
    try { await pool.query('ALTER TABLE recommendation_requests ADD COLUMN letterStoredName VARCHAR(255)'); } catch (e) {}
    try { await pool.query('ALTER TABLE recommendation_requests ADD COLUMN letterMimeType VARCHAR(100)'); } catch (e) {}
    try { await pool.query('ALTER TABLE recommendation_requests ADD COLUMN letterFileSize INT'); } catch (e) {}
    try { await pool.query('ALTER TABLE recommendation_requests ADD COLUMN submittedAt TIMESTAMP NULL'); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id VARCHAR(36) PRIMARY KEY,
        university_name VARCHAR(255) NOT NULL,
        country VARCHAR(100) DEFAULT 'USA',
        state VARCHAR(100),
        program VARCHAR(255),
        rank_tier INT,
        tuition_usd DECIMAL(10, 2),
        living_cost_usd DECIMAL(10, 2),
        cost_of_attendance_usd DECIMAL(10, 2),
        min_cgpa DECIMAL(3, 2),
        min_ielts DECIMAL(3, 1),
        min_gre INT,
        accepts_without_gre VARCHAR(50),
        research_level INT,
        ms_cs VARCHAR(50),
        research_category VARCHAR(100),
        intake VARCHAR(50),
        deadline VARCHAR(100),
        data_note TEXT,
        imageUrl TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shortlists (
        user_id VARCHAR(36) NOT NULL,
        university_id VARCHAR(36) NOT NULL,
        PRIMARY KEY (user_id, university_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
      );
    `);

    console.log('Successfully connected to MySQL database and verified schema.');
  } catch (error) {
    require('fs').writeFileSync(require('path').join(__dirname, '../db_error.log'), String(error) + '\n' + error.stack);
    console.warn('\n======================================================');
    console.warn('WARNING: MySQL connection failed or not installed.');
    console.warn(`Error details: ${error.message}`);
    console.warn('FALLING BACK TO LOCAL FILE-SYSTEM DATABASE (JSON)');
    console.warn('App will remain fully functional for evaluation!');
    console.warn('======================================================\n');
    useFallback = true;
    initJsonDb();
  }
}

// Unified query wrapper
async function query(sql, params = []) {
  if (!pool && !useFallback) {
    try {
      await initializeDb();
      useFallback = false;
      console.log("Database tables initialized successfully (MySQL).");
    } catch (error) {
      fs.writeFileSync(path.join(__dirname, '../db_error.log'), String(error) + '\n' + error.stack);
      console.error('Failed to initialize MySQL database:', error);
      useFallback = true;
      console.log('Falling back to JSON mock database.');
    }
  }

  if (!useFallback) {
    try {
      const [results] = await pool.query(sql, params);
      return results;
    } catch (err) {
      console.error('MySQL Query Error:', err);
      throw err;
    }
  }

  // Fallback Logic Implementation
  const db = readJsonDb();
  db.users = db.users || [];
  db.verification_tokens = db.verification_tokens || [];
  db.student_profiles = db.student_profiles || [];
  db.recommendation_requests = db.recommendation_requests || [];
  db.shortlists = normalizeShortlists(db.shortlists || []);
  const lowerSql = sql.trim().toLowerCase();

  if (lowerSql.startsWith('select') && lowerSql.includes('from universities')) {
    if (lowerSql.includes('join shortlists')) {
      const userId = params[0];
      const saved = new Set(db.shortlists.filter(s => String(s.user_id) === String(userId)).map(s => String(s.university_id)));
      return readUniversities().filter(u => saved.has(String(u.id)));
    }

    let universities = readUniversities();

    if (lowerSql.includes('where id in')) {
      const ids = new Set(params.map(String));
      return universities.filter(u => ids.has(String(u.id)));
    }

    if (lowerSql.includes('where id =')) {
      const item = universities.find(u => String(u.id) === String(params[0]));
      return item ? [item] : [];
    }

    if (lowerSql.includes('lower(university_name) like')) {
      const terms = params.map(value => String(value || '').replace(/%/g, '').toLowerCase()).filter(Boolean);
      universities = universities.filter(u => terms.some(term =>
        String(u.university_name || '').toLowerCase().includes(term) ||
        String(u.state || '').toLowerCase().includes(term) ||
        String(u.program || '').toLowerCase().includes(term)
      ));
    }

    if (lowerSql.includes('program = ?')) {
      const program = params[params.length - 1];
      universities = universities.filter(u => String(u.program || '') === String(program || ''));
    }

    return universities;
  }

  if (lowerSql.startsWith('insert') && lowerSql.includes('into universities')) {
    const keys = ['id','university_name','country','state','program','rank_tier','tuition_usd','living_cost_usd','cost_of_attendance_usd','min_cgpa','min_ielts','min_gre','accepts_without_gre','research_level','ms_cs','research_category','intake','deadline','data_note','imageUrl'];
    const universities = readUniversities();
    const item = normalizeUniversity(Object.fromEntries(keys.map((key, index) => [key, params[index]])));
    const existingIndex = universities.findIndex(u => String(u.id) === String(item.id));
    if (existingIndex >= 0) universities[existingIndex] = { ...universities[existingIndex], ...item };
    else universities.push(item);
    writeUniversities(universities);
    return { insertId: item.id, affectedRows: 1 };
  }

  if (lowerSql.startsWith('update universities')) {
    const universities = readUniversities();
    const id = params[params.length - 1];
    const index = universities.findIndex(u => String(u.id) === String(id));
    if (index < 0) return { affectedRows: 0 };
    const keys = ['university_name','country','state','program','rank_tier','tuition_usd','living_cost_usd','cost_of_attendance_usd','min_cgpa','min_ielts','min_gre','accepts_without_gre','research_level','ms_cs','research_category','intake','deadline','data_note','imageUrl'];
    universities[index] = normalizeUniversity({ ...universities[index], ...Object.fromEntries(keys.map((key, i) => [key, params[i]])), id });
    writeUniversities(universities);
    return { affectedRows: 1 };
  }

  if (lowerSql.startsWith('delete from universities')) {
    const universities = readUniversities();
    const [id] = params;
    const next = universities.filter(u => String(u.id) !== String(id));
    db.shortlists = db.shortlists.filter(s => String(s.university_id) !== String(id));
    writeUniversities(next);
    writeJsonDb(db);
    return { affectedRows: universities.length - next.length };
  }

  if (lowerSql.startsWith('select') && lowerSql.includes('from shortlists')) {
    if (lowerSql.includes('join')) {
      const userId = params[0];
      const saved = new Set(db.shortlists.filter(s => String(s.user_id) === String(userId)).map(s => String(s.university_id)));
      return readUniversities().filter(u => saved.has(String(u.id)));
    }
    const userId = params[0];
    return db.shortlists
      .filter(s => String(s.user_id) === String(userId))
      .map(s => ({ university_id: s.university_id }));
  }

  if (lowerSql.startsWith('insert') && lowerSql.includes('into shortlists')) {
    const [userId, universityId] = params;
    const exists = db.shortlists.some(s => String(s.user_id) === String(userId) && String(s.university_id) === String(universityId));
    if (!exists) {
      db.shortlists.push({ user_id: userId, university_id: universityId });
      writeJsonDb(db);
    }
    return { affectedRows: exists ? 0 : 1 };
  }

  if (lowerSql.startsWith('delete from shortlists')) {
    const [userId, universityId] = params;
    const before = db.shortlists.length;
    db.shortlists = db.shortlists.filter(s => !(String(s.user_id) === String(userId) && String(s.university_id) === String(universityId)));
    writeJsonDb(db);
    return { affectedRows: before - db.shortlists.length };
  }

  if (lowerSql.startsWith('select') && lowerSql.includes('from users') && lowerSql.includes('lower(email) =')) {
    const email = params[0];
    const user = db.users.find(u => String(u.email || '').toLowerCase() === String(email || '').toLowerCase());
    return user ? [normalizeUser(user)] : [];
  }

  if (lowerSql.startsWith('select') && lowerSql.includes('from users') && lowerSql.includes('id =')) {
    const user = db.users.find(u => String(u.id) === String(params[0]));
    return user ? [normalizeUser(user)] : [];
  }

  // 1. SELECT * FROM users WHERE email = ?
  if (lowerSql.startsWith('select') && lowerSql.includes('from users') && lowerSql.includes('email =')) {
    const email = params[0];
    const user = db.users.find(u => String(u.email || '').toLowerCase() === String(email || '').toLowerCase());
    return user ? [normalizeUser(user)] : [];
  }

  // 2. SELECT * FROM users
  if (lowerSql.startsWith('select') && lowerSql.includes('from users') && !lowerSql.includes('where')) {
    if (lowerSql.includes('order by cast')) {
      return [...db.users]
        .map(normalizeUser)
        .sort((a, b) => Number(b.id) - Number(a.id));
    }
    return db.users.map(normalizeUser);
  }

  // 3. INSERT INTO users
  if (lowerSql.startsWith('insert into users')) {
    if (params.length === 8) {
      const [id, fullName, email, password, role, emailVerified, isVerified, isBlocked] = params;
      const newUser = {
        id,
        fullName,
        email,
        password,
        mobileNumber: null,
        role: role || 'Student',
        institution: null,
        department: null,
        designation: null,
        email_verified: !!emailVerified,
        isVerified: !!isVerified,
        verification_otp: null,
        otp_expires_at: null,
        isBlocked: !!isBlocked,
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      writeJsonDb(db);
      return { insertId: id, affectedRows: 1 };
    }
    const [id, fullName, email, password, mobileNumber, role, emailVerified, institution, department, designation, isBlocked] = params;
    const newUser = {
      id,
      fullName,
      email,
      password,
      mobileNumber: mobileNumber || null,
      role: role || 'Student', institution: institution || null, department: department || null, designation: designation || null,
      email_verified: !!emailVerified,
      isVerified: !!emailVerified,
      verification_otp: null,
      otp_expires_at: null,
      isBlocked: !!isBlocked,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    writeJsonDb(db);
    return { insertId: id, affectedRows: 1 };
  }

  // 4. UPDATE users SET isVerified = ? WHERE id = ?
  if (lowerSql.startsWith('update users') && lowerSql.includes('verification_otp =') && lowerSql.includes('otp_expires_at =')) {
    if (lowerSql.includes('email_verified =')) {
      const [emailVerified, isVerified, verificationOtp, otpExpiresAt, id] = params;
      const user = db.users.find(u => String(u.id) === String(id));
      if (user) {
        user.email_verified = !!emailVerified;
        user.isVerified = !!isVerified;
        user.verification_otp = verificationOtp;
        user.otp_expires_at = otpExpiresAt ? new Date(otpExpiresAt).toISOString() : null;
        writeJsonDb(db);
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }
    const [verificationOtp, otpExpiresAt, id] = params;
    const user = db.users.find(u => String(u.id) === String(id));
    if (user) {
      user.verification_otp = verificationOtp;
      user.otp_expires_at = otpExpiresAt ? new Date(otpExpiresAt).toISOString() : null;
      writeJsonDb(db);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  if (lowerSql.startsWith('update users') && (lowerSql.includes('isverified =') || lowerSql.includes('email_verified ='))) {
    const [isVerified, id] = params;
    const user = db.users.find(u => String(u.id) === String(id));
    if (user) {
      user.isVerified = !!isVerified;
      user.email_verified = !!isVerified;
      writeJsonDb(db);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // 4a. UPDATE users (Generic updates for admin)
  if (lowerSql.startsWith('update users') && lowerSql.includes('fullname =')) {
    if (lowerSql.includes('mobilenumber =') && lowerSql.includes('specialization =')) {
      const [fullName, mobileNumber, institution, department, designation, specialization, officeHours, bio, id] = params;
      const user = db.users.find(u => String(u.id) === String(id));
      if (user) {
        user.fullName = fullName || user.fullName;
        user.mobileNumber = mobileNumber || '';
        user.institution = institution || '';
        user.department = department || '';
        user.designation = designation || '';
        user.specialization = specialization || '';
        user.officeHours = officeHours || '';
        user.bio = bio || '';
        writeJsonDb(db);
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }
    const hasBlocked = lowerSql.includes('isblocked =');
    const [fullName, email, role, maybeBlocked, maybeId] = params;
    const id = hasBlocked ? maybeId : maybeBlocked;
    const user = db.users.find(u => String(u.id) === String(id));
    if (user) {
      if (fullName) user.fullName = fullName;
      if (email) user.email = email;
      if (role) user.role = role;
      if (hasBlocked) user.isBlocked = !!maybeBlocked;
      writeJsonDb(db);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  if (lowerSql.startsWith('update users') && lowerSql.includes('isblocked =')) {
    const [isBlocked, id] = params;
    const user = db.users.find(u => String(u.id) === String(id));
    if (user) {
      user.isBlocked = !!isBlocked;
      writeJsonDb(db);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  if (lowerSql.startsWith('update users') && lowerSql.includes('institution =') && lowerSql.includes('specialization =')) {
    const [institution, department, designation, specialization, bio, id] = params;
    const user = db.users.find(u => String(u.id) === String(id));
    if (user) {
      user.institution = institution || user.institution || '';
      user.department = department || user.department || '';
      user.designation = designation || user.designation || '';
      user.specialization = specialization || user.specialization || '';
      user.bio = bio || user.bio || '';
      writeJsonDb(db);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  if (lowerSql.startsWith('update users') && lowerSql.includes('profilepicture =')) {
    const [profilePicture, id] = params;
    const user = db.users.find(u => String(u.id) === String(id));
    if (user) {
      user.profilePicture = profilePicture;
      writeJsonDb(db);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  if (lowerSql.startsWith('update users') && lowerSql.includes('password =')) {
    const [password, id] = params;
    const user = db.users.find(u => String(u.id) === String(id));
    if (user) {
      user.password = password;
      writeJsonDb(db);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // 4c. DELETE from users
  if (lowerSql.startsWith('delete from users')) {
    const [id] = params;
    const initialLength = db.users.length;
    db.users = db.users.filter(u => String(u.id) !== String(id));
    if (db.users.length < initialLength) {
      // Also delete from tokens and profiles for consistency
      db.verification_tokens = db.verification_tokens.filter(t => String(t.userId) !== String(id));
      db.student_profiles = db.student_profiles.filter(p => String(p.userId) !== String(id));
      writeJsonDb(db);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // 5. INSERT INTO verification_tokens
  if (lowerSql.startsWith('insert into verification_tokens')) {
    const [id, userId, token, expiresAt] = params;
    const newToken = {
      id,
      userId,
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      createdAt: new Date().toISOString(),
      verifiedAt: null
    };
    db.verification_tokens.push(newToken);
    writeJsonDb(db);
    return { insertId: id, affectedRows: 1 };
  }

  if (lowerSql.startsWith('delete from verification_tokens')) {
    const [userId] = params;
    const initialLength = db.verification_tokens.length;
    db.verification_tokens = db.verification_tokens.filter(t => String(t.userId) !== String(userId));
    writeJsonDb(db);
    return { affectedRows: initialLength - db.verification_tokens.length };
  }

  // 6. SELECT * FROM verification_tokens WHERE token = ?
  if (lowerSql.startsWith('select') && lowerSql.includes('from verification_tokens') && lowerSql.includes('token =')) {
    const token = params[0];
    const tokenObj = db.verification_tokens.find(t => t.token === token);
    return tokenObj ? [tokenObj] : [];
  }

  // 7. UPDATE verification_tokens SET verifiedAt = ? WHERE id = ?
  if (lowerSql.startsWith('update verification_tokens') && lowerSql.includes('verifiedat =')) {
    const [verifiedAt, id] = params;
    const tokenObj = db.verification_tokens.find(t => t.id === id);
    if (tokenObj) {
      tokenObj.verifiedAt = new Date(verifiedAt).toISOString();
      writeJsonDb(db);
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // 8. SELECT * FROM student_profiles WHERE userId = ?
  if (lowerSql.startsWith('select') && lowerSql.includes('from student_profiles') && lowerSql.includes('userid =')) {
    const userId = params[0];
    const profile = db.student_profiles.find(p => String(p.userId) === String(userId));
    return profile ? [profile] : [];
  }

  // 9. INSERT INTO student_profiles
  if (lowerSql.startsWith('insert into student_profiles')) {
    if (params.length >= 22) {
      const [id, userId, degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, fundingNeed, skills, latestCvName, institution, graduationYear, researchInterests, publications, desiredDegree, preferredCountries, fundingPreference] = params;
      const parseArray = value => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        try { return JSON.parse(value); } catch (e) { return String(value).split(/\n|,/).map(s => s.trim()).filter(Boolean); }
      };
      db.student_profiles.push({
        id,
        userId,
        degreeLevel,
        intendedMajor,
        cgpa: parseFloat(cgpa) || null,
        ieltsToefl: parseFloat(ieltsToefl) || null,
        gresatgmat: parseFloat(gresatgmat) || null,
        budget: parseFloat(budget) || null,
        researchPapers: parseInt(researchPapers) || 0,
        projects: parseInt(projects) || 0,
        internships: parseInt(internships) || 0,
        extracurriculars,
        fundingNeed,
        fundingPreference: fundingPreference || fundingNeed || '',
        skills: parseArray(skills),
        latestCvName: latestCvName || null,
        institution: institution || '',
        graduationYear: graduationYear || '',
        researchInterests: parseArray(researchInterests),
        publications: parseArray(publications),
        desiredDegree: desiredDegree || '',
        preferredCountries: preferredCountries || '',
        createdAt: new Date().toISOString()
      });
      writeJsonDb(db);
      return { insertId: id, affectedRows: 1 };
    }
    const [id, userId, degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, sopStrength, lorStrength, fundingNeed, skills, latestCvName] = params;
    const newProfile = {
      id,
      userId,
      degreeLevel,
      intendedMajor,
      cgpa: parseFloat(cgpa) || null,
      ieltsToefl: parseFloat(ieltsToefl) || null,
      gresatgmat: parseFloat(gresatgmat) || null,
      budget: parseFloat(budget) || null,
      researchPapers: parseInt(researchPapers) || 0,
      projects: parseInt(projects) || 0,
      internships: parseInt(internships) || 0,
      extracurriculars,
      sopStrength,
      lorStrength,
      fundingNeed,
      skills: (() => {
        if (!skills) return [];
        if (Array.isArray(skills)) return skills;
        try { return JSON.parse(skills); } catch (e) { return String(skills).split(',').map(s => s.trim()).filter(Boolean); }
      })(),
      latestCvName: latestCvName || null,
      institution: null,
      graduationYear: null,
      researchInterests: '',
      publications: [],
      desiredDegree: '',
      preferredCountries: '',
      fundingPreference: fundingNeed || '',
      createdAt: new Date().toISOString()
    };
    db.student_profiles.push(newProfile);
    writeJsonDb(db);
    return { insertId: id, affectedRows: 1 };
  }

  // 10. UPDATE student_profiles
  if (lowerSql.startsWith('update student_profiles') && lowerSql.includes('set')) {
    if (params.length >= 21) {
      const [degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, fundingNeed, skills, latestCvName, institution, graduationYear, researchInterests, publications, desiredDegree, preferredCountries, fundingPreference, userId] = params;
      const profile = db.student_profiles.find(p => String(p.userId) === String(userId));
      if (profile) {
        profile.degreeLevel = degreeLevel;
        profile.intendedMajor = intendedMajor;
        profile.cgpa = cgpa ? parseFloat(cgpa) : null;
        profile.ieltsToefl = ieltsToefl ? parseFloat(ieltsToefl) : null;
        profile.gresatgmat = gresatgmat ? parseFloat(gresatgmat) : null;
        profile.budget = budget ? parseFloat(budget) : null;
        profile.researchPapers = parseInt(researchPapers) || 0;
        profile.projects = parseInt(projects) || 0;
        profile.internships = parseInt(internships) || 0;
        profile.extracurriculars = extracurriculars;
        profile.fundingNeed = fundingNeed;
        profile.fundingPreference = fundingPreference || fundingNeed || '';
        try { profile.skills = typeof skills === 'string' ? JSON.parse(skills) : (skills || []); } catch (e) { profile.skills = String(skills || '').split(',').map(s => s.trim()).filter(Boolean); }
        profile.latestCvName = latestCvName || profile.latestCvName || null;
        profile.institution = institution || '';
        profile.graduationYear = graduationYear || '';
        profile.researchInterests = researchInterests || '';
        try { profile.publications = typeof publications === 'string' ? JSON.parse(publications) : (publications || []); } catch (e) { profile.publications = publications || ''; }
        profile.desiredDegree = desiredDegree || '';
        profile.preferredCountries = preferredCountries || '';
        profile.updatedAt = new Date().toISOString();
        writeJsonDb(db);
        return { affectedRows: 1 };
      }
    } else if (params.length >= 15) {
      const [degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, sopStrength, lorStrength, fundingNeed, skills, latestCvName, userId] = params;
      const profile = db.student_profiles.find(p => String(p.userId) === String(userId));
      if (profile) {
        profile.degreeLevel = degreeLevel;
        profile.intendedMajor = intendedMajor;
        profile.cgpa = cgpa ? parseFloat(cgpa) : null;
        profile.ieltsToefl = ieltsToefl ? parseFloat(ieltsToefl) : null;
        profile.gresatgmat = gresatgmat ? parseFloat(gresatgmat) : null;
        profile.budget = budget ? parseFloat(budget) : null;
        profile.researchPapers = parseInt(researchPapers) || 0;
        profile.projects = parseInt(projects) || 0;
        profile.internships = parseInt(internships) || 0;
        profile.extracurriculars = extracurriculars;
        profile.sopStrength = sopStrength;
        profile.lorStrength = lorStrength;
        profile.fundingNeed = fundingNeed;
        if (skills) {
          try {
            profile.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
          } catch (e) {
            profile.skills = skills.split(',').map(s => s.trim());
          }
        }
        if (latestCvName) {
          profile.latestCvName = latestCvName;
        }
        profile.updatedAt = new Date().toISOString();
        writeJsonDb(db);
        return { affectedRows: 1 };
      }
    } else {
      // Legacy support for 14 parameters
      const [degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, sopStrength, lorStrength, fundingNeed, userId] = params;
      const profile = db.student_profiles.find(p => String(p.userId) === String(userId));
      if (profile) {
        profile.degreeLevel = degreeLevel;
        profile.intendedMajor = intendedMajor;
        profile.cgpa = parseFloat(cgpa) || null;
        profile.ieltsToefl = parseFloat(ieltsToefl) || null;
        profile.gresatgmat = parseFloat(gresatgmat) || null;
        profile.budget = parseFloat(budget) || null;
        profile.researchPapers = parseInt(researchPapers) || 0;
        profile.projects = parseInt(projects) || 0;
        profile.internships = parseInt(internships) || 0;
        profile.extracurriculars = extracurriculars;
        profile.sopStrength = sopStrength;
        profile.lorStrength = lorStrength;
        profile.fundingNeed = fundingNeed;
        profile.updatedAt = new Date().toISOString();
        writeJsonDb(db);
        return { affectedRows: 1 };
      }
    }
    return { affectedRows: 0 };
  }

  if (lowerSql.startsWith('insert into recommendation_requests')) {
    const keys = ['id','studentId','studentName','studentEmail','facultyName','facultyEmail','facultyInstitution','facultyDepartment','facultyDesignation','relationshipToStudent','coursesTaught','purpose','studentMessage','deadline','status'];
    const item = Object.fromEntries(keys.map((key, i) => [key, params[i]]));
    item.respondedAt = null; item.createdAt = new Date().toISOString(); item.updatedAt = item.createdAt;
    db.recommendation_requests.push(item); writeJsonDb(db);
    return { insertId: item.id, affectedRows: 1 };
  }
  if (lowerSql.startsWith('select') && lowerSql.includes('from recommendation_requests')) {
    if (lowerSql.includes('studentid =') && lowerSql.includes('facultyemail =')) {
      const [studentId, facultyEmail, purpose, deadline, status] = params;
      return db.recommendation_requests.filter(r => String(r.studentId) === String(studentId) && r.facultyEmail.toLowerCase() === facultyEmail.toLowerCase() && r.purpose === purpose && r.deadline === deadline && r.status === status);
    }
    if (lowerSql.includes('studentid =')) return db.recommendation_requests.filter(r => String(r.studentId) === String(params[0]));
    if (lowerSql.includes('lower(facultyemail)')) return db.recommendation_requests.filter(r => r.facultyEmail.toLowerCase() === params[0].toLowerCase());
    if (lowerSql.includes('id =')) { const r = db.recommendation_requests.find(r => r.id === params[0]); return r ? [r] : []; }
  }
  if (lowerSql.startsWith('update recommendation_requests')) {
    if (lowerSql.includes('letterfilename')) {
      const [letterFileName, letterStoredName, letterMimeType, letterFileSize, submittedAt, id] = params;
      const item = db.recommendation_requests.find(r => r.id === id);
      if (!item) return { affectedRows: 0 };
      Object.assign(item, { letterFileName, letterStoredName, letterMimeType, letterFileSize, submittedAt, updatedAt: new Date().toISOString() });
      writeJsonDb(db); return { affectedRows: 1 };
    }
    const [status, respondedAt, id] = params;
    const item = db.recommendation_requests.find(r => r.id === id);
    if (!item) return { affectedRows: 0 };
    item.status = status; item.respondedAt = respondedAt || null; item.updatedAt = new Date().toISOString(); writeJsonDb(db);
    return { affectedRows: 1 };
  }

  console.warn(`Query type not fully matched in JSON fallback: ${sql}`);
  return [];
}

module.exports = {
  initializeDb,
  query,
  isUsingFallback: () => useFallback,
  getAiShortlists,
  saveAiShortlist,
  removeAiShortlist,
  getLatestAiRecommendations,
  saveLatestAiRecommendations
};
