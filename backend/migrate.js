require('dotenv').config();
const { initializeDb, query } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
  await initializeDb();
  console.log('Migrating universities...');
  const uniFile = path.join(__dirname, 'data/universities.json');
  if (fs.existsSync(uniFile)) {
    const universities = JSON.parse(fs.readFileSync(uniFile, 'utf8'));
    let count = 0;
    for (const uni of universities) {
      try {
        await query(`
          INSERT IGNORE INTO universities (
            id, university_name, country, state, program, rank_tier, tuition_usd, living_cost_usd, cost_of_attendance_usd, min_cgpa, min_ielts, min_gre, accepts_without_gre, research_level, ms_cs, research_category, intake, deadline, data_note, imageUrl
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          uni.id, uni.university_name, uni.country, uni.state, uni.program, uni.rank_tier, uni.tuition_usd, uni.living_cost_usd, uni.cost_of_attendance_usd, uni.min_cgpa, uni.min_ielts, uni.min_gre, uni.accepts_without_gre, uni.research_level, uni.ms_cs, uni.research_category, uni.intake, uni.deadline, uni.data_note, uni.imageUrl
        ]);
        count++;
      } catch (err) {
        console.error('Failed to insert university', uni.id, err.message);
      }
    }
    console.log(`Migrated ${count} universities.`);
  }

  console.log('Migrating shortlists...');
  const shortlistFile = path.join(__dirname, 'data/shortlists.json');
  if (fs.existsSync(shortlistFile)) {
    const shortlists = JSON.parse(fs.readFileSync(shortlistFile, 'utf8'));
    let count = 0;
    for (const userId in shortlists) {
      for (const uniId of shortlists[userId]) {
        try {
          await query(`INSERT IGNORE INTO shortlists (user_id, university_id) VALUES (?, ?)`, [userId, uniId]);
          count++;
        } catch (err) {
          console.error(`Failed to insert shortlist for user ${userId} and uni ${uniId}`, err.message);
        }
      }
    }
    console.log(`Migrated ${count} shortlists.`);
  }

  console.log('Migration completed. Exiting.');
  process.exit(0);
}

migrate();
