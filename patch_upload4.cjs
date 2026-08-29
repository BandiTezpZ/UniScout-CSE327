const fs = require('fs');
let code = fs.readFileSync('backend/controllers/uploadController.js', 'utf8');

const regex = /const current = existingProfiles\[0\];[\s\S]*?\/\/ Update existing profile/;

const replacement = `const current = existingProfiles[0];
        
        // The user explicitly requested: "old information from cv should be replaced by new parsed information"
        // This means ANY field that the CV parser handles should be entirely overwritten by the new parsedData (even if null).
        // Only preserve strictly manual fields that the CV parser NEVER outputs.
        const degreeLevel = parsedData.degreeLevel;
        const intendedMajor = parsedData.intendedMajor;
        const cgpa = parsedData.cgpa;
        const ieltsToefl = parsedData.ieltsToefl;
        const gresatgmat = parsedData.gresatgmat;
        const researchPapers = parsedData.researchPapers;
        const projects = parsedData.projects;
        const internships = parsedData.internships;
        
        // Manual fields (preserve these since parser doesn't provide them, or they are primarily manual)
        const budget = current.budget;
        const extracurriculars = parsedData.extracurriculars || current.extracurriculars;
        const fundingNeed = parsedData.fundingNeed || current.fundingNeed;
        
        const safeParse = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try { return JSON.parse(val); } catch (e) { return typeof val === 'string' ? val.split(',').map(s => s.trim()) : []; }
        };
        
        const skills = safeParse(current.skills); // manual
        
        const researchInterests = parsedData.researchInterests || [];
        const publications = parsedData.publications || [];
        
        const institution = parsedData.institution || current.institution;
        const graduationYear = parsedData.graduationYear || current.graduationYear;
        const desiredDegree = current.desiredDegree;
        const preferredCountries = current.preferredCountries;
        const fundingPreference = current.fundingPreference;

        // Update existing profile`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('backend/controllers/uploadController.js', code);
    console.log("SUCCESS");
} else {
    console.log("REGEX FAILED TO MATCH");
}
