const fs = require('fs');
let code = fs.readFileSync('backend/controllers/uploadController.js', 'utf8');

const target = `      if (existingProfiles.length > 0) {
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
        
        const safeParse = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try { return JSON.parse(val); } catch (e) { return typeof val === 'string' ? val.split(',').map(s => s.trim()) : []; }
        };
        const skills = parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills : safeParse(current.skills);
        const researchInterests = parsedData.researchInterests && parsedData.researchInterests.length > 0 ? parsedData.researchInterests : safeParse(current.researchInterests);
        const publications = parsedData.publications && parsedData.publications.length > 0 ? parsedData.publications : safeParse(current.publications);
        
        const institution = parsedData.institution || current.institution;
        const graduationYear = parsedData.graduationYear || current.graduationYear;
        const desiredDegree = current.desiredDegree;
        const preferredCountries = current.preferredCountries;
        const fundingPreference = current.fundingPreference;`;

const replacement = `      if (existingProfiles.length > 0) {
        const current = existingProfiles[0];
        
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
        const extracurriculars = parsedData.extracurriculars || current.extracurriculars; // sometimes manual
        const fundingNeed = parsedData.fundingNeed || current.fundingNeed; // sometimes manual
        
        const safeParse = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try { return JSON.parse(val); } catch (e) { return typeof val === 'string' ? val.split(',').map(s => s.trim()) : []; }
        };
        
        // skills is never returned by parseCV (only by parseFacultyCV)
        const skills = safeParse(current.skills);
        
        // researchInterests and publications are returned by parseCV
        const researchInterests = parsedData.researchInterests || [];
        const publications = parsedData.publications || [];
        
        const institution = parsedData.institution;
        const graduationYear = parsedData.graduationYear;
        const desiredDegree = current.desiredDegree;
        const preferredCountries = current.preferredCountries;
        const fundingPreference = current.fundingPreference;`;

code = code.replace(target, replacement);
fs.writeFileSync('backend/controllers/uploadController.js', code);
console.log("Patched uploadController.js to replace CV info");
