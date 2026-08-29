require('dotenv').config();
const { initializeDb, query } = require('./config/db');
const fs = require('fs');

async function run() {
  await initializeDb();
  console.log('Parsing universities.json...');
  const universities = JSON.parse(fs.readFileSync('./data/universities.json', 'utf8'));
  let count = 0;
  for (const uni of universities) {
    try {
      await query(`
        UPDATE universities SET imageUrl = ? WHERE university_name = ?
      `, [uni.imageUrl || '', uni.university_name]);
      count++;
    } catch (e) {
      console.error('Error inserting', uni.university_name, e.message);
    }
  }
  console.log('Successfully updated', count, 'universities from JSON into MySQL!');
  process.exit(0);
}
run();
