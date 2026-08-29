const fs = require('fs');
let code = fs.readFileSync('src/components/FacultyDashboard.jsx', 'utf8');

code = code.replace("['suggested', Sparkles, 'Suggested Universities'],", "");
code = code.replace("['applications', BookOpen, 'Applications'],", "");

fs.writeFileSync('src/components/FacultyDashboard.jsx', code);
console.log("Patched FacultyDashboard");
