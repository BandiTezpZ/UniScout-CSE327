-- UniScout Database Schema Initialization
-- Database: uniscout

CREATE DATABASE IF NOT EXISTS uniscout;
USE uniscout;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS recommendation_requests (
    id VARCHAR(36) PRIMARY KEY, studentId INT NOT NULL,
    studentName VARCHAR(255) NOT NULL, studentEmail VARCHAR(255) NOT NULL,
    facultyName VARCHAR(255) NOT NULL, facultyEmail VARCHAR(255) NOT NULL,
    facultyInstitution VARCHAR(255), facultyDepartment VARCHAR(255), facultyDesignation VARCHAR(255),
    relationshipToStudent VARCHAR(255) NOT NULL, coursesTaught TEXT,
    purpose VARCHAR(255) NOT NULL, studentMessage TEXT, deadline DATE NOT NULL,
    status ENUM('pending','accepted','declined','cancelled') DEFAULT 'pending',
    respondedAt TIMESTAMP NULL, letterFileName VARCHAR(255), letterStoredName VARCHAR(255),
    letterMimeType VARCHAR(100), letterFileSize INT, submittedAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rec_student (studentId), INDEX idx_rec_faculty_email (facultyEmail),
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. VerificationTokens Table
CREATE TABLE IF NOT EXISTS verification_tokens (
    id VARCHAR(36) PRIMARY KEY,
    userId INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiresAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verifiedAt TIMESTAMP NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. StudentProfiles Table
CREATE TABLE IF NOT EXISTS student_profiles (
    id VARCHAR(36) PRIMARY KEY,
    userId INT NOT NULL UNIQUE,
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
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
