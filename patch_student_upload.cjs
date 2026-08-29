const fs = require('fs');
let code = fs.readFileSync('backend/controllers/uploadController.js', 'utf8');

const target = `      if (existingProfiles.length > 0) {
        // Update existing profile
        await db.query(
          \`UPDATE student_profiles SET 
            degreeLevel = ?, intendedMajor = ?, cgpa = ?, ieltsToefl = ?, 
            gresatgmat = ?, budget = ?, researchPapers = ?, projects = ?, 
            internships = ?, extracurriculars = ?, fundingNeed = ?, skills = ?, latestCvName = ?,
            institution = ?, graduationYear = ?, researchInterests = ?, publications = ?, desiredDegree = ?, preferredCountries = ?, fundingPreference = ?
           WHERE userId = ?\`,
          [
            parsedData.degreeLevel,
            parsedData.intendedMajor,
            parsedData.cgpa,
            parsedData.ieltsToefl,
            parsedData.gresatgmat,
            null,
            parsedData.researchPapers,
            parsedData.projects,
            parsedData.internships,
            parsedData.extracurriculars,
            parsedData.fundingNeed,
            JSON.stringify(parsedData.skills || []),
            req.file.originalname,
            parsedData.institution || null,
            parsedData.graduationYear || null,
            JSON.stringify(parsedData.researchInterests || []),
            JSON.stringify(parsedData.publications || []),
            null,
            null,
            parsedData.fundingNeed || null,
            req.user.id
          ]
        );
      } else {`;

const replacement = `      if (existingProfiles.length > 0) {
        const current = existingProfiles[0];
        
        // Merge conservatively: Keep manually entered values if parser didn't find anything
        const degreeLevel = parsedData.degreeLevel || current.degreeLevel;
        const intendedMajor = parsedData.intendedMajor || current.intendedMajor;
        const cgpa = parsedData.cgpa !== null ? parsedData.cgpa : current.cgpa;
        const ieltsToefl = parsedData.ieltsToefl !== null ? parsedData.ieltsToefl : current.ieltsToefl;
        const gresatgmat = parsedData.gresatgmat !== null ? parsedData.gresatgmat : current.gresatgmat;
        const budget = current.budget; // Parser never extracts budget
        const researchPapers = parsedData.researchPapers !== null ? parsedData.researchPapers : current.researchPapers;
        const projects = parsedData.projects !== null ? parsedData.projects : current.projects;
        const internships = parsedData.internships !== null ? parsedData.internships : current.internships;
        const extracurriculars = parsedData.extracurriculars || current.extracurriculars;
        const fundingNeed = parsedData.fundingNeed || current.fundingNeed;
        
        // Merge arrays (if new CV has items, use them, otherwise keep old ones)
        const skills = parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills : (current.skills ? (typeof current.skills === 'string' ? JSON.parse(current.skills) : current.skills) : []);
        const researchInterests = parsedData.researchInterests && parsedData.researchInterests.length > 0 ? parsedData.researchInterests : (current.researchInterests ? (typeof current.researchInterests === 'string' ? JSON.parse(current.researchInterests) : current.researchInterests) : []);
        const publications = parsedData.publications && parsedData.publications.length > 0 ? parsedData.publications : (current.publications ? (typeof current.publications === 'string' ? JSON.parse(current.publications) : current.publications) : []);
        
        const institution = parsedData.institution || current.institution;
        const graduationYear = parsedData.graduationYear || current.graduationYear;
        const desiredDegree = current.desiredDegree;
        const preferredCountries = current.preferredCountries;
        const fundingPreference = current.fundingPreference;

        // Update existing profile
        await db.query(
          \`UPDATE student_profiles SET 
            degreeLevel = ?, intendedMajor = ?, cgpa = ?, ieltsToefl = ?, 
            gresatgmat = ?, budget = ?, researchPapers = ?, projects = ?, 
            internships = ?, extracurriculars = ?, fundingNeed = ?, skills = ?, latestCvName = ?,
            institution = ?, graduationYear = ?, researchInterests = ?, publications = ?, desiredDegree = ?, preferredCountries = ?, fundingPreference = ?
           WHERE userId = ?\`,
          [
            degreeLevel,
            intendedMajor,
            cgpa,
            ieltsToefl,
            gresatgmat,
            budget,
            researchPapers,
            projects,
            internships,
            extracurriculars,
            fundingNeed,
            JSON.stringify(skills),
            req.file.originalname,
            institution,
            graduationYear,
            JSON.stringify(researchInterests),
            JSON.stringify(publications),
            desiredDegree,
            preferredCountries,
            fundingPreference,
            req.user.id
          ]
        );
        
        // Update parsedData so that the frontend gets the merged data
        Object.assign(parsedData, {
          degreeLevel, intendedMajor, cgpa, ieltsToefl, gresatgmat, budget,
          researchPapers, projects, internships, extracurriculars, fundingNeed,
          skills, institution, graduationYear, researchInterests, publications,
          desiredDegree, preferredCountries, fundingPreference
        });
      } else {`;

code = code.replace(target, replacement);
fs.writeFileSync('backend/controllers/uploadController.js', code);
console.log("Patched uploadController.js to merge profile conservatively.");
