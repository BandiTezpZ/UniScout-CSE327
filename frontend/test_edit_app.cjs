const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/App.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "    return (\n      <div className=\"min-h-screen flex flex-col\">\n        <div className=\"flex-grow flex flex-col\">\n          <ComponentToRender user={user} onLogout={handleLogout} />\n        </div>\n        <Footer />\n      </div>\n    );",
  "    return (\n      <div className=\"h-screen flex flex-col overflow-hidden\">\n        <div className=\"flex-grow flex flex-col min-h-0\">\n          <ComponentToRender user={user} onLogout={handleLogout} />\n        </div>\n        <Footer />\n      </div>\n    );"
);

fs.writeFileSync(file, content);
console.log('Edited App.jsx');
