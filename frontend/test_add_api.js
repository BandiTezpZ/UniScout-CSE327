const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/api.js');
let content = fs.readFileSync(file, 'utf8');
if (!content.includes('getSuggestedUniversities:')) {
  content = content.replace("getSavedUniversities: async () => request('/api/universities/saved'),", "getSavedUniversities: async () => request('/api/universities/saved'),\n  getSuggestedUniversities: async () => request('/api/universities/suggested'),");
  fs.writeFileSync(file, content);
  console.log('Added getSuggestedUniversities to api.js');
}
