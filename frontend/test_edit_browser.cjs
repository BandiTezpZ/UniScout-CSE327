const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/UniversityBrowser.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const title = mode === 'saved' ? 'Saved Colleges' : 'College Search';",
  "const title = mode === 'saved' ? 'Saved Colleges' : mode === 'suggested' ? 'Suggested Colleges (AI)' : 'College Search';"
);

content = content.replace(
  "const data = mode === 'saved'\n        ? await api.getSavedUniversities()\n        : await api.getUniversities({ q: query, sort });",
  "const data = mode === 'saved'\n        ? await api.getSavedUniversities()\n        : mode === 'suggested' ? await api.getSuggestedUniversities()\n        : await api.getUniversities({ q: query, sort });"
);

fs.writeFileSync(file, content);
console.log('Edited UniversityBrowser.jsx');
