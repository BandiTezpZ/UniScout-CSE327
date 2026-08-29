require('dotenv').config();
const { initializeDb, query } = require('./config/db');
async function run() {
  await initializeDb();
  try {
    const res = await query("DESCRIBE student_profiles");
    console.log(res);
  } catch (e) {
    console.log(e);
  }
  process.exit();
}
run();
