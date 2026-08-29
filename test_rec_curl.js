const { query, initializeDb } = require('./backend/config/db');
async function test() {
  await initializeDb();
  const student = await query("SELECT * FROM users WHERE role='Student' LIMIT 1");
  const faculty = await query("SELECT * FROM users WHERE role='Faculty' LIMIT 1");
  const s = student[0], f = faculty[0];
  
  // Create a JWT token for the student manually since we can't login due to email verification
  const jwt = require('jsonwebtoken');
  const sToken = jwt.sign({ id: s.id, fullName: s.fullName, email: s.email, role: s.role, profilePicture: s.profilePicture || null }, process.env.JWT_SECRET || 'fallback', { expiresIn: '7d' });
  const fToken = jwt.sign({ id: f.id, fullName: f.fullName, email: f.email, role: f.role, profilePicture: f.profilePicture || null }, process.env.JWT_SECRET || 'fallback', { expiresIn: '7d' });
  
  console.log("Testing POST /api/recommendations as Student");
  const createRes = await fetch('http://localhost:5001/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sToken}` },
    body: JSON.stringify({
      facultyName: f.fullName, facultyEmail: f.email, facultyInstitution: '', facultyDepartment: '', facultyDesignation: '',
      relationshipToStudent: 'Professor', coursesTaught: '', purpose: 'Grad School', studentMessage: '', deadline: '2027-12-31'
    })
  });
  console.log("Create status:", createRes.status);
  console.log("Create body:", await createRes.text());
  
  console.log("Testing GET /api/recommendations/student as Student");
  const sListRes = await fetch('http://localhost:5001/api/recommendations/student', {
    headers: { 'Authorization': `Bearer ${sToken}` }
  });
  console.log("Student list status:", sListRes.status);
  console.log("Student list body:", (await sListRes.text()).slice(0, 500));
  
  console.log("Testing GET /api/recommendations/faculty as Faculty");
  const fListRes = await fetch('http://localhost:5001/api/recommendations/faculty', {
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  console.log("Faculty list status:", fListRes.status);
  console.log("Faculty list body:", (await fListRes.text()).slice(0, 500));
  
  process.exit(0);
}
test();
