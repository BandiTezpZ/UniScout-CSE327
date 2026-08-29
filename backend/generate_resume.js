const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

async function main() {
  // Disable compression so that the raw text streams are readable as ASCII strings
  const doc = new PDFDocument({ compress: false });
  const destPath = path.join(__dirname, 'data/Resume_Ifaz_2026.pdf');

  // Ensure directories exist
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  const stream = fs.createWriteStream(destPath);
  doc.pipe(stream);

  // Resume Content
  doc.fontSize(20).text('IFAZ A. N.', { align: 'center' });
  doc.fontSize(12).text('Email: ifaz@example.com | Role: Student', { align: 'center' });
  doc.moveDown();

  doc.fontSize(16).text('Academic Background');
  doc.fontSize(12).text('Degree: Bachelor of Science in Computer Science (B.Sc.)');
  doc.text('Institution: State University');
  doc.text('CGPA: 3.65/4.00'); // CGPA pattern
  doc.moveDown();

  doc.fontSize(16).text('Standardized Tests');
  doc.fontSize(12).text('GRE Score: 322 (Verbal: 162 | Quant: 160)'); // GRE pattern
  doc.text('IELTS Overall: 8.0 (Listening: 8.5, Reading: 8.0, Writing: 7.5, Speaking: 7.5)'); // IELTS pattern
  doc.moveDown();

  doc.fontSize(16).text('Research & Projects');
  doc.fontSize(12).text('Publications: 3 papers published in international conferences.'); // Publications count pattern
  doc.text('Projects: 5 academic projects completed, including an AI recommendation engine.');
  doc.text('Internships: 2 software engineering internships at tech companies.');
  doc.moveDown();

  doc.fontSize(16).text('Skills');
  doc.fontSize(12).text('Programming Languages: Python, C++, Java, JavaScript, SQL');
  doc.text('Technologies: React, Node.js, Machine Learning, Deep Learning, TensorFlow, PyTorch');
  doc.moveDown();

  doc.fontSize(16).text('Extracurricular Activities');
  doc.fontSize(12).text('President of the Debate Club, Organizer of the Robotics Workshop.');

  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));
  console.log(`Successfully generated sample resume PDF with compress=false at: ${destPath}`);
}

main().catch(err => {
  console.error('Failed to generate resume:', err);
});
