const { query } = require('./config/db');
require('./config/db').initializeDb().then(async () => {
  try {
    await query(
      `UPDATE student_profiles SET 
          degreeLevel = ?, intendedMajor = ?, cgpa = ?, ieltsToefl = ?, 
          gresatgmat = ?, budget = ?, researchPapers = ?, projects = ?, 
          internships = ?, extracurriculars = ?, fundingNeed = ?, skills = ?, latestCvName = ?,
          institution = ?, graduationYear = ?, researchInterests = ?, publications = ?, desiredDegree = ?, preferredCountries = ?, fundingPreference = ?
         WHERE userId = ?`,
      ['Undergraduate', 'CS', 3.5, 7.5, 320, 20000, 2, 3, 1, 'none', 'yes', '[]', null, null, null, '[]', '[]', null, null, null, '1']
    );
    console.log("Success");
  } catch(e) {
    console.log("Error:", e.message);
  }
  process.exit();
});
