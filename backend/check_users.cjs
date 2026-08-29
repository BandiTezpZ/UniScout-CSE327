require('./config/db').initializeDb().then(async () => {
    const { query } = require('./config/db');
    const users = await query('SELECT COUNT(*) as c FROM users');
    console.log("USERS:", users[0].c);
    const profiles = await query('SELECT COUNT(*) as c FROM student_profiles');
    console.log("PROFILES:", profiles[0].c);
    process.exit(0);
});
