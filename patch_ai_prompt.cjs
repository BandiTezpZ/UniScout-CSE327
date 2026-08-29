const fs = require('fs');
let code = fs.readFileSync('backend/services/aiUniversityFinder.js', 'utf8');

const target = 'Select ALL relevant graduate-study options ONLY from the supplied UniScout catalogue that the student profile fulfills the requirements for.';
const replacement = 'Select up to 100 relevant graduate-study options ONLY from the supplied UniScout catalogue. Find the best possible matches for the student based on their profile, even if they do not meet every single requirement. Do not limit your output to a small number if there are many good matches.';

code = code.replace(target, replacement);
fs.writeFileSync('backend/services/aiUniversityFinder.js', code);
console.log("Patched prompt");
