require('dotenv').config();
const { initializeDb, query } = require('./config/db');
const fs = require('fs');
const path = require('path');

async function importLocalDb() {
  await initializeDb();
  console.log('Loading local_db.json...');
  const localDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/local_db.json'), 'utf8'));
  
  // STUDENT PROFILES
  if (localDb.student_profiles) {
      let count = 0;
      for (const sp of localDb.student_profiles) {
          try {
              const skills = typeof sp.skills === 'string' ? sp.skills : JSON.stringify(sp.skills || []);
              const researchInterests = typeof sp.researchInterests === 'string' ? sp.researchInterests : JSON.stringify(sp.researchInterests || []);
              const publications = typeof sp.publications === 'string' ? sp.publications : JSON.stringify(sp.publications || []);
              const preferredCountries = typeof sp.preferredCountries === 'string' ? sp.preferredCountries : JSON.stringify(sp.preferredCountries || []);
              const fundingPreference = typeof sp.fundingPreference === 'string' ? sp.fundingPreference : JSON.stringify(sp.fundingPreference || []);

              const exists = await query('SELECT id FROM student_profiles WHERE id = ?', [sp.id]);
              if (exists.length > 0) {
                  await query('UPDATE student_profiles SET userId = ?, degreeLevel = ?, intendedMajor = ?, cgpa = ?, ieltsToefl = ?, gresatgmat = ?, budget = ?, researchPapers = ?, projects = ?, internships = ?, extracurriculars = ?, sopStrength = ?, lorStrength = ?, fundingNeed = ?, skills = ?, latestCvName = ?, institution = ?, graduationYear = ?, researchInterests = ?, publications = ?, desiredDegree = ?, preferredCountries = ?, fundingPreference = ? WHERE id = ?',
                    [sp.userId, sp.degreeLevel, sp.intendedMajor, sp.cgpa, sp.ieltsToefl, sp.gresatgmat, sp.budget, sp.researchPapers, sp.projects, sp.internships, sp.extracurriculars, sp.sopStrength, sp.lorStrength, sp.fundingNeed, skills, sp.latestCvName, sp.institution||null, sp.graduationYear||null, researchInterests, publications, sp.desiredDegree||null, preferredCountries, fundingPreference, sp.id]);
              } else {
                  await query('INSERT INTO student_profiles (id, userId, degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget, researchPapers, projects, internships, extracurriculars, sopStrength, lorStrength, fundingNeed, skills, latestCvName, institution, graduationYear, researchInterests, publications, desiredDegree, preferredCountries, fundingPreference, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [sp.id, sp.userId, sp.degreeLevel, sp.intendedMajor, sp.cgpa, sp.ieltsToefl, sp.gresatgmat, sp.budget, sp.researchPapers, sp.projects, sp.internships, sp.extracurriculars, sp.sopStrength, sp.lorStrength, sp.fundingNeed, skills, sp.latestCvName, sp.institution||null, sp.graduationYear||null, researchInterests, publications, sp.desiredDegree||null, preferredCountries, fundingPreference, new Date(sp.createdAt), new Date(sp.updatedAt)]);
              }
              count++;
          } catch(e) { console.error('Error student_profile', sp.id, e.message); }
      }
      console.log(`Imported ${count} student profiles`);
  }

  console.log('Migration from local_db.json completed!');
  process.exit(0);
}

importLocalDb();
