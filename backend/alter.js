require('dotenv').config();
const { initializeDb, query } = require('./config/db');
async function run() {
  await initializeDb();
  try {
    await query("ALTER TABLE student_profiles ADD COLUMN institution VARCHAR(255);");
    await query("ALTER TABLE student_profiles ADD COLUMN graduationYear VARCHAR(10);");
    await query("ALTER TABLE student_profiles ADD COLUMN researchInterests TEXT;");
    await query("ALTER TABLE student_profiles ADD COLUMN publications TEXT;");
    await query("ALTER TABLE student_profiles ADD COLUMN desiredDegree VARCHAR(100);");
    await query("ALTER TABLE student_profiles ADD COLUMN preferredCountries TEXT;");
    await query("ALTER TABLE student_profiles ADD COLUMN fundingPreference VARCHAR(100);");
    console.log("Added missing columns.");
  } catch (e) {
    console.log("Columns may already exist or error:", e.message);
  }
  
  process.exit();
}
run();
