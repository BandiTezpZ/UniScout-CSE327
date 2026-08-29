const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add Applications import
if (!content.includes("import Applications")) {
  content = content.replace("import UniversityBrowser from './UniversityBrowser';", "import UniversityBrowser from './UniversityBrowser';\nimport Applications from './Applications';");
}

// 2. Fix min-h-screen to h-full
content = content.replace('<div className="min-h-screen flex bg-brandGrayBg text-brandNavy font-sans">', '<div className="h-full flex bg-brandGrayBg text-brandNavy font-sans overflow-hidden">');

// 3. Fix aside overflow
content = content.replace('<aside className="w-64 bg-brandNavy text-white flex flex-col justify-between p-6 shrink-0 shadow-xl">', '<aside className="w-64 bg-brandNavy text-white flex flex-col justify-between p-6 shrink-0 shadow-xl overflow-y-auto custom-scrollbar">');

// 4. Update Recommendations button to use FileText (so Sparkles can be used for AI)
content = content.replace('<Sparkles size={18} />\n              <span className="leading-tight">Recommendations</span>', '<FileText size={18} />\n              <span className="leading-tight">Recommendations</span>');

// 5. Add Suggested Universities and update Applications button
const targetNav = `<button onClick={() => setCurrentTab('browse')} className={\`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all \${currentTab === 'browse' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
              <GraduationCap size={18} />
              <span className="leading-tight">Browse Universities</span>
            </button>`;

const newNav = `<button onClick={() => setCurrentTab('suggested')} className={\`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all \${currentTab === 'suggested' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
              <Sparkles size={18} />
              <span className="leading-tight">Suggested Universities</span>
            </button>
            <button onClick={() => setCurrentTab('browse')} className={\`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all \${currentTab === 'browse' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
              <GraduationCap size={18} />
              <span className="leading-tight">Browse Universities</span>
            </button>`;

content = content.replace(targetNav, newNav);

const oldAppBtn = `<button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 font-medium rounded-xl text-sm text-left transition-all">
              <BookOpen size={18} />
              <span className="leading-tight">Applications</span>
            </button>`;
const newAppBtn = `<button onClick={() => setCurrentTab('applications')} className={\`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all \${currentTab === 'applications' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
              <BookOpen size={18} />
              <span className="leading-tight">Applications</span>
            </button>`;
content = content.replace(oldAppBtn, newAppBtn);

// 6. Add to main render
const targetRender = `{currentTab === 'browse' && <UniversityBrowser />}`;
const newRender = `{currentTab === 'browse' && <UniversityBrowser />}\n          {currentTab === 'suggested' && <UniversityBrowser mode="suggested" />}\n          {currentTab === 'applications' && <Applications role="Student" />}`;
content = content.replace(targetRender, newRender);

fs.writeFileSync(file, content);
console.log('Patched Dashboard.jsx');
