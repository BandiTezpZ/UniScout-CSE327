require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDb, query, isUsingFallback } = require('./config/db');
const authController = require('./controllers/authController');
const uploadController = require('./controllers/uploadController');
const authMiddleware = require('./middleware/authMiddleware');
const recommendationRoutes = require('./routes/recommendationRoutes');
const universityRoutes = require('./routes/universityRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// 1. Auth Routing
app.post('/api/auth/register', authController.register);
app.post('/api/auth/verify', authController.verifyEmail);
app.post('/api/auth/resend-otp', authController.resendOtp);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/reset-password', authMiddleware, authController.resetPassword);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password-otp', authController.resetPasswordOtp);

// 2. Student Portal CV Upload & Profile Routing
app.post('/api/cv/upload', authMiddleware, uploadController.uploadCV);
app.get('/api/cv/profile', authMiddleware, uploadController.getProfile);
app.post('/api/cv/profile', authMiddleware, uploadController.updateProfileManual);

// Profile picture upload
app.post('/api/user/upload-picture', authMiddleware, uploadController.uploadProfilePicture);

// Faculty CV upload
app.post('/api/faculty/cv/upload', authMiddleware, uploadController.uploadFacultyCV);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/universities', universityRoutes);

// 3. Admin Routing (Get all registered users & profiles for verification demonstration)
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }

  try {
    const users = await query('SELECT id, fullName, email, role, email_verified, isVerified, isBlocked, createdAt, profilePicture FROM users');
    const profiles = await query('SELECT * FROM student_profiles');
    
    // Map profiles to users
    const usersWithProfiles = users.map(user => {
      const profile = profiles.find(p => String(p.userId) === String(user.id));
      return { 
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.email_verified ?? user.isVerified,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        profile: profile || null 
      };
    });

    res.status(200).json({ users: usersWithProfiles });
  } catch (error) {
    console.error('Error fetching admin users list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/admin/users/:id', authMiddleware, authController.updateUser);
app.delete('/api/admin/users/:id', authMiddleware, authController.deleteUser);
app.patch('/api/admin/users/:id/block', authMiddleware, authController.setUserBlocked);
app.post('/api/admin/users', authMiddleware, authController.adminCreateUser);

app.get('/api/faculty/profile', authMiddleware, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ message: 'Faculty role required' });
  const rows = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!rows.length) return res.status(404).json({ message: 'Faculty profile not found' });
  const user = rows[0];
  res.json({
    profile: {
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber || '',
      institution: user.institution || '',
      department: user.department || '',
      designation: user.designation || '',
      specialization: user.specialization || '',
      officeHours: user.officeHours || '',
      bio: user.bio || '',
      profilePicture: user.profilePicture || ''
    }
  });
});

app.post('/api/faculty/profile', authMiddleware, async (req, res) => {
  if (req.user.role !== 'Faculty') return res.status(403).json({ message: 'Faculty role required' });
  const { fullName, mobileNumber, institution, department, designation, specialization, officeHours, bio } = req.body;
  await query(
    'UPDATE users SET fullName = ?, mobileNumber = ?, institution = ?, department = ?, designation = ?, specialization = ?, officeHours = ?, bio = ? WHERE id = ?',
    [fullName, mobileNumber, institution, department, designation, specialization, officeHours, bio, req.user.id]
  );
  res.json({ message: 'Faculty profile updated successfully' });
});

