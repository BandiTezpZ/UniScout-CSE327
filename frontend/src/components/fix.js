const fs = require('fs');
const path = 'c:/Users/This PC/Downloads/UniScout_1.5.1/UniScout_1.5/frontend/src/components/Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// The broken string looks like:
// border ${formData. ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} 
// We want to replace it by looking at the value={formData.XYZ} prop that follows it!

content = content.replace(/border \$\{formData\. \? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'\}\s+rounded-xl([^>]+)value=\{formData\.(\w+)\}/g, (match, middle, propName) => {
  return `border \$\{formData.${propName} ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'\} rounded-xl${middle}value={formData.${propName}}`;
});

fs.writeFileSync(path, content);
console.log('Fixed file');
