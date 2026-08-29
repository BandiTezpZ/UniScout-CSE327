const fs = require('fs');
let code = fs.readFileSync('backend/controllers/uploadController.js', 'utf8');

const target = `        const institution = parsedData.institution;
        const graduationYear = parsedData.graduationYear;`;

const replacement = `        const institution = parsedData.institution || current.institution;
        const graduationYear = parsedData.graduationYear || current.graduationYear;`;

code = code.replace(target, replacement);
fs.writeFileSync('backend/controllers/uploadController.js', code);
console.log("Patched institution bug");
