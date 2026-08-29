require('dotenv').config();
const { query } = require('./config/db');

require('./config/db').initializeDb().then(async () => {
    try {
        const users = await query('SELECT * FROM student_profiles LIMIT 1');
        console.log(users[0]);
    } catch (e) {
    }
    process.exit(0);
});
