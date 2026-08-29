<?php
$localDb = json_decode(file_get_contents('C:\Users\This PC\Downloads\UniScout_1.5.1\UniScout_1.5\backend\data\local_db.json'), true);

$sql = "CREATE DATABASE IF NOT EXISTS uniscout;\nUSE uniscout;\n\n";

// Ensure tables exist
$sql .= "
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
  specialization VARCHAR(255),
  officeHours VARCHAR(255),
  bio TEXT,
  profilePicture VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verifiedAt TIMESTAMP NULL
);

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
  skills TEXT,
  latestCvName VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS recommendation_requests (
  id VARCHAR(36) PRIMARY KEY,
  studentId VARCHAR(36) NOT NULL,
  studentName VARCHAR(255) NOT NULL,
  studentEmail VARCHAR(255) NOT NULL,
  facultyName VARCHAR(255) NOT NULL,
  facultyEmail VARCHAR(255) NOT NULL,
  facultyInstitution VARCHAR(255), 
  facultyDepartment VARCHAR(255), 
  facultyDesignation VARCHAR(255),
  relationshipToStudent VARCHAR(255) NOT NULL, 
  coursesTaught TEXT, 
  purpose VARCHAR(255) NOT NULL,
  studentMessage TEXT, 
  deadline DATE NOT NULL,
  status ENUM('pending','accepted','declined','cancelled') DEFAULT 'pending',
  respondedAt TIMESTAMP NULL, 
  letterFileName VARCHAR(255), 
  letterStoredName VARCHAR(255),
  letterMimeType VARCHAR(100), 
  letterFileSize INT, 
  submittedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rec_student (studentId), 
  INDEX idx_rec_faculty_email (facultyEmail)
);

CREATE TABLE IF NOT EXISTS shortlists (
  user_id VARCHAR(36) NOT NULL,
  university_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (user_id, university_id)
);
\n";

function esc($str) {
    if ($str === null) return "NULL";
    return "'" . addslashes((string)$str) . "'";
}

// 1. Users
foreach ($localDb['users'] as $u) {
    $ev = !empty($u['email_verified']) ? 1 : 0;
    $iv = !empty($u['isVerified']) ? 1 : 0;
    $ib = !empty($u['isBlocked']) ? 1 : 0;
    $pw = esc($u['password'] ?? '1234');
    if (strpos($pw, '$2') === 1) {
        $pw = esc($u['role'] === 'Faculty' ? '123456' : '1234');
    }
    
    $sql .= "INSERT IGNORE INTO users (id, fullName, email, password, mobileNumber, role, institution, department, designation, email_verified, isVerified, isBlocked, verification_otp, otp_expires_at, specialization, officeHours, bio) VALUES (" . 
            esc($u['id']) . ", " . esc($u['fullName']) . ", " . esc($u['email']) . ", " . $pw . ", " . 
            esc($u['mobileNumber'] ?? null) . ", " . esc($u['role'] ?? 'Student') . ", " . 
            esc($u['institution'] ?? null) . ", " . esc($u['department'] ?? null) . ", " . 
            esc($u['designation'] ?? null) . ", $ev, $iv, $ib, " . 
            esc($u['verification_otp'] ?? null) . ", " . 
            esc($u['otp_expires_at'] ? date('Y-m-d H:i:s', strtotime($u['otp_expires_at'])) : null) . ", " .
            esc($u['specialization'] ?? '') . ", " . esc($u['officeHours'] ?? '') . ", " . esc($u['bio'] ?? '') . ");\n";
}

// 2. Student Profiles
foreach ($localDb['student_profiles'] as $p) {
    $skills = isset($p['skills']) ? esc(json_encode($p['skills'])) : "'[]'";
    $sql .= "INSERT IGNORE INTO student_profiles (id, userId, degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, sopStrength, lorStrength, fundingNeed, skills, latestCvName) VALUES (" .
            esc($p['id']) . ", " . esc($p['userId']) . ", " . esc($p['degreeLevel'] ?? null) . ", " . 
            esc($p['intendedMajor'] ?? null) . ", " . esc($p['cgpa'] ?? null) . ", " . 
            esc($p['ieltsToefl'] ?? null) . ", " . esc($p['gresatgmat'] ?? null) . ", " . 
            esc($p['budget'] ?? null) . ", " . ((int)($p['researchPapers'] ?? 0)) . ", " . 
            ((int)($p['projects'] ?? 0)) . ", " . ((int)($p['internships'] ?? 0)) . ", " . 
            esc($p['extracurriculars'] ?? null) . ", " . esc($p['sopStrength'] ?? null) . ", " . 
            esc($p['lorStrength'] ?? null) . ", " . esc($p['fundingNeed'] ?? null) . ", " . 
            $skills . ", " . esc($p['latestCvName'] ?? null) . ");\n";
}

// 3. Verification Tokens
foreach ($localDb['verification_tokens'] as $t) {
    $sql .= "INSERT IGNORE INTO verification_tokens (id, userId, token, expiresAt, createdAt, verifiedAt) VALUES (" .
            esc($t['id']) . ", " . esc($t['userId']) . ", " . esc($t['token']) . ", " . 
            esc(date('Y-m-d H:i:s', strtotime($t['expiresAt']))) . ", " . 
            esc(date('Y-m-d H:i:s', strtotime($t['createdAt']))) . ", " . 
            esc($t['verifiedAt'] ? date('Y-m-d H:i:s', strtotime($t['verifiedAt'])) : null) . ");\n";
}

// 4. Recommendation Requests
foreach ($localDb['recommendation_requests'] as $r) {
    $sql .= "INSERT IGNORE INTO recommendation_requests (id, studentId, studentName, studentEmail, facultyName, facultyEmail, facultyInstitution, facultyDepartment, facultyDesignation, relationshipToStudent, coursesTaught, purpose, studentMessage, deadline, status, respondedAt, letterFileName, letterStoredName, letterMimeType, letterFileSize, submittedAt) VALUES (" .
            esc($r['id']) . ", " . esc($r['studentId']) . ", " . esc($r['studentName']) . ", " . 
            esc($r['studentEmail']) . ", " . esc($r['facultyName']) . ", " . esc($r['facultyEmail']) . ", " . 
            esc($r['facultyInstitution'] ?? null) . ", " . esc($r['facultyDepartment'] ?? null) . ", " . 
            esc($r['facultyDesignation'] ?? null) . ", " . esc($r['relationshipToStudent']) . ", " . 
            esc($r['coursesTaught'] ?? null) . ", " . esc($r['purpose']) . ", " . 
            esc($r['studentMessage'] ?? null) . ", " . esc($r['deadline']) . ", " . 
            esc($r['status'] ?? 'pending') . ", " . 
            esc($r['respondedAt'] ? date('Y-m-d H:i:s', strtotime($r['respondedAt'])) : null) . ", " . 
            esc($r['letterFileName'] ?? null) . ", " . esc($r['letterStoredName'] ?? null) . ", " . 
            esc($r['letterMimeType'] ?? null) . ", " . esc($r['letterFileSize'] ?? null) . ", " . 
            esc($r['submittedAt'] ? date('Y-m-d H:i:s', strtotime($r['submittedAt'])) : null) . ");\n";
}

file_put_contents('C:\Users\This PC\Downloads\UniScout_1.5.1\UniScout_1.5\backend\migrate.sql', $sql);
echo "SQL generated";
?>