// Test route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Start Server after DB initialization
async function startServer() {
  await initializeDb();
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Migrate Universities from CSV
    const csvPath = path.join(__dirname, 'data/universities.csv');
    const jsonPath = path.join(__dirname, 'data/universities.json');
    if (fs.existsSync(csvPath) && !fs.existsSync(jsonPath)) {
      console.log('Migrating universities from CSV...');
      
      const IMAGE_MAP = {
        'Massachusetts Institute of Technology': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/MIT_Main_Campus_Aerial.jpg/800px-MIT_Main_Campus_Aerial.jpg',
        'Stanford University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Stanford_University_Main_Quad_May_2011_001.jpg/800px-Stanford_University_Main_Quad_May_2011_001.jpg',
        'University of California, Berkeley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/UC_Berkeley_campus_overview_from_Lawrence_Hall_of_Science%2C_November_2022.jpg/800px-UC_Berkeley_campus_overview_from_Lawrence_Hall_of_Science%2C_November_2022.jpg',
        'University of Michigan-Ann Arbor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Law_Quad_University_of_Michigan.jpg/800px-Law_Quad_University_of_Michigan.jpg',
        'Harvard University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_Campus.jpg/800px-Harvard_University_Campus.jpg',
        'Princeton University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_University_Clio_Hall.jpg/800px-Princeton_University_Clio_Hall.jpg',
        'Cornell University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cornell_University_from_McGraw_Tower.jpg/800px-Cornell_University_from_McGraw_Tower.jpg',
        'Columbia University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Columbia_University_Low_Library.jpg/800px-Columbia_University_Low_Library.jpg',
        'University of Washington': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/University_of_Washington_Quad%2C_Spring_2019.jpg/800px-University_of_Washington_Quad%2C_Spring_2019.jpg',
        'University of California, Los Angeles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/UCLA_Royce_Hall.jpg/800px-UCLA_Royce_Hall.jpg',
        'University of California, San Diego': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Geisel_Library%2C_UCSD.jpg/800px-Geisel_Library%2C_UCSD.jpg',
        'Georgia Institute of Technology': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Tech_Tower_and_Tech_Green.jpg/800px-Tech_Tower_and_Tech_Green.jpg',
        'Carnegie Mellon University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Hamerschlag_Hall_Carnegie_Mellon_University.jpg/800px-Hamerschlag_Hall_Carnegie_Mellon_University.jpg',
        'University of Texas at Austin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/UT_Tower_University_of_Texas_Austin.jpg/800px-UT_Tower_University_of_Texas_Austin.jpg',
        'California Institute of Technology': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Caltech_Millikan_Library.jpg/800px-Caltech_Millikan_Library.jpg',
        'University of Pennsylvania': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/University_of_Pennsylvania_College_Hall.jpg/800px-University_of_Pennsylvania_College_Hall.jpg',
        'Purdue University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Purdue_University_Engineering_Fountain.jpg/800px-Purdue_University_Engineering_Fountain.jpg',
        'Duke University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Duke_Chapel_and_Quad.jpg/800px-Duke_Chapel_and_Quad.jpg',
        'New York University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Washington_Square_Park_NYU.jpg/800px-Washington_Square_Park_NYU.jpg',
        'Rice University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Rice_University_Academic_Quad.jpg/800px-Rice_University_Academic_Quad.jpg',
        'Brown University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Brown_University_University_Hall.jpg/800px-Brown_University_University_Hall.jpg',
        'Johns Hopkins University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Gilman_Hall_Johns_Hopkins_University.jpg/800px-Gilman_Hall_Johns_Hopkins_University.jpg',
        'University of Wisconsin-Madison': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Bascom_Hall_at_University_of_Wisconsin-Madison.jpg/800px-Bascom_Hall_at_University_of_Wisconsin-Madison.jpg'
      };

      const parseCsv = (text) => {
        const rows = [];
        let row = [];
        let value = '';
        let quoted = false;
        for (let i = 0; i < text.length; i += 1) {
          const char = text[i];
          const next = text[i + 1];
          if (char === '"' && quoted && next === '"') {
            value += '"';
            i += 1;
          } else if (char === '"') {
            quoted = !quoted;
          } else if (char === ',' && !quoted) {
            row.push(value);
            value = '';
          } else if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && next === '\n') i += 1;
            row.push(value);
            if (row.some(cell => cell !== '')) rows.push(row);
            row = [];
            value = '';
          } else {
            value += char;
          }
        }
        if (value || row.length) {
          row.push(value);
          rows.push(row);
        }
        const [headers, ...records] = rows;
        const cleanHeaders = headers.map(header => header.replace(/^\uFEFF/, '').trim());
        return records.map(record => Object.fromEntries(cleanHeaders.map((header, i) => [header, record[i] || ''])));
      };

      const csvText = fs.readFileSync(csvPath, 'utf8');
      const records = parseCsv(csvText);
      let index = 1;
      
      for (const item of records) {
        const name = item.university_name || item['\uFEFFuniversity_name'] || item.name || '';
        if (!name) continue;
        
        const tuition = Number(item.tuition_usd || 0);
        const living = Number(item.living_cost_usd || 0);
        const attendance = Number(item.cost_of_attendance_usd || tuition + living || 0);
        
        const uni = {
          id: item.id || String(index),
          university_name: name,
          country: item.country || 'USA',
          state: item.state || '',
          program: item.program || '',
          rank_tier: Number(item.rank_tier || 0),
          tuition_usd: tuition,
          living_cost_usd: living,
          cost_of_attendance_usd: attendance,
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
          imageUrl: item.imageUrl || IMAGE_MAP[name] || ''
        };
        
        try {
          await query(`
            INSERT INTO universities (
              id, university_name, country, state, program, rank_tier, tuition_usd, living_cost_usd, cost_of_attendance_usd, min_cgpa, min_ielts, min_gre, accepts_without_gre, research_level, ms_cs, research_category, intake, deadline, data_note, imageUrl
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              university_name=VALUES(university_name), program=VALUES(program), rank_tier=VALUES(rank_tier)
          `, [
            uni.id, uni.university_name, uni.country, uni.state, uni.program, uni.rank_tier, uni.tuition_usd, uni.living_cost_usd, uni.cost_of_attendance_usd, uni.min_cgpa, uni.min_ielts, uni.min_gre, uni.accepts_without_gre, uni.research_level, uni.ms_cs, uni.research_category, uni.intake, uni.deadline, uni.data_note, uni.imageUrl
          ]);
        } catch(e) {}
        index++;
      }
      // Save to universities.json to update the local .js database as requested
      fs.writeFileSync(path.join(__dirname, 'data/universities.json'), JSON.stringify(records, null, 2));
    }
    
    // The following migration block copies packaged JSON demo data into MySQL.
    // In JSON fallback mode the files are already the live database, so skip it
    // to avoid noisy duplicate INSERT attempts during a MySQL outage.
    if (isUsingFallback()) {
      console.log('MySQL unavailable — using JSON fallback. Skipping MySQL seed migration.');
    } else {
    // Migrate Shortlists
    const shortlistFile = path.join(__dirname, 'data/shortlists.json');
    if (fs.existsSync(shortlistFile)) {
      console.log('Migrating shortlists...');
      const shortlists = JSON.parse(fs.readFileSync(shortlistFile, 'utf8'));
      for (const userId in shortlists) {
        for (const uniId of shortlists[userId]) {
          try {
            await query('INSERT IGNORE INTO shortlists (user_id, university_id) VALUES (?, ?)', [userId, uniId]);
          } catch(e) {}
        }
      }
    }

    // Migrate users, profiles, tokens, and requests from local_db.json
    const localDbPath = path.join(__dirname, 'data/local_db.json');
    if (fs.existsSync(localDbPath)) {
      console.log('Migrating local_db.json to MySQL...');
      const localDb = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      
      if (localDb.users) {
        for (const u of localDb.users) {
          try {
            await query(`
              INSERT IGNORE INTO users (id, fullName, email, password, mobileNumber, role, institution, department, designation, email_verified, isVerified, isBlocked, verification_otp, otp_expires_at, specialization, officeHours, bio, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [u.id, u.fullName, u.email, u.password, u.mobileNumber || null, u.role, u.institution || null, u.department || null, u.designation || null, u.email_verified ? 1 : 0, u.isVerified ? 1 : 0, u.isBlocked ? 1 : 0, u.verification_otp || null, u.otp_expires_at ? new Date(u.otp_expires_at) : null, u.specialization || '', u.officeHours || '', u.bio || '', new Date(u.createdAt || Date.now())]);
          } catch(e) { console.error('Error inserting user:', e.message); }
        }
      }

      if (localDb.verification_tokens) {
        for (const t of localDb.verification_tokens) {
          try {
            await query('INSERT IGNORE INTO verification_tokens (id, userId, token, expiresAt, createdAt, verifiedAt) VALUES (?, ?, ?, ?, ?, ?)', [t.id, t.userId, t.token, new Date(t.expiresAt), new Date(t.createdAt), t.verifiedAt ? new Date(t.verifiedAt) : null]);
          } catch(e) {}
        }
      }

      if (localDb.student_profiles) {
        for (const p of localDb.student_profiles) {
          try {
            await query(`
              INSERT IGNORE INTO student_profiles (id, userId, degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, sopStrength, lorStrength, fundingNeed, skills, latestCvName, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [p.id, p.userId, p.degreeLevel || null, p.intendedMajor || null, p.cgpa || null, p.ieltsToefl || null, p.gresatgmat || null, p.budget || null, p.researchPapers || 0, p.projects || 0, p.internships || 0, p.extracurriculars || null, p.sopStrength || null, p.lorStrength || null, p.fundingNeed || null, p.skills ? JSON.stringify(p.skills) : '[]', p.latestCvName || null, new Date(p.createdAt || Date.now())]);
          } catch(e) {}
        }
      }

      if (localDb.recommendation_requests) {
        for (const r of localDb.recommendation_requests) {
          try {
            await query(`
              INSERT IGNORE INTO recommendation_requests (id, studentId, studentName, studentEmail, facultyName, facultyEmail, facultyInstitution, facultyDepartment, facultyDesignation, relationshipToStudent, coursesTaught, purpose, studentMessage, deadline, status, respondedAt, letterFileName, letterStoredName, letterMimeType, letterFileSize, submittedAt, createdAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [r.id, r.studentId, r.studentName, r.studentEmail, r.facultyName, r.facultyEmail, r.facultyInstitution || null, r.facultyDepartment || null, r.facultyDesignation || null, r.relationshipToStudent, r.coursesTaught || null, r.purpose, r.studentMessage || null, r.deadline, r.status || 'pending', r.respondedAt ? new Date(r.respondedAt) : null, r.letterFileName || null, r.letterStoredName || null, r.letterMimeType || null, r.letterFileSize || null, r.submittedAt ? new Date(r.submittedAt) : null, new Date(r.createdAt || Date.now())]);
          } catch(e) {}
        }
      }
    }
    }
  } catch (err) {
    require('fs').writeFileSync(require('path').join(__dirname, 'migration_error.log'), String(err) + '\n' + err.stack);
    console.error('Migration error:', err);
  }

  
  app.listen(PORT, () => {
    console.log(`UniScout API Server listening on port ${PORT}`);
  });
}

startServer();
