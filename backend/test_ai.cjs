require('dotenv').config();
const { buildApplicantProfile, buildCatalogueSnapshot, callGeminiWithSearch } = require('./services/aiUniversityFinder');
const { query } = require('./config/db');

require('./config/db').initializeDb().then(async () => {
    try {
        const users = await query('SELECT * FROM student_profiles LIMIT 1');
        const profile = users[0];
        const formatted = buildApplicantProfile(profile);
        const universities = await query('SELECT * FROM universities');
        console.log('Sending request for', universities.length, 'universities');
        
        const result = await callGeminiWithSearch(formatted, universities);
        console.log("SUCCESS", result.recommendations.length);
    } catch (e) {
        console.error('FAILED:', e.message);
        if (e.detail) console.error('DETAIL:', e.detail);
    }
    process.exit(0);
});
