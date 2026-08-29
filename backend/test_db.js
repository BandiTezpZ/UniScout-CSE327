require('dotenv').config();
const { initializeDb, query } = require('./config/db');

async function test() {
  try {
    await initializeDb();
    console.log("DB init succeeded.");
  } catch (err) {
    console.error("DB INIT ERROR:", err);
  }
  process.exit();
}
test();
