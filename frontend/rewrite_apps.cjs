const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function Applications({ role }) {
  const [apps, setApps] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newApp, setNewApp] = useState({ university: '', program: '', status: 'Draft' });
  const [dbUniversities, setDbUniversities] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(\`uniscout_apps_\${role}\`);
    if (saved) setApps(JSON.parse(saved));
    
    // Fetch universities for dropdown options
    api.getUniversities().then(data => {
      if (data && data.universities) {
        setDbUniversities(data.universities);
      }
    }).catch(err => console.error('Failed to load universities:', err));
  }, [role]);

  const saveApps = (newApps) => {
    setApps(newApps);
    localStorage.setItem(\`uniscout_apps_\${role}\`, JSON.stringify(newApps));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newApp.university || !newApp.program) return;
    saveApps([{ ...newApp, id: Date.now() }, ...apps]);
    setNewApp({ university: '', program: '', status: 'Draft' });
    setShowAdd(false);
  };

  const handleDelete = (id) => saveApps(apps.filter(a => a.id !== id));
  
  // Get unique university names
  const uniqueUniversities = Array.from(new Set(dbUniversities.map(u => u.university_name))).sort();
  // Get programs for selected university
  const availablePrograms = dbUniversities.filter(u => u.university_name === newApp.university).map(u => u.program);
  const uniquePrograms = Array.from(new Set(availablePrograms)).sort();

  return (
    <div className="p-8 h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brandNavy flex items-center gap-2">
            <BookOpen size={24} className="text-brandBlue" />
            My Applications
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage and track your university applications.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-brandBlue text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-600 transition">
          <Plus size={18} /> New Application
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 bg-white p-4 rounded-xl border border-blue-100 flex gap-4 items-end shadow-sm">
          <div className="flex-1">
            <label className="text-xs font-bold text-brandNavy block mb-1">University</label>
            <select className="w-full px-3 py-2 border rounded-lg bg-white" value={newApp.university} onChange={e => setNewApp({...newApp, university: e.target.value, program: ''})} required>
              <option value="">Select a university</option>
              {uniqueUniversities.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-brandNavy block mb-1">Program</label>
            <select className="w-full px-3 py-2 border rounded-lg bg-white" value={newApp.program} onChange={e => setNewApp({...newApp, program: e.target.value})} required disabled={!newApp.university}>
              <option value="">Select a program</option>
              {uniquePrograms.map(prog => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="text-xs font-bold text-brandNavy block mb-1">Status</label>
            <select className="w-full px-3 py-2 border rounded-lg bg-white" value={newApp.status} onChange={e => setNewApp({...newApp, status: e.target.value})}>
              <option>Draft</option>
              <option>Submitted</option>
              <option>Under Review</option>
              <option>Accepted</option>
              <option>Rejected</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 bg-brandNavy text-white rounded-lg font-medium hover:bg-gray-800 shrink-0">Add</button>
        </form>
      )}

      {apps.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-white rounded-xl border border-blue-50">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p>No applications tracked yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-blue-100 text-xs uppercase text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-4">University</th>
                <th className="px-6 py-4">Program</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-blue-50/50">
                  <td className="px-6 py-4 font-semibold text-brandNavy">{app.university}</td>
                  <td className="px-6 py-4 text-gray-600">{app.program}</td>
                  <td className="px-6 py-4">
                    <span className={\`px-2.5 py-1 rounded-full text-xs font-bold \${app.status === 'Accepted' ? 'bg-green-100 text-green-700' : app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}\`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(app.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/Applications.jsx', code);
console.log("Rewrote Applications.jsx");
