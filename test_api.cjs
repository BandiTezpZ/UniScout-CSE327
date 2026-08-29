const { query } = require('./backend/config/db');
require('./backend/config/db').initializeDb().then(async () => {
  const users = await query('SELECT * FROM universities LIMIT 5');
  console.log(users.map(u => u.university_name));
});
