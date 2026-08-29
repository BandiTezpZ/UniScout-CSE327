const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/UniversityBrowser.jsx', 'utf8');

const target = `          <div><h2 className="text-2xl font-extrabold underline decoration-2 underline-offset-4">{title}</h2>{mode === 'suggested' && <p className="mt-2 max-w-xl text-sm text-gray-500">Based on your CV and preferences, Gemini analyzes UniScout's local university catalogue and explains the programmes worth investigating.</p>}</div>`;
const replacement = `          <div>{mode !== 'suggested' && <h2 className="text-2xl font-extrabold underline decoration-2 underline-offset-4">{title}</h2>}{mode === 'suggested' && <p className="mt-2 max-w-2xl text-lg text-gray-700">Based on your CV and preferences, Gemini analyzes UniScout's local university catalogue and explains the programmes worth investigating.</p>}</div>`;

code = code.replace(target, replacement);
fs.writeFileSync('frontend/src/components/UniversityBrowser.jsx', code);
console.log("Patched UniversityBrowser.jsx");
