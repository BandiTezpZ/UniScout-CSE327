const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('Starting API integration tests...\n');

  // Reset local database file if it exists to ensure a clean test state
  const dbPath = path.join(__dirname, 'data/local_db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log('Cleared local JSON database for test isolation.');
    } catch (err) {
      console.warn('Could not clear local JSON database:', err.message);
    }
  }

  // Helper to log test status
  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      process.exit(1);
    }
  };

  const uniqueId = Date.now();
  const studentEmail = `student_${uniqueId}@uniscout.com`;
  const adminEmail = `admin_${uniqueId}@uniscout.com`;

  // 1. Health check
  console.log('Testing /api/health...');
  const healthRes = await fetch(`${API_URL}/health`);
  assert(healthRes.status === 200, 'Health check returned 200');
  const healthData = await healthRes.json();
  assert(healthData.status === 'healthy', 'Health check reports healthy');

  // 2. Register Student
  console.log('\nTesting /api/auth/register (Student)...');
  const studentRegisterRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'John Doe',
      email: studentEmail,
      password: 'password123',
      role: 'Student'
    })
  });
  assert(studentRegisterRes.status === 201, 'Student registration returned 201');
  const studentRegisterData = await studentRegisterRes.json();
  assert(!!studentRegisterData.verificationLink, 'Simulated verification link was returned');
  console.log(`Simulated Link: ${studentRegisterData.verificationLink}`);

  // Extract verification token from link
  const url = new URL(studentRegisterData.verificationLink);
  const verificationToken = url.searchParams.get('token');
  assert(!!verificationToken, 'Verification token extracted successfully');

  // 3. Register Admin
  console.log('\nTesting /api/auth/register (Admin)...');
  const adminRegisterRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'UniScout Admin',
      email: adminEmail,
      password: 'adminpassword123',
      role: 'Admin'
    })
  });
  assert(adminRegisterRes.status === 201, 'Admin registration returned 201');
  const adminRegisterData = await adminRegisterRes.json();
  
  // Extract admin verification token
  const adminUrl = new URL(adminRegisterData.verificationLink);
  const adminVerificationToken = adminUrl.searchParams.get('token');

  // 4. Verify Emails
  console.log('\nTesting /api/auth/verify (Student)...');
  const studentVerifyRes = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: verificationToken })
  });
  assert(studentVerifyRes.status === 200, 'Student email verification returned 200');

  console.log('Testing /api/auth/verify (Admin)...');
  const adminVerifyRes = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: adminVerificationToken })
  });
  assert(adminVerifyRes.status === 200, 'Admin email verification returned 200');

  // 5. Login Student
  console.log('\nTesting /api/auth/login (Student)...');
  const studentLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      password: 'password123',
      role: 'Student'
    })
  });
  assert(studentLoginRes.status === 200, 'Student login returned 200');
  const studentLoginData = await studentLoginRes.json();
  assert(!!studentLoginData.token, 'Student login returned JWT token');
  const studentToken = studentLoginData.token;

  // 6. Login Admin
  console.log('Testing /api/auth/login (Admin)...');
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      password: 'adminpassword123',
      role: 'Admin'
    })
  });
  assert(adminLoginRes.status === 200, 'Admin login returned 200');
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  // 7. Upload CV and Validate Parsing
  console.log('\nTesting /api/cv/upload (PDF Upload & Parsing)...');
  const pdfPath = path.join(__dirname, 'data/Resume_Test_2026.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

  const formData = new FormData();
  formData.append('cv', pdfBlob, 'Resume_Test_2026.pdf');

  const uploadRes = await fetch(`${API_URL}/cv/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    },
    body: formData
  });

  if (uploadRes.status !== 200) {
    const errorText = await uploadRes.text();
    console.error(`CV Upload Failed. Status: ${uploadRes.status}, Body: ${errorText}`);
  }
  assert(uploadRes.status === 200, 'CV upload returned 200');
  const uploadData = await uploadRes.json();
  assert(uploadData.fileName === 'Resume_Test_2026.pdf', 'CV filename matches');
  console.log('Parsed CV Data:', uploadData.parsedData);
  
  assert(uploadData.parsedData.cgpa === 3.65, 'CGPA parsed successfully (3.65)');
  assert(uploadData.parsedData.ieltsToefl === 8.0, 'IELTS parsed successfully (8.0)');
  assert(uploadData.parsedData.gresatgmat === 322, 'GRE parsed successfully (322)');
  assert(uploadData.parsedData.researchPapers === 3, 'Research papers count parsed successfully (3)');
  assert(uploadData.parsedData.degreeLevel === 'Undergraduate', 'Degree level parsed successfully (Undergraduate)');
  assert(uploadData.parsedData.intendedMajor === 'Computer Science', 'Major parsed successfully (Computer Science)');

  // 8. Fetch Profile
  console.log('\nTesting /api/cv/profile (Get Profile)...');
  const profileRes = await fetch(`${API_URL}/cv/profile`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(profileRes.status === 200, 'Get profile returned 200');
  const profileData = await profileRes.json();
  assert(profileData.profile.cgpa === 3.65, 'Profile in DB matches parsed CGPA');

  // 9. Admin view permissions
  console.log('\nTesting /api/admin/users (Access as Student - Should fail)...');
  const studentAdminRes = await fetch(`${API_URL}/admin/users`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentAdminRes.status === 403, 'Accessing admin endpoint as student returns 403 Forbidden');

  console.log('Testing /api/admin/users (Access as Admin - Should pass)...');
  const adminAdminRes = await fetch(`${API_URL}/admin/users`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(adminAdminRes.status === 200, 'Accessing admin endpoint as admin returns 200');
  const adminAdminData = await adminAdminRes.json();
  assert(adminAdminData.users.length >= 2, 'Admin retrieved registered users successfully');
  console.log(`Registered users in UniScout DB: ${adminAdminData.users.length}`);

  console.log('\nALL BACKEND API TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
