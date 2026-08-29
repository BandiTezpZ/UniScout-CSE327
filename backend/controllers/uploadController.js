const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseCV, parseFacultyCV } = require('../utils/cvParser');
const db = require('../config/db');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer memory storage configuration
const storage = multer.memoryStorage();

// Multer disk storage for Images
const picStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const picFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed!'));
};

const uploadPic = multer({
  storage: picStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: picFilter
}).single('profilePicture');

const uniPicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'uni-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadUniPic = multer({
  storage: uniPicStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: picFilter
}).single('universityPicture');

// Strictly validate PDF mimetype and file extension
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only PDF files (.pdf) are allowed!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
}).single('cv');

// Handles CV upload, parsing, and DB profile update
exports.uploadCV = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // MIME type and extension can be spoofed. Verify the PDF file signature too.
    if (req.file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return res.status(400).json({ message: 'The uploaded file is not a valid PDF document' });
    }

    try {
      const parsedData = await parseCV(req.file.buffer);

      // Check if student profile exists
      const existingProfiles = await db.query(
        'SELECT * FROM student_profiles WHERE userId = ?',
        [req.user.id]
      );

      if (existingProfiles.length > 0) {
        const current = existingProfiles[0];
        
        // The user explicitly requested: "old information from cv should be replaced by new parsed information"
        // This means ANY field that the CV parser handles should be entirely overwritten by the new parsedData (even if null).
        // Only preserve strictly manual fields that the CV parser NEVER outputs.
        const degreeLevel = parsedData.degreeLevel;
        const intendedMajor = parsedData.intendedMajor;
        const cgpa = parsedData.cgpa;
        const ieltsToefl = parsedData.ieltsToefl;
        const gresatgmat = parsedData.gresatgmat;
        const researchPapers = parsedData.researchPapers;
        const projects = parsedData.projects;
        const internships = parsedData.internships;
        
        // Manual fields (preserve these since parser doesn't provide them, or they are primarily manual)
        const budget = current.budget;
        const extracurriculars = parsedData.extracurriculars || current.extracurriculars;
        const fundingNeed = parsedData.fundingNeed || current.fundingNeed;
        
        const safeParse = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try { return JSON.parse(val); } catch (e) { return typeof val === 'string' ? val.split(',').map(s => s.trim()) : []; }
        };
        
        const skills = safeParse(current.skills); // manual
        
        const researchInterests = parsedData.researchInterests || [];
        const publications = parsedData.publications || [];
        
        const institution = parsedData.institution || current.institution;
        const graduationYear = parsedData.graduationYear || current.graduationYear;
        const desiredDegree = current.desiredDegree;
        const preferredCountries = current.preferredCountries;
        const fundingPreference = current.fundingPreference;

        // Update existing profile
        await db.query(
          `UPDATE student_profiles SET 
            degreeLevel = ?, intendedMajor = ?, cgpa = ?, ieltsToefl = ?, 
            gresatgmat = ?, budget = ?, researchPapers = ?, projects = ?, 
            internships = ?, extracurriculars = ?, fundingNeed = ?, skills = ?, latestCvName = ?,
            institution = ?, graduationYear = ?, researchInterests = ?, publications = ?, desiredDegree = ?, preferredCountries = ?, fundingPreference = ?
           WHERE userId = ?`,
          [
            degreeLevel,
            intendedMajor,
            cgpa,
            ieltsToefl,
            gresatgmat,
            budget,
            researchPapers,
            projects,
            internships,
            extracurriculars,
            fundingNeed,
            JSON.stringify(skills),
            req.file.originalname,
            institution,
            graduationYear,
            JSON.stringify(researchInterests),
            JSON.stringify(publications),
            desiredDegree,
            preferredCountries,
            fundingPreference,
            req.user.id
          ]
        );
        
        // Update parsedData so that the frontend gets the merged data
        Object.assign(parsedData, {
          degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget,
          researchPapers, projects, internships, extracurriculars, fundingNeed,
          skills, institution, graduationYear, researchInterests, publications,
          desiredDegree, preferredCountries, fundingPreference
        });
      } else {
        // Insert new profile (just in case they don't have one initialized)
        const { v4: uuidv4 } = require('uuid');
        const profileId = uuidv4();
        await db.query(
          `INSERT INTO student_profiles 
            (id, userId, degreeLevel, intendedMajor, cgpa, ieltsToefl, 
             gresatgmat, budget, researchPapers, projects, internships, 
             extracurriculars, fundingNeed, skills, latestCvName, institution, graduationYear, researchInterests, publications, desiredDegree, preferredCountries, fundingPreference) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            profileId,
            req.user.id,
            parsedData.degreeLevel,
            parsedData.intendedMajor,
            parsedData.cgpa,
            parsedData.ieltsToefl,
            parsedData.gresatgmat,
            null,
            parsedData.researchPapers,
            parsedData.projects,
            parsedData.internships,
            parsedData.extracurriculars,
            parsedData.fundingNeed,
            JSON.stringify(parsedData.skills || []),
            req.file.originalname,
            parsedData.institution || null,
            parsedData.graduationYear || null,
            JSON.stringify(parsedData.researchInterests || []),
            JSON.stringify(parsedData.publications || []),
            null,
            null,
            parsedData.fundingNeed || null
          ]
        );
      }

      res.status(200).json({
        message: 'CV uploaded and parsed successfully!',
        fileName: req.file.originalname,
        fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
        parsedData
      });
    } catch (parseError) {
      console.error('Error handling CV upload:', parseError);
      res.status(500).json({ message: parseError.message || 'Error parsing CV document' });
    }
  });
};

// Fetch student profile route
exports.getProfile = async (req, res) => {
  try {
    const profiles = await db.query(
      'SELECT * FROM student_profiles WHERE userId = ?',
      [req.user.id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const profile = profiles[0];
    if (profile.skills) {
      try {
        profile.skills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills;
      } catch (e) {
        profile.skills = profile.skills.split(',').map(s => s.trim());
      }
    } else {
      profile.skills = [];
    }
    for (const field of ['publications', 'researchInterests']) {
      if (profile[field]) {
        try {
          profile[field] = typeof profile[field] === 'string' ? JSON.parse(profile[field]) : profile[field];
        } catch (e) {
          profile[field] = String(profile[field]).split('\n').map(item => item.trim()).filter(Boolean);
        }
      } else {
        profile[field] = [];
      }
    }

    res.status(200).json({
      profile: profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Manually update student profile details
exports.updateProfileManual = async (req, res) => {
  const {
    degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget,
    researchPapers, projects, internships, extracurriculars,
    fundingNeed, skills, latestCvName, institution, graduationYear,
    researchInterests, publications, desiredDegree, preferredCountries, fundingPreference
  } = req.body;

  try {
    // Check if student profile exists
    const existingProfiles = await db.query(
      'SELECT * FROM student_profiles WHERE userId = ?',
      [req.user.id]
    );

    if (existingProfiles.length > 0) {
      await db.query(
        `UPDATE student_profiles SET 
          degreeLevel = ?, intendedMajor = ?, cgpa = ?, ieltsToefl = ?, 
          gresatgmat = ?, budget = ?, researchPapers = ?, projects = ?, 
          internships = ?, extracurriculars = ?, fundingNeed = ?, skills = ?, latestCvName = ?,
          institution = ?, graduationYear = ?, researchInterests = ?, publications = ?, desiredDegree = ?, preferredCountries = ?, fundingPreference = ?
         WHERE userId = ?`,
        [
          degreeLevel,
          intendedMajor,
          cgpa ? parseFloat(cgpa) : null,
          ieltsToefl ? parseFloat(ieltsToefl) : null,
          gresatgmat ? parseFloat(gresatgmat) : null,
          budget ? parseFloat(budget) : null,
          researchPapers ? parseInt(researchPapers) : 0,
          projects ? parseInt(projects) : 0,
          internships ? parseInt(internships) : 0,
          extracurriculars,
          fundingNeed,
          skills ? (Array.isArray(skills) ? JSON.stringify(skills) : skills) : '[]',
          latestCvName || null,
          institution || null,
          graduationYear || null,
          researchInterests ? (Array.isArray(researchInterests) ? JSON.stringify(researchInterests) : researchInterests) : '[]',
          publications ? (Array.isArray(publications) ? JSON.stringify(publications) : publications) : '[]',
          desiredDegree || null,
          preferredCountries ? (Array.isArray(preferredCountries) ? JSON.stringify(preferredCountries) : preferredCountries) : null,
          fundingPreference || fundingNeed || null,
          req.user.id
        ]
      );
    } else {
      const { v4: uuidv4 } = require('uuid');
      const profileId = uuidv4();
      await db.query(
        `INSERT INTO student_profiles 
          (id, userId, degreeLevel, intendedMajor, cgpa, ieltsToefl, 
           gresatgmat, budget, researchPapers, projects, internships, 
           extracurriculars, fundingNeed, skills, latestCvName, institution, graduationYear, researchInterests, publications, desiredDegree, preferredCountries, fundingPreference) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profileId,
          req.user.id,
          degreeLevel,
          intendedMajor,
          cgpa ? parseFloat(cgpa) : null,
          ieltsToefl ? parseFloat(ieltsToefl) : null,
          gresatgmat ? parseFloat(gresatgmat) : null,
          budget ? parseFloat(budget) : null,
          researchPapers ? parseInt(researchPapers) : 0,
          projects ? parseInt(projects) : 0,
          internships ? parseInt(internships) : 0,
          extracurriculars,
          fundingNeed,
          skills ? (Array.isArray(skills) ? JSON.stringify(skills) : skills) : '[]',
          latestCvName || null,
          institution || null,
          graduationYear || null,
          researchInterests ? (Array.isArray(researchInterests) ? JSON.stringify(researchInterests) : researchInterests) : '[]',
          publications ? (Array.isArray(publications) ? JSON.stringify(publications) : publications) : '[]',
          desiredDegree || null,
          preferredCountries ? (Array.isArray(preferredCountries) ? JSON.stringify(preferredCountries) : preferredCountries) : null,
          fundingPreference || fundingNeed || null
        ]
      );
    }

    res.status(200).json({ message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Error updating profile manually:', error.stack);
    res.status(500).json({ message: 'Internal server error during manual profile update' });
  }
};

