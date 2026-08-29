const fs = require('fs');
let code = fs.readFileSync('src/components/Applications.jsx', 'utf8');

// Add handleStatusChange function
const addFunctionTarget = `  const handleDelete = (id) => saveApps(apps.filter(a => a.id !== id));`;
const handleStatusChangeFunc = `  const handleDelete = (id) => saveApps(apps.filter(a => a.id !== id));
  
  const handleStatusChange = (id, newStatus) => {
    saveApps(apps.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };`;
code = code.replace(addFunctionTarget, handleStatusChangeFunc);

// Replace the status column to use a select instead of just a span
const statusColumnTarget = `<span className={\`px-2.5 py-1 rounded-full text-xs font-bold \${app.status === 'Accepted' ? 'bg-green-100 text-green-700' : app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}\`}>
                      {app.status}
                    </span>`;
const statusColumnReplacement = `<select 
                      value={app.status} 
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className={\`px-2.5 py-1 rounded-full text-xs font-bold outline-none cursor-pointer appearance-none text-center \${app.status === 'Accepted' ? 'bg-green-100 text-green-700 border border-green-200' : app.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}\`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>`;
code = code.replace(statusColumnTarget, statusColumnReplacement);

fs.writeFileSync('src/components/Applications.jsx', code);
console.log("Patched status change feature");
