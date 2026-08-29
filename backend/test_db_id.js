const { query, initializeDb } = require('./config/db');
async function test() {
  await initializeDb();
  const id = '008ba9c0-0c6a-4b75-b109-554b2e087ff6';
  const rows = await query('SELECT * FROM recommendation_requests WHERE id = ?', [id]);
  console.log("Rows:", rows);
  process.exit(0);
}
test();
