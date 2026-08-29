const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

const target = `<div className="bg-brandNavyLight/50 border border-brandNavyLight p-4 rounded-2xl relative overflow-hidden">
            <h5 className="font-bold text-xs">Unlock Better Matches</h5>`;

const replacement = `{!(profile?.degreeLevel && profile?.intendedMajor && profile?.cgpa) && (
          <div className="bg-brandNavyLight/50 border border-brandNavyLight p-4 rounded-2xl relative overflow-hidden">
            <h5 className="font-bold text-xs">Unlock Better Matches</h5>`;

const targetClose = `              <ChevronRight size={12} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-brandNavyLight pt-4">`;

const replacementClose = `              <ChevronRight size={12} />
            </button>
          </div>
          )}

          <div className="flex items-center justify-between border-t border-brandNavyLight pt-4">`;

code = code.replace(target, replacement);
code = code.replace(targetClose, replacementClose);

fs.writeFileSync('src/components/Dashboard.jsx', code);
console.log("Patched sidebar logic");
