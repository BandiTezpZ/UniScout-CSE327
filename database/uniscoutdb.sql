-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 07, 2026 at 03:35 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `uniscout`
--

-- --------------------------------------------------------

--
-- Table structure for table `recommendation_requests`
--

CREATE TABLE `recommendation_requests` (
  `id` varchar(36) NOT NULL,
  `studentId` varchar(36) DEFAULT NULL,
  `studentName` varchar(255) NOT NULL,
  `studentEmail` varchar(255) NOT NULL,
  `facultyName` varchar(255) NOT NULL,
  `facultyEmail` varchar(255) NOT NULL,
  `facultyInstitution` varchar(255) DEFAULT NULL,
  `facultyDepartment` varchar(255) DEFAULT NULL,
  `facultyDesignation` varchar(255) DEFAULT NULL,
  `relationshipToStudent` varchar(255) NOT NULL,
  `coursesTaught` text DEFAULT NULL,
  `purpose` varchar(255) NOT NULL,
  `studentMessage` text DEFAULT NULL,
  `deadline` date NOT NULL,
  `status` enum('pending','accepted','declined','cancelled') DEFAULT 'pending',
  `respondedAt` timestamp NULL DEFAULT NULL,
  `letterFileName` varchar(255) DEFAULT NULL,
  `letterStoredName` varchar(255) DEFAULT NULL,
  `letterMimeType` varchar(100) DEFAULT NULL,
  `letterFileSize` int(11) DEFAULT NULL,
  `submittedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recommendation_requests`
--

INSERT INTO `recommendation_requests` (`id`, `studentId`, `studentName`, `studentEmail`, `facultyName`, `facultyEmail`, `facultyInstitution`, `facultyDepartment`, `facultyDesignation`, `relationshipToStudent`, `coursesTaught`, `purpose`, `studentMessage`, `deadline`, `status`, `respondedAt`, `letterFileName`, `letterStoredName`, `letterMimeType`, `letterFileSize`, `submittedAt`, `createdAt`, `updatedAt`) VALUES
('1fc5d988-a872-4795-930b-94a03e918b87', '1', 'Abdullah Nur Ifaz', 'ifaz2017@gmail.com', 'Abdullah Ifaz', 'abdullah.ifaz.232@northsouth.edu', 'Berea College', 'Computer Science', 'Lecturer', 'PI', 'CSE445', 'Recommendation', 'Can you kindly provide me a LOR, sir?', '2026-08-04', 'accepted', '2026-08-03 04:30:52', 'Untitled document.pdf', '1fc5d988-a872-4795-930b-94a03e918b87-0d5fd382-02f0-4b1d-b373-08dd55d7660b.pdf', 'application/pdf', 12646, '2026-08-03 04:41:26', '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('45318ca1-50d5-4d0f-8c2b-e8ab02ccb9e6', '1', 'Abdullah Nur Ifaz', 'ifaz2017@gmail.com', 'Abdullah Ifaz', 'abdullah.ifaz.232@northsouth.edu', 'Berea College', 'CS', 'Lecturer', 'PI', 'CSE', 'Recommendation', 'Hello', '2026-08-05', 'accepted', '2026-08-03 05:39:52', 'Untitled document.pdf', '45318ca1-50d5-4d0f-8c2b-e8ab02ccb9e6-069338c6-ecd5-41fa-9c9b-07799a3f50e8.pdf', 'application/pdf', 12646, '2026-08-03 05:39:56', '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('78b58e22-7898-44cd-8224-f64bf8e86a20', '4', 'Urbana Andalib', 'urbana.andalib.232@northsouth.edu', 'Abdullah Nur Ifaz', 'abdullah.ifaz.232@northsouth.edu', 'Berea College', 'Computer Science', 'Lecturer', 'PI', 'CSE', 'blah blah', 'hello', '2026-08-05', 'accepted', '2026-08-04 00:27:15', 'Untitled document.pdf', '78b58e22-7898-44cd-8224-f64bf8e86a20-238e705a-6cf5-4f90-8ee7-0f22c2300037.pdf', 'application/pdf', 12646, '2026-08-04 00:27:18', '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('a2e2747d-9e4e-4c3c-bd73-a225de4ab7b0', '1', 'Abdullah Nur Ifaz', 'ifaz2017@gmail.com', 'Abdullah Ifaz', 'abdullah.ifaz.232@northsouth.edu', 'Berea College', 'CS', 'Lecturer', 'PI', 'CSE445', '12345', 'Hello', '2026-08-04', 'cancelled', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32');

-- --------------------------------------------------------

--
-- Table structure for table `shortlists`
--

CREATE TABLE `shortlists` (
  `user_id` varchar(36) NOT NULL,
  `university_id` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shortlists`
--

INSERT INTO `shortlists` (`user_id`, `university_id`) VALUES
('1', '1'),
('1002', '1'),
('1002', '14');

-- --------------------------------------------------------

--
-- Table structure for table `student_profiles`
--

CREATE TABLE `student_profiles` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) DEFAULT NULL,
  `degreeLevel` varchar(50) DEFAULT NULL,
  `intendedMajor` varchar(100) DEFAULT NULL,
  `cgpa` float DEFAULT NULL,
  `ieltsToefl` float DEFAULT NULL,
  `gresatgmat` float DEFAULT NULL,
  `budget` float DEFAULT NULL,
  `researchPapers` int(11) DEFAULT 0,
  `projects` int(11) DEFAULT 0,
  `internships` int(11) DEFAULT 0,
  `extracurriculars` text DEFAULT NULL,
  `sopStrength` varchar(50) DEFAULT NULL,
  `lorStrength` varchar(50) DEFAULT NULL,
  `fundingNeed` varchar(50) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `latestCvName` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_profiles`
--

INSERT INTO `student_profiles` (`id`, `userId`, `degreeLevel`, `intendedMajor`, `cgpa`, `ieltsToefl`, `gresatgmat`, `budget`, `researchPapers`, `projects`, `internships`, `extracurriculars`, `sopStrength`, `lorStrength`, `fundingNeed`, `skills`, `latestCvName`, `createdAt`, `updatedAt`) VALUES
('099336c9-d390-42bf-8a77-360caf4229b6', '3', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, NULL, NULL, '[]', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('24492dd0-27c8-4068-accc-c04513c84b07', '1001', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, NULL, NULL, '[]', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('4b127083-c38d-4953-8654-37c6075668e1', '2', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, NULL, NULL, '[]', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('af87004e-b2c8-421e-8337-33ab02b57bb6', '1', 'Undergraduate', 'Computer Science', 3.72, 7.5, 320, NULL, 2, 3, 1, 'Member of the University Programming Club; volunteer workshop mentor; organizer of an\nintroductory robotics event.', NULL, NULL, NULL, '[\"Python\",\"Machine Learning\",\"Deep Learning\",\"Data Analysis\",\"SQL\",\"C++\",\"Computer Vision\",\"PyTorch\",\"React\",\"Node.js\",\"JavaScript\",\"Java\",\"Git\"]', 'UniScout_Placeholder_CV.pdf', '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('c5e1363e-92f4-4188-bebc-5743e4cf51c6', '4', 'Undergraduate', 'Computer Science', 3.86, 8, 326, NULL, 2, 6, 2, 'ACM Student Chapter Executive Member\nHackathon Finalist\nOpen Source Contributor\nLanguages\nEnglish (Native), Spanish (Professional Working Proficiency)', NULL, NULL, NULL, '[\"Python\",\"R\",\"MATLAB\",\"Machine Learning\",\"Deep Learning\",\"Data Analysis\",\"SQL\",\"C++\",\"C#\",\"Computer Vision\",\"NLP\",\"TensorFlow\",\"PyTorch\",\"Scikit-learn\",\"React\",\"Node.js\",\"JavaScript\",\"TypeScript\",\"Java\",\"Git\",\"AWS\",\"Azure\",\"GCP\",\"Docker\",\"Kubernetes\",\"Linux\"]', 'UniScout_Demo_CV_Parser_Optimized.pdf', '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('e30df5bd-faba-4b18-ba5b-a56005717fac', '1000', 'Undergraduate', 'Computer Science', 3.72, 7.5, 320, NULL, 2, 3, 1, 'Member of the University Programming Club; volunteer workshop mentor; organizer of an\nintroductory robotics event.', NULL, NULL, NULL, '[\"Python\",\"Machine Learning\",\"Deep Learning\",\"Data Analysis\",\"SQL\",\"C++\",\"Computer Vision\",\"PyTorch\",\"React\",\"Node.js\",\"JavaScript\",\"Java\",\"Git\"]', 'Dog_CV.pdf', '2026-08-07 13:12:32', '2026-08-07 13:17:41'),
('effe9606-19ec-4003-b88b-c723b5299ac6', '1002', 'Undergraduate', 'Computer Science', 3.65, 8, NULL, NULL, 0, 0, 0, '', NULL, NULL, NULL, '[]', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32');

-- --------------------------------------------------------

--
-- Table structure for table `universities`
--

CREATE TABLE `universities` (
  `id` varchar(36) NOT NULL,
  `university_name` varchar(255) NOT NULL,
  `country` varchar(100) DEFAULT 'USA',
  `state` varchar(100) DEFAULT NULL,
  `program` varchar(255) DEFAULT NULL,
  `rank_tier` int(11) DEFAULT NULL,
  `tuition_usd` decimal(10,2) DEFAULT NULL,
  `living_cost_usd` decimal(10,2) DEFAULT NULL,
  `cost_of_attendance_usd` decimal(10,2) DEFAULT NULL,
  `min_cgpa` decimal(3,2) DEFAULT NULL,
  `min_ielts` decimal(3,1) DEFAULT NULL,
  `min_gre` int(11) DEFAULT NULL,
  `accepts_without_gre` varchar(50) DEFAULT NULL,
  `research_level` int(11) DEFAULT NULL,
  `ms_cs` varchar(50) DEFAULT NULL,
  `research_category` varchar(100) DEFAULT NULL,
  `intake` varchar(50) DEFAULT NULL,
  `deadline` varchar(100) DEFAULT NULL,
  `data_note` text DEFAULT NULL,
  `imageUrl` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `universities`
--

INSERT INTO `universities` (`id`, `university_name`, `country`, `state`, `program`, `rank_tier`, `tuition_usd`, `living_cost_usd`, `cost_of_attendance_usd`, `min_cgpa`, `min_ielts`, `min_gre`, `accepts_without_gre`, `research_level`, `ms_cs`, `research_category`, `intake`, `deadline`, `data_note`, `imageUrl`) VALUES
('1', 'Massachusetts Institute of Technology', 'USA', 'Massachusetts', 'Computer Science', 1, 52000.00, 24000.00, 76000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Computing and Information Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', 'http://localhost:5001/uploads/uni-1786108886901-624043397.jpg'),
('10', 'Princeton University', 'USA', 'New Jersey', 'Environmental Science', 1, 62000.00, 24000.00, 86000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Environmental and Earth Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('100', 'Syracuse University', 'USA', 'New York', 'Environmental Science', 3, 34500.00, 24000.00, 58500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Environmental and Earth Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('101', 'Tufts University', 'USA', 'Massachusetts', 'Psychology', 3, 36000.00, 24000.00, 60000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Behavioral Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('102', 'University of Massachusetts Lowell', 'USA', 'Massachusetts', 'Political Science', 3, 37500.00, 24000.00, 61500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Social Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('103', 'Worcester Polytechnic Institute', 'USA', 'Massachusetts', 'Sociology', 3, 39000.00, 24000.00, 63000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Social Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('104', 'Clarkson University', 'USA', 'New York', 'Education', 3, 40500.00, 24000.00, 64500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Education Research', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('105', 'Stevens Institute of Technology', 'USA', 'New Jersey', 'Public Health', 3, 30000.00, 24000.00, 54000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Health Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('106', 'New Jersey Institute of Technology', 'USA', 'New Jersey', 'Computer Science', 3, 31500.00, 24000.00, 55500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Computing and Information Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('107', 'Temple University', 'USA', 'Pennsylvania', 'Biology', 3, 33000.00, 20000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Life Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('108', 'Drexel University', 'USA', 'Pennsylvania', 'Business', 3, 34500.00, 20000.00, 54500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Business and Management', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('109', 'Lehigh University', 'USA', 'Pennsylvania', 'Economics', 3, 36000.00, 20000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Economics and Policy', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('11', 'University of Texas at Austin', 'USA', 'Texas', 'Psychology', 1, 52000.00, 17000.00, 69000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Behavioral Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('110', 'Case Western Reserve University', 'USA', 'Ohio', 'Arts', 3, 37500.00, 17000.00, 54500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Arts and Humanities', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('111', 'University of Cincinnati', 'USA', 'Ohio', 'Engineering', 3, 39000.00, 17000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Engineering and Technology', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('112', 'Miami University', 'USA', 'Ohio', 'Physics', 3, 40500.00, 17000.00, 57500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Physical Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('113', 'Kent State University', 'USA', 'Ohio', 'Chemistry', 3, 30000.00, 17000.00, 47000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Chemical Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('114', 'University of Toledo', 'USA', 'Ohio', 'Mathematics', 3, 31500.00, 17000.00, 48500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Mathematical Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('115', 'Bowling Green State University', 'USA', 'Ohio', 'Environmental Science', 3, 33000.00, 17000.00, 50000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Environmental and Earth Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('116', 'Old Dominion University', 'USA', 'Virginia', 'Psychology', 3, 34500.00, 20000.00, 54500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Behavioral Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('117', 'Clemson University', 'USA', 'South Carolina', 'Political Science', 3, 36000.00, 17000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Social Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('118', 'University of South Carolina', 'USA', 'South Carolina', 'Sociology', 3, 37500.00, 17000.00, 54500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Social Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('119', 'Wake Forest University', 'USA', 'North Carolina', 'Education', 3, 39000.00, 17000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Education Research', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('12', 'University of California, San Diego', 'USA', 'California', 'Political Science', 1, 54500.00, 24000.00, 78500.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Social Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('120', 'University of North Carolina at Charlotte', 'USA', 'North Carolina', 'Public Health', 3, 40500.00, 17000.00, 57500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Health Sciences', 'Fall, Spring, Summer', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('121', 'East Carolina University', 'USA', 'North Carolina', 'Computer Science', 4, 25600.00, 17000.00, 42600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Computing and Information Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('122', 'University of Mississippi', 'USA', 'Mississippi', 'Biology', 4, 26800.00, 17000.00, 43800.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Life Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('123', 'Mississippi State University', 'USA', 'Mississippi', 'Business', 4, 28000.00, 17000.00, 45000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Business and Management', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('124', 'University of Louisiana at Lafayette', 'USA', 'Louisiana', 'Economics', 4, 29200.00, 17000.00, 46200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Economics and Policy', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('125', 'University of New Orleans', 'USA', 'Louisiana', 'Arts', 4, 30400.00, 17000.00, 47400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Arts and Humanities', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('126', 'Louisiana Tech University', 'USA', 'Louisiana', 'Engineering', 4, 31600.00, 17000.00, 48600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Engineering and Technology', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('127', 'University of Tulsa', 'USA', 'Oklahoma', 'Physics', 4, 22000.00, 17000.00, 39000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Physical Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('128', 'University of Memphis', 'USA', 'Tennessee', 'Chemistry', 4, 23200.00, 17000.00, 40200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Chemical Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('129', 'Georgia State University', 'USA', 'Georgia', 'Mathematics', 4, 24400.00, 17000.00, 41400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Mathematical Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('13', 'University of California, Los Angeles', 'USA', 'California', 'Sociology', 1, 57000.00, 24000.00, 81000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Social Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('130', 'University of Central Florida', 'USA', 'Florida', 'Environmental Science', 3, 31500.00, 20000.00, 51500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Environmental and Earth Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('131', 'University of South Florida', 'USA', 'Florida', 'Psychology', 3, 33000.00, 20000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Behavioral Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('132', 'Florida International University', 'USA', 'Florida', 'Political Science', 4, 28000.00, 20000.00, 48000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Social Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('133', 'Florida Atlantic University', 'USA', 'Florida', 'Sociology', 4, 29200.00, 20000.00, 49200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Social Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('134', 'University of North Texas', 'USA', 'Texas', 'Education', 4, 30400.00, 17000.00, 47400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Education Research', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('135', 'University of Texas at Dallas', 'USA', 'Texas', 'Public Health', 3, 39000.00, 17000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Health Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('136', 'University of Texas at Arlington', 'USA', 'Texas', 'Computer Science', 4, 22000.00, 17000.00, 39000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Computing and Information Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('137', 'Texas Tech University', 'USA', 'Texas', 'Biology', 3, 30000.00, 17000.00, 47000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Life Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('138', 'University of Houston', 'USA', 'Texas', 'Business', 3, 31500.00, 17000.00, 48500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Business and Management', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('139', 'University of Texas at San Antonio', 'USA', 'Texas', 'Economics', 4, 25600.00, 17000.00, 42600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Economics and Policy', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('14', 'Columbia University', 'USA', 'New York', 'Education', 1, 59500.00, 24000.00, 83500.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Education Research', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('140', 'Southern Methodist University', 'USA', 'Texas', 'Arts', 3, 34500.00, 17000.00, 51500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Arts and Humanities', 'Fall, Spring, Summer', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('141', 'Baylor University', 'USA', 'Texas', 'Engineering', 3, 36000.00, 17000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Engineering and Technology', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('142', 'San Diego State University', 'USA', 'California', 'Physics', 4, 29200.00, 24000.00, 53200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Physical Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('143', 'San Jose State University', 'USA', 'California', 'Chemistry', 4, 30400.00, 24000.00, 54400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Chemical Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('144', 'California Polytechnic State University, San Luis Obispo', 'USA', 'California', 'Mathematics', 3, 40500.00, 24000.00, 64500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Mathematical Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('145', 'Santa Clara University', 'USA', 'California', 'Environmental Science', 3, 30000.00, 24000.00, 54000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Environmental and Earth Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('146', 'Loyola University Chicago', 'USA', 'Illinois', 'Psychology', 4, 23200.00, 20000.00, 43200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Behavioral Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('147', 'DePaul University', 'USA', 'Illinois', 'Political Science', 4, 24400.00, 20000.00, 44400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Social Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('148', 'Illinois Institute of Technology', 'USA', 'Illinois', 'Sociology', 3, 34500.00, 20000.00, 54500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Social Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('149', 'Marquette University', 'USA', 'Wisconsin', 'Education', 4, 26800.00, 17000.00, 43800.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Education Research', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('15', 'Harvard University', 'USA', 'Massachusetts', 'Public Health', 1, 62000.00, 24000.00, 86000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Health Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('150', 'University of Wisconsin-Milwaukee', 'USA', 'Wisconsin', 'Public Health', 4, 28000.00, 17000.00, 45000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Health Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('151', 'Wayne State University', 'USA', 'Michigan', 'Computer Science', 4, 29200.00, 17000.00, 46200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Computing and Information Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('152', 'Western Michigan University', 'USA', 'Michigan', 'Biology', 4, 30400.00, 17000.00, 47400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Life Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('153', 'Oakland University', 'USA', 'Michigan', 'Business', 4, 31600.00, 17000.00, 48600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Business and Management', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('154', 'University of Hawaii at Manoa', 'USA', 'Hawaii', 'Economics', 3, 31500.00, 24000.00, 55500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Economics and Policy', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('155', 'University of Alaska Fairbanks', 'USA', 'Alaska', 'Arts', 4, 23200.00, 17000.00, 40200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Arts and Humanities', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('156', 'University of Maine', 'USA', 'Maine', 'Engineering', 4, 24400.00, 17000.00, 41400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Engineering and Technology', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('157', 'University of New Hampshire', 'USA', 'New Hampshire', 'Physics', 3, 36000.00, 17000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Physical Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('158', 'University of Vermont', 'USA', 'Vermont', 'Chemistry', 4, 26800.00, 17000.00, 43800.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Chemical Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('159', 'University of Rhode Island', 'USA', 'Rhode Island', 'Mathematics', 4, 28000.00, 17000.00, 45000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Mathematical Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('16', 'California Institute of Technology', 'USA', 'California', 'Computer Science', 1, 52000.00, 24000.00, 76000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Computing and Information Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('160', 'Portland State University', 'USA', 'Oregon', 'Environmental Science', 4, 29200.00, 20000.00, 49200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Environmental and Earth Sciences', 'Fall, Spring, Summer', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('161', 'University of Portland', 'USA', 'Oregon', 'Psychology', 4, 30400.00, 20000.00, 50400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Behavioral Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('162', 'Gonzaga University', 'USA', 'Washington', 'Political Science', 4, 31600.00, 24000.00, 55600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Social Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('163', 'Seattle University', 'USA', 'Washington', 'Sociology', 4, 22000.00, 24000.00, 46000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Social Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('164', 'University of Southern Mississippi', 'USA', 'Mississippi', 'Education', 4, 23200.00, 17000.00, 40200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Education Research', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('165', 'West Virginia University', 'USA', 'West Virginia', 'Public Health', 3, 36000.00, 17000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Health Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('166', 'Marshall University', 'USA', 'West Virginia', 'Computer Science', 4, 25600.00, 17000.00, 42600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Computing and Information Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('167', 'College of William & Mary', 'USA', 'Virginia', 'Biology', 3, 39000.00, 20000.00, 59000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Life Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('168', 'University of Richmond', 'USA', 'Virginia', 'Business', 4, 28000.00, 20000.00, 48000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Business and Management', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('169', 'University of Akron', 'USA', 'Ohio', 'Economics', 4, 29200.00, 17000.00, 46200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Economics and Policy', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('17', 'University of Wisconsin-Madison', 'USA', 'Wisconsin', 'Biology', 1, 54500.00, 17000.00, 71500.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Life Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('170', 'University of Dayton', 'USA', 'Ohio', 'Arts', 4, 30400.00, 17000.00, 47400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Arts and Humanities', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('171', 'Creighton University', 'USA', 'Nebraska', 'Engineering', 4, 31600.00, 17000.00, 48600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Engineering and Technology', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('172', 'Emory University', 'USA', 'Georgia', 'Physics', 3, 34500.00, 17000.00, 51500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Physical Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('173', 'Mercer University', 'USA', 'Georgia', 'Chemistry', 4, 23200.00, 17000.00, 40200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Chemical Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('174', 'Nova Southeastern University', 'USA', 'Florida', 'Mathematics', 4, 24400.00, 20000.00, 44400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Mathematical Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('175', 'Brandeis University', 'USA', 'Massachusetts', 'Environmental Science', 3, 39000.00, 24000.00, 63000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Environmental and Earth Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('176', 'Dartmouth College', 'USA', 'New Hampshire', 'Psychology', 2, 40000.00, 17000.00, 57000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Behavioral Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('177', 'Fordham University', 'USA', 'New York', 'Political Science', 4, 28000.00, 24000.00, 52000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Social Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('178', 'Hofstra University', 'USA', 'New York', 'Sociology', 4, 29200.00, 24000.00, 53200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Social Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('179', 'Pace University', 'USA', 'New York', 'Education', 4, 30400.00, 24000.00, 54400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Education Research', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('18', 'University of Maryland, College Park', 'USA', 'Maryland', 'Business', 1, 57000.00, 20000.00, 77000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Business and Management', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('180', 'Adelphi University', 'USA', 'New York', 'Public Health', 4, 31600.00, 24000.00, 55600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Health Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('181', 'Yeshiva University', 'USA', 'New York', 'Computer Science', 4, 22000.00, 24000.00, 46000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Computing and Information Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('182', 'Villanova University', 'USA', 'Pennsylvania', 'Biology', 4, 23200.00, 20000.00, 43200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Life Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('183', 'Seton Hall University', 'USA', 'New Jersey', 'Business', 4, 24400.00, 24000.00, 48400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Business and Management', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('184', 'University of Hartford', 'USA', 'Connecticut', 'Economics', 4, 25600.00, 20000.00, 45600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Economics and Policy', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('185', 'Sacred Heart University', 'USA', 'Connecticut', 'Arts', 4, 26800.00, 20000.00, 46800.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Arts and Humanities', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('186', 'Quinnipiac University', 'USA', 'Connecticut', 'Engineering', 4, 28000.00, 20000.00, 48000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Engineering and Technology', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('187', 'University of Massachusetts Boston', 'USA', 'Massachusetts', 'Physics', 4, 29200.00, 24000.00, 53200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Physical Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('188', 'University of Massachusetts Dartmouth', 'USA', 'Massachusetts', 'Chemistry', 4, 30400.00, 24000.00, 54400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Chemical Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('189', 'Florida Institute of Technology', 'USA', 'Florida', 'Mathematics', 4, 31600.00, 20000.00, 51600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Mathematical Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('19', 'University of Pennsylvania', 'USA', 'Pennsylvania', 'Economics', 1, 59500.00, 20000.00, 79500.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Economics and Policy', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('190', 'Embry-Riddle Aeronautical University', 'USA', 'Florida', 'Environmental Science', 4, 22000.00, 20000.00, 42000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Environmental and Earth Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('191', 'University of Denver', 'USA', 'Colorado', 'Psychology', 4, 23200.00, 20000.00, 43200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Behavioral Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('192', 'Colorado School of Mines', 'USA', 'Colorado', 'Political Science', 2, 43600.00, 20000.00, 63600.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Social Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('193', 'University of Colorado Denver', 'USA', 'Colorado', 'Sociology', 4, 25600.00, 20000.00, 45600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Social Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('194', 'Brigham Young University', 'USA', 'Utah', 'Education', 3, 31500.00, 17000.00, 48500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Education Research', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('195', 'Utah State University', 'USA', 'Utah', 'Public Health', 4, 28000.00, 17000.00, 45000.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Health Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('196', 'University of Louisville', 'USA', 'Kentucky', 'Computer Science', 4, 29200.00, 17000.00, 46200.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Computing and Information Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('197', 'Northern Illinois University', 'USA', 'Illinois', 'Biology', 4, 30400.00, 20000.00, 50400.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Life Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('198', 'Southern Illinois University Carbondale', 'USA', 'Illinois', 'Business', 4, 31600.00, 20000.00, 51600.00, 3.00, 6.5, 305, 'Often', 3, 'Yes', 'Business and Management', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('199', 'University of Illinois Chicago', 'USA', 'Illinois', 'Economics', 3, 39000.00, 20000.00, 59000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Economics and Policy', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('2', 'Stanford University', 'USA', 'California', 'Biology', 1, 54500.00, 24000.00, 78500.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Life Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('20', 'Purdue University', 'USA', 'Indiana', 'Arts', 1, 62000.00, 17000.00, 79000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Arts and Humanities', 'Fall, Spring, Summer', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('200', 'University of Maryland, Baltimore County', 'USA', 'Maryland', 'Arts', 3, 40500.00, 20000.00, 60500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Arts and Humanities', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('21', 'University of Massachusetts Amherst', 'USA', 'Massachusetts', 'Engineering', 2, 50800.00, 24000.00, 74800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Engineering and Technology', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('22', 'University of Southern California', 'USA', 'California', 'Physics', 2, 40000.00, 24000.00, 64000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Physical Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('23', 'New York University', 'USA', 'New York', 'Chemistry', 2, 41800.00, 24000.00, 65800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Chemical Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('24', 'Rice University', 'USA', 'Texas', 'Mathematics', 2, 43600.00, 17000.00, 60600.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Mathematical Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('25', 'Duke University', 'USA', 'North Carolina', 'Environmental Science', 2, 45400.00, 17000.00, 62400.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Environmental and Earth Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('26', 'Northwestern University', 'USA', 'Illinois', 'Psychology', 2, 47200.00, 20000.00, 67200.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Behavioral Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('27', 'Brown University', 'USA', 'Rhode Island', 'Political Science', 2, 49000.00, 17000.00, 66000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Social Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('28', 'Johns Hopkins University', 'USA', 'Maryland', 'Sociology', 2, 50800.00, 20000.00, 70800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Social Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('29', 'Virginia Tech', 'USA', 'Virginia', 'Education', 2, 40000.00, 20000.00, 60000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Education Research', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('3', 'Carnegie Mellon University', 'USA', 'Pennsylvania', 'Computer Science', 1, 57000.00, 20000.00, 77000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Business and Management', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('30', 'Pennsylvania State University', 'USA', 'Pennsylvania', 'Public Health', 2, 41800.00, 20000.00, 61800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Health Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('31', 'Ohio State University', 'USA', 'Ohio', 'Computer Science', 2, 43600.00, 17000.00, 60600.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Computing and Information Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('32', 'University of California, Irvine', 'USA', 'California', 'Biology', 2, 45400.00, 24000.00, 69400.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Life Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('33', 'University of California, Davis', 'USA', 'California', 'Business', 2, 47200.00, 24000.00, 71200.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Business and Management', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('34', 'University of California, Santa Barbara', 'USA', 'California', 'Economics', 2, 49000.00, 24000.00, 73000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Economics and Policy', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('35', 'Texas A&M University', 'USA', 'Texas', 'Arts', 2, 50800.00, 17000.00, 67800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Arts and Humanities', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('36', 'North Carolina State University', 'USA', 'North Carolina', 'Engineering', 2, 40000.00, 17000.00, 57000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Engineering and Technology', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('37', 'University of Minnesota Twin Cities', 'USA', 'Minnesota', 'Physics', 2, 41800.00, 17000.00, 58800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Physical Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('38', 'Rutgers University-New Brunswick', 'USA', 'New Jersey', 'Chemistry', 2, 43600.00, 24000.00, 67600.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Chemical Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('39', 'University of Virginia', 'USA', 'Virginia', 'Mathematics', 2, 45400.00, 20000.00, 65400.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Mathematical Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('4', 'University of California, Berkeley', 'USA', 'California', 'Economics', 1, 59500.00, 24000.00, 83500.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Economics and Policy', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('40', 'University of Colorado Boulder', 'USA', 'Colorado', 'Environmental Science', 2, 47200.00, 20000.00, 67200.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Environmental and Earth Sciences', 'Fall, Spring, Summer', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('41', 'Stony Brook University', 'USA', 'New York', 'Psychology', 2, 49000.00, 24000.00, 73000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Behavioral Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('42', 'University at Buffalo, SUNY', 'USA', 'New York', 'Political Science', 2, 50800.00, 24000.00, 74800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Social Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('43', 'Arizona State University', 'USA', 'Arizona', 'Sociology', 2, 40000.00, 17000.00, 57000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Social Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('44', 'University of Arizona', 'USA', 'Arizona', 'Education', 2, 41800.00, 17000.00, 58800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Education Research', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('45', 'Northeastern University', 'USA', 'Massachusetts', 'Public Health', 2, 43600.00, 24000.00, 67600.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Health Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('46', 'Boston University', 'USA', 'Massachusetts', 'Computer Science', 2, 45400.00, 24000.00, 69400.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Computing and Information Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('47', 'University of Chicago', 'USA', 'Illinois', 'Biology', 2, 47200.00, 20000.00, 67200.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Life Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('48', 'Vanderbilt University', 'USA', 'Tennessee', 'Business', 2, 49000.00, 17000.00, 66000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Business and Management', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('49', 'Washington University in St. Louis', 'USA', 'Missouri', 'Economics', 2, 50800.00, 17000.00, 67800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Economics and Policy', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('5', 'University of Illinois Urbana-Champaign', 'USA', 'Illinois', 'Arts', 1, 62000.00, 20000.00, 82000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Arts and Humanities', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('50', 'University of Utah', 'USA', 'Utah', 'Arts', 2, 40000.00, 17000.00, 57000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Arts and Humanities', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('51', 'University of Florida', 'USA', 'Florida', 'Engineering', 2, 41800.00, 20000.00, 61800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Engineering and Technology', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('52', 'University of Rochester', 'USA', 'New York', 'Physics', 2, 43600.00, 24000.00, 67600.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Physical Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('53', 'Rensselaer Polytechnic Institute', 'USA', 'New York', 'Chemistry', 2, 45400.00, 24000.00, 69400.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Chemical Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('54', 'University of Notre Dame', 'USA', 'Indiana', 'Mathematics', 2, 47200.00, 17000.00, 64200.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Mathematical Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('55', 'University of Pittsburgh', 'USA', 'Pennsylvania', 'Environmental Science', 2, 49000.00, 20000.00, 69000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Environmental and Earth Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('56', 'University of North Carolina at Chapel Hill', 'USA', 'North Carolina', 'Psychology', 2, 50800.00, 17000.00, 67800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Behavioral Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('57', 'Michigan State University', 'USA', 'Michigan', 'Political Science', 2, 40000.00, 17000.00, 57000.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Social Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('58', 'Iowa State University', 'USA', 'Iowa', 'Sociology', 2, 41800.00, 17000.00, 58800.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Social Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('59', 'University of Iowa', 'USA', 'Iowa', 'Education', 2, 43600.00, 17000.00, 60600.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Education Research', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('6', 'Georgia Institute of Technology', 'USA', 'Georgia', 'Engineering', 1, 52000.00, 17000.00, 69000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Engineering and Technology', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('60', 'Indiana University Bloomington', 'USA', 'Indiana', 'Public Health', 2, 45400.00, 17000.00, 62400.00, 3.60, 7.0, 318, 'Often', 5, 'Yes', 'Health Sciences', 'Fall, Spring, Summer', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('61', 'University of California, Riverside', 'USA', 'California', 'Computer Science', 3, 36000.00, 24000.00, 60000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Computing and Information Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('62', 'University of California, Santa Cruz', 'USA', 'California', 'Biology', 3, 37500.00, 24000.00, 61500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Life Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('63', 'University of Delaware', 'USA', 'Delaware', 'Business', 3, 39000.00, 17000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Business and Management', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('64', 'George Mason University', 'USA', 'Virginia', 'Economics', 3, 40500.00, 20000.00, 60500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Economics and Policy', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('65', 'George Washington University', 'USA', 'District of Columbia', 'Arts', 3, 30000.00, 24000.00, 54000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Arts and Humanities', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('66', 'University of Connecticut', 'USA', 'Connecticut', 'Engineering', 3, 31500.00, 20000.00, 51500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Engineering and Technology', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('67', 'Colorado State University', 'USA', 'Colorado', 'Physics', 3, 33000.00, 20000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Physical Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('68', 'Oregon State University', 'USA', 'Oregon', 'Chemistry', 3, 34500.00, 20000.00, 54500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Chemical Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('69', 'University of Oregon', 'USA', 'Oregon', 'Mathematics', 3, 36000.00, 20000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Mathematical Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('7', 'University of Washington', 'USA', 'Washington', 'Physics', 1, 54500.00, 24000.00, 78500.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Physical Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL);
INSERT INTO `universities` (`id`, `university_name`, `country`, `state`, `program`, `rank_tier`, `tuition_usd`, `living_cost_usd`, `cost_of_attendance_usd`, `min_cgpa`, `min_ielts`, `min_gre`, `accepts_without_gre`, `research_level`, `ms_cs`, `research_category`, `intake`, `deadline`, `data_note`, `imageUrl`) VALUES
('70', 'Washington State University', 'USA', 'Washington', 'Environmental Science', 3, 37500.00, 24000.00, 61500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Environmental and Earth Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('71', 'University of Kansas', 'USA', 'Kansas', 'Psychology', 3, 39000.00, 17000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Behavioral Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('72', 'Kansas State University', 'USA', 'Kansas', 'Political Science', 3, 40500.00, 17000.00, 57500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Social Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('73', 'University of Missouri-Columbia', 'USA', 'Missouri', 'Sociology', 3, 30000.00, 17000.00, 47000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Social Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('74', 'University of Nebraska-Lincoln', 'USA', 'Nebraska', 'Education', 3, 31500.00, 17000.00, 48500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Education Research', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('75', 'University of Tennessee, Knoxville', 'USA', 'Tennessee', 'Public Health', 3, 33000.00, 17000.00, 50000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Health Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('76', 'University of Kentucky', 'USA', 'Kentucky', 'Computer Science', 3, 34500.00, 17000.00, 51500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Computing and Information Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('77', 'University of Alabama', 'USA', 'Alabama', 'Biology', 3, 36000.00, 17000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Life Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('78', 'Auburn University', 'USA', 'Alabama', 'Business', 3, 37500.00, 17000.00, 54500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Business and Management', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('79', 'Louisiana State University', 'USA', 'Louisiana', 'Economics', 3, 39000.00, 17000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Economics and Policy', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('8', 'University of Michigan-Ann Arbor', 'USA', 'Michigan', 'Chemistry', 1, 57000.00, 17000.00, 74000.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Chemical Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('80', 'Tulane University', 'USA', 'Louisiana', 'Arts', 3, 40500.00, 17000.00, 57500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Arts and Humanities', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('81', 'University of Arkansas', 'USA', 'Arkansas', 'Engineering', 3, 30000.00, 17000.00, 47000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Engineering and Technology', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('82', 'University of Oklahoma', 'USA', 'Oklahoma', 'Physics', 3, 31500.00, 17000.00, 48500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Physical Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('83', 'Oklahoma State University', 'USA', 'Oklahoma', 'Chemistry', 3, 33000.00, 17000.00, 50000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Chemical Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('84', 'University of New Mexico', 'USA', 'New Mexico', 'Mathematics', 3, 34500.00, 17000.00, 51500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Mathematical Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('85', 'New Mexico State University', 'USA', 'New Mexico', 'Environmental Science', 3, 36000.00, 17000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Environmental and Earth Sciences', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('86', 'University of Nevada, Reno', 'USA', 'Nevada', 'Psychology', 3, 37500.00, 17000.00, 54500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Behavioral Sciences', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('87', 'University of Nevada, Las Vegas', 'USA', 'Nevada', 'Political Science', 3, 39000.00, 17000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Social Sciences', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('88', 'University of Wyoming', 'USA', 'Wyoming', 'Sociology', 3, 40500.00, 17000.00, 57500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Social Sciences', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('89', 'Montana State University', 'USA', 'Montana', 'Education', 3, 30000.00, 17000.00, 47000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Education Research', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('9', 'Cornell University', 'USA', 'New York', 'Mathematics', 1, 59500.00, 24000.00, 83500.00, 3.80, 7.5, 323, 'Varies', 5, 'Yes', 'Mathematical Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('90', 'University of Montana', 'USA', 'Montana', 'Public Health', 3, 31500.00, 17000.00, 48500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Health Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('91', 'Boise State University', 'USA', 'Idaho', 'Computer Science', 3, 33000.00, 17000.00, 50000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Computing and Information Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('92', 'University of Idaho', 'USA', 'Idaho', 'Biology', 3, 34500.00, 17000.00, 51500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Life Sciences', 'Fall', 'January 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('93', 'University of South Dakota', 'USA', 'South Dakota', 'Business', 3, 36000.00, 17000.00, 53000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Business and Management', 'Fall', 'February 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('94', 'South Dakota State University', 'USA', 'South Dakota', 'Economics', 3, 37500.00, 17000.00, 54500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Economics and Policy', 'Fall', 'Fall: January 15; Spring: September 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('95', 'North Dakota State University', 'USA', 'North Dakota', 'Arts', 3, 39000.00, 17000.00, 56000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Arts and Humanities', 'Fall', 'Fall: February 1; Spring: October 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('96', 'University of North Dakota', 'USA', 'North Dakota', 'Engineering', 3, 40500.00, 17000.00, 57500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Engineering and Technology', 'Fall', 'Rolling', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('97', 'Binghamton University, SUNY', 'USA', 'New York', 'Physics', 3, 30000.00, 24000.00, 54000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Physical Sciences', 'Fall, Spring', 'December 1', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('98', 'University at Albany, SUNY', 'USA', 'New York', 'Chemistry', 3, 31500.00, 24000.00, 55500.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Chemical Sciences', 'Fall', 'December 15', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL),
('99', 'Rochester Institute of Technology', 'USA', 'New York', 'Mathematics', 3, 33000.00, 24000.00, 57000.00, 3.30, 6.5, 312, 'Often', 4, 'Yes', 'Mathematical Sciences', 'Fall', 'January 5', 'Estimated planning values, intake, and deadline; verify the official graduate program page.', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `mobileNumber` varchar(15) DEFAULT NULL,
  `role` enum('Student','Faculty','Admin') DEFAULT 'Student',
  `institution` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_otp` varchar(6) DEFAULT NULL,
  `otp_expires_at` timestamp NULL DEFAULT NULL,
  `isBlocked` tinyint(1) DEFAULT 0,
  `isVerified` tinyint(1) DEFAULT 0,
  `specialization` varchar(255) DEFAULT NULL,
  `officeHours` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profilePicture` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fullName`, `email`, `password`, `mobileNumber`, `role`, `institution`, `department`, `designation`, `email_verified`, `verification_otp`, `otp_expires_at`, `isBlocked`, `isVerified`, `specialization`, `officeHours`, `bio`, `profilePicture`, `createdAt`, `updatedAt`) VALUES
('1', 'Abdullah Nur Ifaz', 'ifaz2017@gmail.com', '1234', NULL, 'Student', NULL, NULL, NULL, 1, NULL, NULL, 0, 1, '', '', '', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('1000', 'Mehrin', 'mehrin1230@gmail.com', '1234', '01010101010', 'Student', NULL, NULL, NULL, 1, NULL, NULL, 0, 1, '', '', '', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('1001', 'Local Test', 'localtest1786034908949@test.com', '1234', '01010101010', 'Student', NULL, NULL, NULL, 0, '425188', '2026-08-06 12:50:28', 0, 0, '', '', '', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('1002', 'Nusrat', 'warriorteddy24@gmail.com', '0000', '01234567892', 'Faculty', 'Unknown Institution', 'Computer Science', 'Undergraduate', 1, NULL, NULL, 0, 1, 'Python, Machine Learning, Deep Learning, Data Analysis, SQL', '', 'Member of the University Programming Club; volunteer workshop mentor; organizer of an\nintroductory robotics event.', '/uploads/profile-1786108565759-270963274.jpg', '2026-08-07 13:12:32', '2026-08-07 13:16:05'),
('2', 'Urbana Andalib', 'urbana123@gmail.com', 'rice', '01001010101', 'Student', NULL, NULL, NULL, 0, NULL, NULL, 0, 0, '', '', '', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('3', 'Fahim Faisal Durjoy', 'fahim.durjoy.242@northsouth.edu', '1234', '01968714344', 'Student', NULL, NULL, NULL, 1, NULL, NULL, 0, 1, '', '', '', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('35864180-db8a-4bf5-8d48-80a871ad98f8', 'Abdullah Nur Ifaz', 'abdullah.ifaz.232@northsouth.edu', '123456', '01409642342', 'Faculty', 'Berea College', 'Computer Science', 'Assistant Professor', 1, NULL, NULL, 0, 1, '', '', '', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('4', 'Urbana Andalib', 'urbana.andalib.232@northsouth.edu', '1234', '01111111111', 'Student', NULL, NULL, NULL, 1, NULL, NULL, 0, 1, '', '', '', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32'),
('999', 'Mehran Admin', 'mehran1784@gmail.com', '1234', NULL, 'Admin', NULL, NULL, NULL, 1, NULL, NULL, 0, 1, '', '', '', NULL, '2026-08-07 13:12:32', '2026-08-07 13:12:32');

-- --------------------------------------------------------

--
-- Table structure for table `verification_tokens`
--

CREATE TABLE `verification_tokens` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiresAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `verifiedAt` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `verification_tokens`
--

INSERT INTO `verification_tokens` (`id`, `userId`, `token`, `expiresAt`, `createdAt`, `verifiedAt`) VALUES
('17324f0d-ec16-4105-ae20-fe1daf4d5c04', '1001', '425188', '2026-08-06 12:50:28', '2026-08-06 12:48:28', NULL),
('1a9d7652-503b-44b6-8542-858e7451ec6e', '35864180-db8a-4bf5-8d48-80a871ad98f8', '739222', '2026-08-04 02:27:14', '2026-08-03 02:27:14', NULL),
('2c094b14-3b35-478b-94c5-9997483cd87c', '2', '690270', '2026-07-20 16:48:43', '2026-07-19 16:48:43', NULL),
('53f006c4-f4dd-4629-89cf-3f8453aed7fa', '3', '459954', '2026-07-20 16:50:06', '2026-07-19 16:50:06', '2026-07-19 10:50:54'),
('7bcdc4dc-397c-4ef9-b26b-5c0ab59335b3', '1', '9c681f73-7753-4852-a12b-925ba18270d601cb51c8-e1bb-43c7-8d1d-06b28e0d81b8', '2026-07-11 15:02:36', '2026-07-10 15:02:36', '2026-07-10 09:02:44'),
('fa39e700-fc99-42cb-a8d8-0f32325073ec', '4', '393447', '2026-07-20 16:51:35', '2026-07-19 16:51:35', '2026-07-19 10:51:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `recommendation_requests`
--
ALTER TABLE `recommendation_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_rec_student` (`studentId`),
  ADD KEY `idx_rec_faculty_email` (`facultyEmail`);

--
-- Indexes for table `shortlists`
--
ALTER TABLE `shortlists`
  ADD PRIMARY KEY (`user_id`,`university_id`);

--
-- Indexes for table `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `userId` (`userId`);

--
-- Indexes for table `universities`
--
ALTER TABLE `universities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `verification_tokens`
--
ALTER TABLE `verification_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
