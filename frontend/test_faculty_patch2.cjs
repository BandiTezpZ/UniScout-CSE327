const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/FacultyDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Sparkles, FileText } from 'lucide-react';", "import { Sparkles } from 'lucide-react';");

fs.writeFileSync(file, content);
console.log('Fixed double import');
