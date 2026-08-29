const { query, initializeDb } = require('./backend/config/db');
const crypto = require('crypto');
async function test() {
  await initializeDb();
  try {
    const student = await query("SELECT * FROM users WHERE role='Student' LIMIT 1");
    if (!student.length) { console.log('no student'); return; }
    
    const faculty = await query("SELECT * FROM users WHERE role='Faculty' LIMIT 1");
    if (!faculty.length) { console.log('no faculty'); return; }
    
    const s = student[0];
    const f = faculty[0];
    
    const id = crypto.randomUUID();
    const data = {
      facultyName: f.fullName,
      facultyEmail: f.email,
      relationshipToStudent: 'Prof',
      purpose: 'Grad',
      deadline: '2026-10-10'
    };
    const STATUS_PENDING = 'pending';
    
    try {
      await query(`INSERT INTO recommendation_requests (id, studentId, studentName, studentEmail, facultyName, facultyEmail, facultyInstitution, facultyDepartment, facultyDesignation, relationshipToStudent, coursesTaught, purpose, studentMessage, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, s.id, s.fullName, s.email, data.facultyName, data.facultyEmail, f.institution || null, f.department || null, f.designation || null, data.relationshipToStudent, null, data.purpose, null, data.deadline, STATUS_PENDING]);
      console.log('Insert successful');
    } catch (e) {
      console.error('Insert error:', e.message);
    }
    
    // List student
    const sl = await query('SELECT * FROM recommendation_requests WHERE studentId = ?', [s.id]);
    console.log('Student list count:', sl.length);
    
    // List faculty
    const fl = await query('SELECT * FROM recommendation_requests WHERE LOWER(facultyEmail) = ?', [f.email.toLowerCase()]);
    console.log('Faculty list count:', fl.length);
    
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}
test();
