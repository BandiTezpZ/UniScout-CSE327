require('dotenv').config();
const { initializeDb, query } = require('./config/db');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const IMAGE_MAP = {
  'Massachusetts Institute of Technology': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/MIT_Main_Campus_Aerial.jpg/800px-MIT_Main_Campus_Aerial.jpg',
  'Stanford University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Stanford_University_Main_Quad_May_2011_001.jpg/800px-Stanford_University_Main_Quad_May_2011_001.jpg',
  'University of California, Berkeley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/UC_Berkeley_campus_overview_from_Lawrence_Hall_of_Science%2C_November_2022.jpg/800px-UC_Berkeley_campus_overview_from_Lawrence_Hall_of_Science%2C_November_2022.jpg',
  'University of Michigan-Ann Arbor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Law_Quad_University_of_Michigan.jpg/800px-Law_Quad_University_of_Michigan.jpg',
  'Harvard University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_Campus.jpg/800px-Harvard_University_Campus.jpg',
  'Princeton University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_University_Clio_Hall.jpg/800px-Princeton_University_Clio_Hall.jpg',
  'Cornell University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cornell_University_from_McGraw_Tower.jpg/800px-Cornell_University_from_McGraw_Tower.jpg',
  'Columbia University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Columbia_University_Low_Library.jpg/800px-Columbia_University_Low_Library.jpg',
  'University of Washington': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/University_of_Washington_Quad%2C_Spring_2019.jpg/800px-University_of_Washington_Quad%2C_Spring_2019.jpg',
  'University of California, Los Angeles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/UCLA_Royce_Hall.jpg/800px-UCLA_Royce_Hall.jpg',
  'University of California, San Diego': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Geisel_Library%2C_UCSD.jpg/800px-Geisel_Library%2C_UCSD.jpg',
  'Georgia Institute of Technology': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Tech_Tower_and_Tech_Green.jpg/800px-Tech_Tower_and_Tech_Green.jpg',
  'Carnegie Mellon University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Hamerschlag_Hall_Carnegie_Mellon_University.jpg/800px-Hamerschlag_Hall_Carnegie_Mellon_University.jpg',
  'University of Texas at Austin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/UT_Tower_University_of_Texas_Austin.jpg/800px-UT_Tower_University_of_Texas_Austin.jpg',
  'California Institute of Technology': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Caltech_Millikan_Library.jpg/800px-Caltech_Millikan_Library.jpg',
  'University of Pennsylvania': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/University_of_Pennsylvania_College_Hall.jpg/800px-University_of_Pennsylvania_College_Hall.jpg',
  'Purdue University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Purdue_University_Engineering_Fountain.jpg/800px-Purdue_University_Engineering_Fountain.jpg',
  'Duke University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Duke_Chapel_and_Quad.jpg/800px-Duke_Chapel_and_Quad.jpg',
  'New York University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Washington_Square_Park_NYU.jpg/800px-Washington_Square_Park_NYU.jpg',
  'Rice University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Rice_University_Academic_Quad.jpg/800px-Rice_University_Academic_Quad.jpg',
  'Brown University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Brown_University_University_Hall.jpg/800px-Brown_University_University_Hall.jpg',
  'Johns Hopkins University': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Gilman_Hall_Johns_Hopkins_University.jpg/800px-Gilman_Hall_Johns_Hopkins_University.jpg',
  'University of Wisconsin-Madison': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Bascom_Hall_at_University_of_Wisconsin-Madison.jpg/800px-Bascom_Hall_at_University_of_Wisconsin-Madison.jpg'
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      if (row.some(cell => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  const [headers, ...records] = rows;
  const cleanHeaders = headers.map(header => header.replace(/^\uFEFF/, '').trim());
  return records.map((record) => Object.fromEntries(cleanHeaders.map((header, i) => [header, record[i] || '']))).map((item, index) => normalizeUniversity(item, index + 1));
}

function normalizeUniversity(item, index) {
  const name = item.university_name || item['\uFEFFuniversity_name'] || item.name || '';
  const tuition = Number(item.tuition_usd || 0);
  const living = Number(item.living_cost_usd || 0);
  const attendance = Number(item.cost_of_attendance_usd || tuition + living || 0);
  return {
    id: item.id || String(index),
    university_name: name,
    country: item.country || 'USA',
    state: item.state || '',
    program: item.program || '',
    rank_tier: Number(item.rank_tier || 0),
    tuition_usd: tuition,
    living_cost_usd: living,
    cost_of_attendance_usd: attendance,
    min_cgpa: Number(item.min_cgpa || 0),
    min_ielts: Number(item.min_ielts || 0),
    min_gre: Number(item.min_gre || 0),
    accepts_without_gre: item.accepts_without_gre || 'Varies',
    research_level: Number(item.research_level || 0),
    ms_cs: item.ms_cs || '',
    research_category: item.research_category || '',
    intake: item.intake || '',
    deadline: item.deadline || '',
    data_note: item.data_note || '',
    imageUrl: item.imageUrl || IMAGE_MAP[name] || ''
  };
}

async function run() {
  await initializeDb();
  console.log('Parsing universities.csv...');
  const csvPath = path.join(__dirname, 'data/universities.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found at', csvPath);
    process.exit(1);
  }
  
  const csv = fs.readFileSync(csvPath, 'utf8');
  const universities = parseCsv(csv);
  
  let count = 0;
  for (const uni of universities) {
    try {
      await query(`
        INSERT INTO universities (
          id, university_name, country, state, program, rank_tier, tuition_usd, living_cost_usd, cost_of_attendance_usd, min_cgpa, min_ielts, min_gre, accepts_without_gre, research_level, ms_cs, research_category, intake, deadline, data_note, imageUrl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          university_name=VALUES(university_name), program=VALUES(program), rank_tier=VALUES(rank_tier), imageUrl=VALUES(imageUrl)
      `, [
        uni.id, uni.university_name, uni.country, uni.state, uni.program, uni.rank_tier, uni.tuition_usd, uni.living_cost_usd, uni.cost_of_attendance_usd, uni.min_cgpa, uni.min_ielts, uni.min_gre, uni.accepts_without_gre, uni.research_level, uni.ms_cs, uni.research_category, uni.intake, uni.deadline, uni.data_note, uni.imageUrl
      ]);
      count++;
    } catch (e) {
      console.error('Error inserting', uni.university_name, e.message);
    }
  }
  
  console.log('Successfully inserted/updated', count, 'universities from CSV into MySQL!');
  process.exit(0);
}

run();
