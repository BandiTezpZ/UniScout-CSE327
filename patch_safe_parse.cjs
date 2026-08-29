const fs = require('fs');
let code = fs.readFileSync('backend/controllers/uploadController.js', 'utf8');

const target = `        const skills = parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills : (current.skills ? (typeof current.skills === 'string' ? JSON.parse(current.skills) : current.skills) : []);
        const researchInterests = parsedData.researchInterests && parsedData.researchInterests.length > 0 ? parsedData.researchInterests : (current.researchInterests ? (typeof current.researchInterests === 'string' ? JSON.parse(current.researchInterests) : current.researchInterests) : []);
        const publications = parsedData.publications && parsedData.publications.length > 0 ? parsedData.publications : (current.publications ? (typeof current.publications === 'string' ? JSON.parse(current.publications) : current.publications) : []);`;

const replacement = `        const safeParse = (val) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try { return JSON.parse(val); } catch (e) { return typeof val === 'string' ? val.split(',').map(s => s.trim()) : []; }
        };
        const skills = parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills : safeParse(current.skills);
        const researchInterests = parsedData.researchInterests && parsedData.researchInterests.length > 0 ? parsedData.researchInterests : safeParse(current.researchInterests);
        const publications = parsedData.publications && parsedData.publications.length > 0 ? parsedData.publications : safeParse(current.publications);`;

code = code.replace(target, replacement);
fs.writeFileSync('backend/controllers/uploadController.js', code);
console.log("Patched safe array parsing");
