const pdfParse = require('pdf-parse-new');

const SKILLS = [
  'Python', 'R', 'MATLAB', 'Machine Learning', 'Deep Learning',
  'Data Analysis', 'SQL', 'C++', 'C#', 'Computer Vision', 'NLP',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'React', 'Node.js',
  'JavaScript', 'TypeScript', 'Java', 'Git', 'AWS', 'Azure', 'GCP',
  'Docker', 'Kubernetes', 'Linux'
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(text) {
  return text
    .replace(/\r/g, '')
    .replace(/[\t\u00a0]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function firstNumber(text, regex, parser = Number.parseFloat) {
  const match = text.match(regex);
  return match ? parser(match[1]) : null;
}

function extractSection(text, headingPatterns) {
  const headings = headingPatterns.join('|');
  const nextHeading = [
    'education', 'academic background', 'experience', 'work experience',
    'professional experience', 'projects?', 'research', 'publications?',
    'skills?', 'technical skills?', 'certifications?', 'awards?',
    'extracurricular(?: activities)?', 'leadership', 'volunteer(?:ing)?',
    'references?'
  ].join('|');

  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:${headings})\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:${nextHeading})\\s*:?\\s*(?:\\n|$)|$)`,
    'i'
  );
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function detectDegreeLevel(text) {
  if (/\b(?:ph\.?d\.?|doctor(?:ate|al))\b/i.test(text)) return 'PhD';
  if (/\b(?:m\.?s\.?c?\.?|master(?:'s)?|graduate degree)\b/i.test(text)) return 'Graduate';
  if (/\b(?:b\.?s\.?c?\.?|bachelor(?:'s)?|undergraduate)\b/i.test(text)) return 'Undergraduate';
  return null;
}

function detectMajor(text) {
  const majors = [
    'Computer Science', 'Software Engineering', 'Computer Engineering',
    'Electrical and Electronic Engineering', 'Electrical Engineering',
    'Mechanical Engineering', 'Civil Engineering', 'Data Science',
    'Information Technology', 'Mathematics', 'Physics', 'Chemistry',
    'Economics', 'Finance', 'Business Administration', 'Biotechnology'
  ];

  return majors.find((major) => {
    const flexible = escapeRegExp(major).replace(/and/g, '(?:and|&)');
    return new RegExp(`\\b${flexible}\\b`, 'i').test(text);
  }) || null;
}

function extractSkills(text) {
  return SKILLS.filter((skill) => {
    if (['C++', 'C#', 'Node.js', 'Scikit-learn'].includes(skill)) {
      return text.toLowerCase().includes(skill.toLowerCase());
    }
    return new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i').test(text);
  });
}

function extractCount(text, explicitRegex, sectionHeadings) {
  const explicit = firstNumber(text, explicitRegex, Number.parseInt);
  if (explicit !== null) return explicit;

  const section = extractSection(text, sectionHeadings);
  if (!section) return 0;

  const bulletLines = section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(?:[-*•▪]|\d+[.)])\s+/.test(line));

  return bulletLines.length;
}

function extractPublications(text) {
  const section = extractSection(text, ['publications?', 'research publications?', 'selected publications?']);
  if (!section) return [];
  const venueHints = [
    'NeurIPS', 'ICML', 'ICLR', 'CVPR', 'ACL', 'AAAI', 'IJCAI', 'MICCAI',
    'Briefings in Bioinformatics', 'Bioinformatics', 'PLOS Computational Biology',
    'PLOS ONE', 'IEEE Transactions on Medical Imaging',
    'IEEE Transactions on Pattern Analysis and Machine Intelligence'
  ];
  return section
    .split('\n')
    .map(line => line.replace(/^(?:[-*•▪]|\d+[.)])\s+/, '').trim())
    .filter(line => line.length > 8)
    .slice(0, 12)
    .map(line => {
      const year = line.match(/\b(20\d{2}|19\d{2})\b/)?.[1] || '';
      const venue = venueHints.find(hint => line.toLowerCase().includes(hint.toLowerCase())) || '';
      const authorship = /\b(first author|co-first author|second author|corresponding author)\b/i.exec(line)?.[1] || '';
      const title = line
        .replace(/\b(20\d{2}|19\d{2})\b/g, '')
        .replace(new RegExp(venue ? escapeRegExp(venue) : '^$', 'i'), '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return { title, venue, year, authorship, topic: '' };
    });
}

function extractResearchInterests(text) {
  const section = extractSection(text, ['research interests?', 'research areas?', 'research profile']);
  if (section) return section.split(/[,;\n]/).map(item => item.trim()).filter(Boolean).slice(0, 12);
  return extractSkills(text).filter(skill => /machine learning|deep learning|computer vision|nlp|bioinformatics|data analysis/i.test(skill));
}

/**
 * Extracts structured academic information from a text-based PDF CV.
 * Missing information is returned as null, 0, an empty string, or an empty
 * array. The parser never fabricates applicant information.
 */
async function parseCV(pdfBuffer) {
  let parsedPdf;
  try {
    parsedPdf = await pdfParse(pdfBuffer);
  } catch (error) {
    throw new Error(`The PDF could not be read: ${error.message}`);
  }

  const text = normalizeText(parsedPdf.text || '');
  if (text.length < 20) {
    throw new Error(
      'No readable text was found. Please upload a text-based PDF; scanned-image CVs require OCR.'
    );
  }

  const ielts = firstNumber(
    text,
    /\bIELTS\b(?:[^0-9]{0,20}?)([0-9](?:\.[0-9])?)/i
  );
  
  const gre = firstNumber(
    text,
    /\bGRE\b(?:[^0-9]{0,20}?)([0-9]{3})/i,
    Number.parseInt
  );

  const extracurriculars = extractSection(text, [
    'extracurricular(?: activities)?', 'leadership(?: activities)?',
    'volunteer(?:ing)?(?: experience)?'
  ]);

  const publications = extractPublications(text);
  return {
    cgpa: firstNumber(
      text,
      /\b(?:CGPA|GPA)\s*(?:score)?\s*[:=\-]?\s*([0-4](?:\.\d{1,2})?)(?:\s*\/\s*4(?:\.0+)?)?/i
    ),
    ieltsToefl: ielts !== null ? ielts : null,
    gresatgmat: gre !== null ? gre : null,
    degreeLevel: detectDegreeLevel(text),
    intendedMajor: detectMajor(text),
    researchPapers: publications.length || extractCount(
      text,
      /\b(?:publications?|research papers?|papers published|published papers?)\s*[:=\-]?\s*(\d+)/i,
      ['publications?', 'research(?: publications?| papers?)?']
    ),
    publications,
    researchInterests: extractResearchInterests(text),
    projects: extractCount(
      text,
      /\b(?:academic\s+)?projects?\s*[:=\-]?\s*(\d+)/i,
      ['projects?', 'academic projects?']
    ),
    internships: extractCount(
      text,
      /\binternships?\s*[:=\-]?\s*(\d+)/i,
      ['internships?', 'work experience', 'professional experience']
    ),
    extracurriculars,
    sopStrength: null,
    lorStrength: null,
    fundingNeed: null,
    skills: extractSkills(text)
  };
}

async function readCvText(pdfBuffer) {
  let parsedPdf;
  try {
    parsedPdf = await pdfParse(pdfBuffer);
  } catch (error) {
    throw new Error(`The PDF could not be read: ${error.message}`);
  }
  const text = normalizeText(parsedPdf.text || '');
  if (text.length < 20) {
    throw new Error('No readable text was found. Please upload a text-based PDF; scanned-image CVs require OCR.');
  }
  return text;
}

function firstLineMatching(text, patterns) {
  return text.split('\n').map(line => line.trim()).find(line =>
    line.length > 2 && line.length < 120 && patterns.some(pattern => pattern.test(line))
  ) || '';
}

async function parseFacultyCV(pdfBuffer) {
  const text = await readCvText(pdfBuffer);
  const education = extractSection(text, ['education', 'academic background']);
  const research = extractSection(text, ['research interests?', 'research areas?', 'research', 'publications?']);
  const experience = extractSection(text, ['experience', 'professional experience', 'employment', 'appointments?']);

  const institutionLine = firstLineMatching(text, [
    /\b(university|college|institute|school)\b/i
  ]);
  const departmentLine = firstLineMatching(text, [
    /\bdepartment of\b/i,
    /\b(computer science|engineering|biology|economics|physics|mathematics)\b/i
  ]);
  const designationLine = firstLineMatching(experience || text, [
    /\b(professor|lecturer|instructor|faculty|research fellow|assistant professor|associate professor)\b/i
  ]);

  return {
    institution: institutionLine.replace(/^.*?(university|college|institute|school)/i, match => match).trim(),
    department: departmentLine.replace(/^department of\s*/i, 'Department of ').trim(),
    designation: designationLine.trim(),
    specialization: (research || extractSkills(text).join(', ')).split('\n').map(line => line.trim()).filter(Boolean).slice(0, 3).join(' '),
    bio: [designationLine, education].filter(Boolean).join('\n').slice(0, 700),
    skills: extractSkills(text),
    publications: extractCount(text, /\b(?:publications?|research papers?|papers published|published papers?)\s*[:=\-]?\s*(\d+)/i, ['publications?', 'research(?: publications?| papers?)?'])
  };
}

module.exports = { parseCV, parseFacultyCV };
