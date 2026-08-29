const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'routes/universityRoutes.js');
let content = fs.readFileSync(file, 'utf8');
if (!content.includes('/suggested')) {
  content = content.replace("router.get('/saved', controller.saved);", "router.get('/saved', controller.saved);\nrouter.get('/suggested', controller.suggested);");
  fs.writeFileSync(file, content);
  console.log('Added /suggested route');
}
