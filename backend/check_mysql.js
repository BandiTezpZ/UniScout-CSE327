const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    
    await connection.query('CREATE DATABASE IF NOT EXISTS uniscout');
    console.log('Database uniscout checked/created.');
    
    await connection.end();
  } catch(e) {
    console.error('MySQL error:', e);
  }
}
test();
