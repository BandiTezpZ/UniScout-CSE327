const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

const target = `            >
              <Settings size={18} />
              <span className="leading-tight">Settings</span>
            </button>
                <div className="w-10 h-10 rounded-full bg-brandBlue text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md">`;

const replacement = `            >
              <Settings size={18} />
              <span className="leading-tight">Settings</span>
            </button>
          </nav>
        </div>

        {/* Upgrade Card & Profile Summary */}
        <div className="space-y-6 mt-6">
          {!(profile?.degreeLevel && profile?.intendedMajor && profile?.cgpa) && (
            <div className="bg-brandNavyLight/50 border border-brandNavyLight p-4 rounded-2xl relative overflow-hidden">
              <h5 className="font-bold text-xs">Unlock Better Matches</h5>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Complete your profile for more accurate university recommendations.
              </p>
              <button type="button" onClick={() => setCurrentTab('profile')} className="mt-3 flex items-center space-x-1 text-[10px] font-bold text-brandBlueLight hover:underline">
                <span className="leading-tight">Complete Profile</span>
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-brandNavyLight pt-4">
            <div className="flex items-center space-x-3 min-w-0">
              {user.profilePicture ? (
                <img src={\`http://localhost:5001\${user.profilePicture}\`} alt="Profile" className="w-10 h-10 rounded-full object-cover shrink-0 shadow-md border border-brandBlue" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brandBlue text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md">`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/Dashboard.jsx', code);
console.log("Fixed missing tags 2");
