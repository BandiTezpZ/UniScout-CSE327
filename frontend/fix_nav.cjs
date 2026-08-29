const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// I will extract the nav content and replace it manually.
const oldNavStart = content.indexOf('<nav className="space-y-1.5">');
const oldNavEnd = content.indexOf('</nav>', oldNavStart) + '</nav>'.length;

const newNav = `<nav className="space-y-1.5">
            <button
              onClick={() => { setCurrentTab('dashboard'); setSaveSuccessMsg(''); }}
              className={\`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl text-sm text-left transition-all \${
                currentTab === 'dashboard'
                  ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }\`}
            >
              <LayoutDashboard size={18} />
              <span className="leading-tight">Dashboard</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab('upload');
                setSaveSuccessMsg('');
                setErrorMsg('');
                setFileName('');
                setFileSize('');
                setProgress(0);
                setActiveStep(0);
              }}
              className={\`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl text-sm text-left transition-all \${
                currentTab === 'upload'
                  ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }\`}
            >
              <FileUp size={18} />
              <span className="leading-tight">Upload CV</span>
            </button>
            <button
              onClick={() => { setCurrentTab('profile'); setSaveSuccessMsg(''); }}
              className={\`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl text-sm text-left transition-all \${
                currentTab === 'profile'
                  ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }\`}
            >
              <UserIcon size={18} />
              <span className="leading-tight">Profile Info</span>
            </button>
            <button onClick={() => setCurrentTab('recommendations')} className={\`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all \${currentTab === 'recommendations' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
              <FileText size={18} />
              <span className="leading-tight">Recommendations</span>
            </button>
            <button onClick={() => setCurrentTab('suggested')} className={\`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all \${currentTab === 'suggested' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
              <Sparkles size={18} />
              <span className="leading-tight">Suggested Universities</span>
            </button>
            <button onClick={() => setCurrentTab('browse')} className={\`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all \${currentTab === 'browse' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
              <GraduationCap size={18} />
              <span className="leading-tight">Browse Universities</span>
            </button>
            <button onClick={() => setCurrentTab('shortlisted')} className={\`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all \${currentTab === 'shortlisted' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
              <Award size={18} />
              <span className="leading-tight">Shortlisted</span>
            </button>
            <button onClick={() => setCurrentTab('applications')} className={\`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all \${currentTab === 'applications' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}\`}>
              <BookOpen size={18} />
              <span className="leading-tight">Applications</span>
            </button>
            <button
              onClick={() => { setCurrentTab('settings'); setResetPassMsg(''); setResetPassError(''); }}
              className={\`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl text-sm text-left transition-all \${
                currentTab === 'settings'
                  ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }\`}
            >
              <Settings size={18} />
              <span className="leading-tight">Settings</span>
            </button>
          </nav>`;

content = content.substring(0, oldNavStart) + newNav + content.substring(oldNavEnd);
fs.writeFileSync(file, content);
console.log('Fixed nav in Dashboard.jsx');
