require('./config/db').initializeDb().then(async () => {
    const { query } = require('./config/db');
    const unis = await query('SELECT university_name, min_cgpa FROM universities ORDER BY min_cgpa ASC LIMIT 20');
    console.log(unis);
    process.exit(0);
});
