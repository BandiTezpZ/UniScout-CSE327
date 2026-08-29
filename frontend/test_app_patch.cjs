const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/App.jsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the logged in route return block
// It currently looks like:
//       <div className="h-screen flex flex-col overflow-hidden">
//         <div className="flex-grow flex flex-col min-h-0">
//           <ComponentToRender user={user} onLogout={handleLogout} />
//         </div>
//         <Footer />
//       </div>

content = content.replace(
  '<div className="h-screen flex flex-col overflow-hidden">\n        <div className="flex-grow flex flex-col min-h-0">\n          <ComponentToRender user={user} onLogout={handleLogout} />\n        </div>\n        <Footer />\n      </div>',
  '<div className="h-screen flex flex-col overflow-hidden">\n        <div className="flex-grow flex flex-col min-h-0">\n          <ComponentToRender user={user} onLogout={handleLogout} />\n        </div>\n      </div>'
);

fs.writeFileSync(file, content);
console.log('Removed Footer from logged in views in App.jsx');
