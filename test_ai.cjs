require('dotenv').config({ path: 'backend/.env' });
const { buildApplicantProfile, callGeminiWithSearch } = require('./backend/services/aiUniversityFinder');
const { query } = require('./backend/config/db');

require('./backend/config/db').initializeDb().then(async () => {
    try {
        const users = await query('SELECT * FROM student_profiles LIMIT 1');
        if (users.length === 0) { console.log('No profiles'); return; }
        const profile = users[0];
        const formatted = buildApplicantProfile(profile);
        const universities = await query('SELECT * FROM universities');
        console.log('Sending request for', universities.length, 'universities');
        const result = await callGeminiWithSearch(formatted, universities);
        console.log('SUCCESS', result.recommendations.length);
    } catch (e) {
        console.error('FAILED:', e.message);
        if (e.detail) console.error('DETAIL:', e.detail);
    }
    process.exit(0);
});
