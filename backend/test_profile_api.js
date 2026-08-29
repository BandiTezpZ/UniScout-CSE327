const http = require('http');
const { query } = require('./config/db');
require('./config/db').initializeDb().then(async () => {
  const users = await query('SELECT * FROM users LIMIT 1');
  if(!users.length) return;
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: users[0].id, role: users[0].role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
  const data = JSON.stringify({
    degreeLevel: 'Undergraduate (Bachelors)',
    intendedMajor: 'Computer Science',
    institution: 'North South University',
    graduationYear: '2026',
    cgpa: 3.72,
    ieltsToefl: 7.5,
    gresatgmat: 320,
    budget: 20000,
    researchPapers: 2,
    projects: 3,
    internships: 1,
    skills: ["Python", "Machine Learning", "Deep Learning"]
  });
  const req = http.request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/upload/profile-manual',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    }
  }, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => console.log(res.statusCode, raw));
  });
  req.write(data);
  req.end();
});
