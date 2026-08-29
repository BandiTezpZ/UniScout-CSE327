require('dotenv').config();
const { query, initializeDb } = require('./config/db');
async function test() {
  await initializeDb();
  const student = await query("SELECT * FROM users WHERE role='Student' LIMIT 1");
  const faculty = await query("SELECT * FROM users WHERE role='Faculty' LIMIT 1");
  const s = student[0], f = faculty[0];
  
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'a_very_secure_secret_key_123';
  const fToken = jwt.sign({ id: f.id, fullName: f.fullName, email: f.email, role: f.role, profilePicture: f.profilePicture || null }, secret, { expiresIn: '7d' });
  
  // get a pending request
  const recs = await query("SELECT * FROM recommendation_requests WHERE LOWER(facultyEmail)=? AND status='pending'", [f.email.toLowerCase()]);
  if (!recs.length) { console.log('no pending'); process.exit(0); }
  const r = recs[0];
  
  console.log("Testing accept on", r.id);
  const acceptRes = await fetch(`http://localhost:5001/api/recommendations/${r.id}/accept`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${fToken}` }
  });
  console.log("Accept status:", acceptRes.status);
  console.log("Accept body:", await acceptRes.text());
  
  process.exit(0);
}
test();
