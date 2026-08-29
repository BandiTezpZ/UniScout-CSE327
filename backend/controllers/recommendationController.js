const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const STATUS = require('../constants/recommendationStatus');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const letterUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') }).single('letter');
const letterDirectory = path.join(__dirname, '../data/recommendation_letters');

const clean = value => typeof value === 'string' ? value.trim() : '';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireRole(req, res, role) {
  if (req.user.role !== role) {
    res.status(403).json({ success: false, message: `${role} role required.` });
    return false;
  }
  return true;
}

exports.create = async (req, res) => {
  if (!requireRole(req, res, 'Student')) return;
  const data = {
    facultyName: clean(req.body.facultyName), facultyEmail: clean(req.body.facultyEmail).toLowerCase(),
    facultyInstitution: clean(req.body.facultyInstitution), facultyDepartment: clean(req.body.facultyDepartment),
    facultyDesignation: clean(req.body.facultyDesignation), relationshipToStudent: clean(req.body.relationshipToStudent),
    coursesTaught: clean(req.body.coursesTaught), purpose: clean(req.body.purpose),
    studentMessage: clean(req.body.studentMessage), deadline: clean(req.body.deadline)
  };
  if (!data.facultyName || !data.facultyEmail || !data.relationshipToStudent || !data.purpose || !data.deadline)
    return res.status(400).json({ success: false, message: 'Faculty name, email, relationship, purpose, and deadline are required.' });
  if (!emailPattern.test(data.facultyEmail)) return res.status(400).json({ success: false, message: 'A valid faculty email is required.' });
  const deadline = new Date(`${data.deadline}T23:59:59`);
  if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) return res.status(400).json({ success: false, message: 'Deadline must be a valid future date.' });
  const duplicate = await db.query('SELECT * FROM recommendation_requests WHERE studentId = ? AND facultyEmail = ? AND purpose = ? AND deadline = ? AND status = ?', [req.user.id, data.facultyEmail, data.purpose, data.deadline, STATUS.PENDING]);
  if (duplicate.length) return res.status(400).json({ success: false, message: 'An identical pending recommendation request already exists.' });
  const id = uuidv4();
  await db.query(`INSERT INTO recommendation_requests (id, studentId, studentName, studentEmail, facultyName, facultyEmail, facultyInstitution, facultyDepartment, facultyDesignation, relationshipToStudent, coursesTaught, purpose, studentMessage, deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, req.user.id, clean(req.user.fullName), req.user.email.toLowerCase(), data.facultyName, data.facultyEmail, data.facultyInstitution || null, data.facultyDepartment || null, data.facultyDesignation || null, data.relationshipToStudent, data.coursesTaught || null, data.purpose, data.studentMessage || null, data.deadline, STATUS.PENDING]);
  const [recommendation] = await db.query('SELECT * FROM recommendation_requests WHERE id = ?', [id]);
  res.status(201).json({ success: true, message: 'Recommendation request sent successfully.', recommendation });
};

exports.listStudent = async (req, res) => {
  if (!requireRole(req, res, 'Student')) return;
  const recommendations = await db.query('SELECT * FROM recommendation_requests WHERE studentId = ? ORDER BY createdAt DESC', [req.user.id]);
  res.json({ success: true, recommendations });
};

exports.listFaculty = async (req, res) => {
  if (!requireRole(req, res, 'Faculty')) return;
  const recommendations = await db.query('SELECT * FROM recommendation_requests WHERE LOWER(facultyEmail) = ? ORDER BY createdAt DESC', [req.user.email.toLowerCase()]);
  res.json({ success: true, recommendations });
};

async function transition(req, res, actor, nextStatus) {
  if (!requireRole(req, res, actor)) return;
  console.log("PARAMS ID:", req.params.id); const rows = await db.query('SELECT * FROM recommendation_requests WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Recommendation request not found.' });
  const item = rows[0];
  const owns = actor === 'Student' ? item.studentId === req.user.id : item.facultyEmail.toLowerCase() === req.user.email.toLowerCase();
  if (!owns) return res.status(403).json({ success: false, message: 'You are not authorized to update this request.' });
  if (item.status !== STATUS.PENDING) return res.status(400).json({ success: false, message: 'Only pending requests can be updated.' });
  const respondedAt = actor === 'Faculty' ? new Date() : null;
  await db.query('UPDATE recommendation_requests SET status = ?, respondedAt = ? WHERE id = ?', [nextStatus, respondedAt, item.id]);
  res.json({ success: true, message: `Recommendation request ${nextStatus}.`, recommendation: { ...item, status: nextStatus, respondedAt } });
}

exports.cancel = (req, res) => transition(req, res, 'Student', STATUS.CANCELLED);
exports.accept = (req, res) => transition(req, res, 'Faculty', STATUS.ACCEPTED);
exports.decline = (req, res) => transition(req, res, 'Faculty', STATUS.DECLINED);

exports.uploadLetter = (req, res) => {
  if (!requireRole(req, res, 'Faculty')) return;
  letterUpload(req, res, async error => {
    if (error) return res.status(400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Letter PDF must not exceed 10 MB.' : error.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'A PDF recommendation letter is required.' });
    if (req.file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') return res.status(400).json({ success: false, message: 'The uploaded file is not a valid PDF.' });
    console.log("PARAMS ID:", req.params.id); const rows = await db.query('SELECT * FROM recommendation_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Recommendation request not found.' });
    const item = rows[0];
    if (item.facultyEmail.toLowerCase() !== req.user.email.toLowerCase()) return res.status(403).json({ success: false, message: 'This request is addressed to another Faculty member.' });
    if (item.status !== STATUS.ACCEPTED) return res.status(400).json({ success: false, message: 'Accept the request before uploading a letter.' });
    fs.mkdirSync(letterDirectory, { recursive: true });
    const storedName = `${item.id}-${uuidv4()}.pdf`;
    fs.writeFileSync(path.join(letterDirectory, storedName), req.file.buffer, { flag: 'wx' });
    if (item.letterStoredName) { try { fs.unlinkSync(path.join(letterDirectory, path.basename(item.letterStoredName))); } catch (e) {} }
    const submittedAt = new Date();
    await db.query('UPDATE recommendation_requests SET letterFileName = ?, letterStoredName = ?, letterMimeType = ?, letterFileSize = ?, submittedAt = ? WHERE id = ?', [path.basename(req.file.originalname), storedName, 'application/pdf', req.file.size, submittedAt, item.id]);
    res.json({ success: true, message: 'Recommendation letter submitted successfully.', recommendation: { ...item, letterFileName: path.basename(req.file.originalname), letterFileSize: req.file.size, submittedAt } });
  });
};

exports.downloadLetter = async (req, res) => {
  console.log("PARAMS ID:", req.params.id); const rows = await db.query('SELECT * FROM recommendation_requests WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Recommendation request not found.' });
  const item = rows[0];
  const isStudent = req.user.role === 'Student' && item.studentId === req.user.id;
  const isFaculty = req.user.role === 'Faculty' && item.facultyEmail.toLowerCase() === req.user.email.toLowerCase();
  if (!isStudent && !isFaculty) return res.status(403).json({ success: false, message: 'You cannot access this letter.' });
  if (!item.letterStoredName) return res.status(404).json({ success: false, message: 'No letter has been submitted.' });
  const filePath = path.join(letterDirectory, path.basename(item.letterStoredName));
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'The submitted letter file is unavailable.' });
  res.download(filePath, item.letterFileName || 'recommendation-letter.pdf');
};