exports.uploadProfilePicture = (req, res) => {
  uploadPic(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const imageUrl = '/uploads/' + req.file.filename;
      await db.query('UPDATE users SET profilePicture = ? WHERE id = ?', [imageUrl, req.user.id]);
      res.status(200).json({ message: 'Profile picture updated', imageUrl });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Database error' });
    }
  });
};

exports.uploadFacultyCV = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (req.file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return res.status(400).json({ message: 'Invalid PDF document' });
    }

    try {
      const currentRows = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
      const current = currentRows[0] || {};
      const parsedData = await parseFacultyCV(req.file.buffer);

      // Faculty parsing is intentionally conservative: keep manually entered
      // values when the parser cannot confidently identify a faculty field.
      const institution = parsedData.institution || current.institution || '';
      const department = parsedData.department || current.department || '';
      const designation = parsedData.designation || current.designation || '';
      const specialization = parsedData.specialization || current.specialization || '';
      const bio = parsedData.bio || current.bio || '';

      await db.query(
        'UPDATE users SET institution = ?, department = ?, designation = ?, specialization = ?, bio = ? WHERE id = ?',
        [institution, department, designation, specialization, bio, req.user.id]
      );

      res.status(200).json({
        message: 'Faculty CV parsed successfully!',
        parsedData: { institution, department, designation, specialization, bio }
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Error parsing CV' });
    }
  });
};

exports.uploadUniversityPicture = (req, res) => {
  uploadUniPic(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      const imageUrl = '/uploads/' + req.file.filename;
      res.status(200).json({ message: 'University picture uploaded', imageUrl });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
};
