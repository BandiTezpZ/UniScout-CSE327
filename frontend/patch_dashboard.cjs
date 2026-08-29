const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

code = code.replace(
  '<label className="text-xs font-bold text-brandNavy block">English Test Score (IELTS / TOEFL)</label>',
  '<label className="text-xs font-bold text-brandNavy block">English Test Score (IELTS)</label>'
);

code = code.replace(
  'placeholder="e.g. 8.0 (IELTS) or 105 (TOEFL)"',
  'placeholder="e.g. 7.5"'
);

code = code.replace(
  '<label className="text-xs font-bold text-brandNavy block">Standardized Test Score (GRE / SAT / GMAT)</label>',
  '<label className="text-xs font-bold text-brandNavy block">Standardized Test Score (GRE)</label>'
);

code = code.replace(
  'placeholder="e.g. 322 or 1450"',
  'placeholder="e.g. 322"'
);

fs.writeFileSync('src/components/Dashboard.jsx', code);
console.log('Patched Dashboard.jsx');
