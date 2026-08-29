import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { api } from '../services/api';

const emptyForm = {
  university_name: '',
  country: 'USA',
  state: '',
  program: '',
  rank_tier: 3,
  tuition_usd: 0,
  living_cost_usd: 0,
  cost_of_attendance_usd: 0,
  min_cgpa: 3,
  min_ielts: 6.5,
  min_gre: 300,
  accepts_without_gre: 'Varies',
  research_level: 3,
  ms_cs: 'Yes',
  research_category: '',
  intake: 'Fall',
  deadline: '',
  imageUrl: '',
  data_note: ''
};

export default function AdminUniversityManager() {
  const [universities, setUniversities] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('rank_asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setUniversities(await api.getAdminUniversities());
    } catch (err) {
      setError(err.message || 'Failed to load university database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...universities];
    const term = query.trim().toLowerCase();
    if (term) {
      result = result.filter(item =>
        item.university_name.toLowerCase().includes(term) ||
        item.state.toLowerCase().includes(term) ||
        item.program.toLowerCase().includes(term)
      );
    }
    
    result.sort((a, b) => {
      if (sort === 'cost_asc') return (a.cost_of_attendance_usd || 0) - (b.cost_of_attendance_usd || 0);
      if (sort === 'cost_desc') return (b.cost_of_attendance_usd || 0) - (a.cost_of_attendance_usd || 0);
      if (sort === 'deadline_asc') return String(a.deadline || '').localeCompare(String(b.deadline || ''));
      if (sort === 'deadline_desc') return String(b.deadline || '').localeCompare(String(a.deadline || ''));
      if (sort === 'subject_asc') return String(a.program || '').localeCompare(String(b.program || ''));
      if (sort === 'subject_desc') return String(b.program || '').localeCompare(String(a.program || ''));
      if (sort === 'rank_asc') return (a.rank_tier || 999) - (b.rank_tier || 999) || String(a.university_name).localeCompare(String(b.university_name));
      if (sort === 'rank_desc') return (b.rank_tier || 999) - (a.rank_tier || 999) || String(a.university_name).localeCompare(String(b.university_name));
      return (a.rank_tier || 999) - (b.rank_tier || 999);
    });
    
    return result;
  }, [query, sort, universities]);

  const startCreate = () => {
    setEditing({ mode: 'create' });
    setForm(emptyForm);
  };

  const startEdit = (university) => {
    setEditing({ mode: 'edit', id: university.id });
    setForm(university);
  };

  const close = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editing.mode === 'create') await api.createUniversity(form);
      else await api.updateUniversity(editing.id, form);
      close();
      load();
    } catch (err) {
      alert(err.message || 'Failed to save university');
    }
  };

  const remove = async (university) => {
    if (!window.confirm(`Delete ${university.university_name}?`)) return;
    try {
      await api.deleteUniversity(university.id);
      setUniversities(items => items.filter(item => item.id !== university.id));
    } catch (err) {
      alert(err.message || 'Failed to delete university');
    }
  };

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-brandNavy">University Database Management</h2>
          <p className="mt-1 text-xs text-brandSlate">Add, modify, delete, and maintain the university records students browse.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Reload
          </button>
          <button onClick={startCreate} className="flex items-center gap-2 rounded-xl bg-brandBlue px-4 py-2 text-xs font-bold text-white">
            <Plus size={14} />
            Add University
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <label className="relative block flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search universities, states, programs"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-brandBlue"
          />
        </label>
        
        <label className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Sort by:</span>
          <select value={sort} onChange={event => setSort(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-brandBlue">
            <option value="rank_asc">Rank (High to Low)</option>
            <option value="rank_desc">Rank (Low to High)</option>
            <option value="cost_asc">Cost (Low to High)</option>
            <option value="cost_desc">Cost (High to Low)</option>
            <option value="subject_asc">Subject (A to Z)</option>
            <option value="subject_desc">Subject (Z to A)</option>
          </select>
        </label>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-brandPaleBlue shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-sm font-bold text-gray-400">Loading university database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-blue-100 text-brandSlate">
                  <th className="p-4">University</th>
                  <th className="p-4">Program</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Attendance</th>
                  <th className="p-4">Requirements</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(university => (
                  <tr key={university.id} className="border-b border-white/70 bg-white/50">
                    <td className="p-4">
                      <p className="font-extrabold text-brandNavy">{university.university_name}</p>
                      <p className="mt-1 text-[10px] text-brandSlate">{university.state}, {university.country}</p>
                    </td>
                    <td className="p-4 font-bold">{university.program}</td>
                    <td className="p-4">{university.rank_tier}</td>
                    <td className="p-4">${Number(university.cost_of_attendance_usd || 0).toLocaleString()}</td>
                    <td className="p-4">CGPA {university.min_cgpa} · IELTS {university.min_ielts} · GRE {university.min_gre}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(university)} className="rounded-lg bg-blue-50 p-2 text-brandBlue"><Edit3 size={14} /></button>
                        <button onClick={() => remove(university)} className="rounded-lg bg-red-50 p-2 text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{editing.mode === 'create' ? 'Add University' : 'Edit University'}</h3>
              <button onClick={close} className="rounded-lg p-2 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                ['university_name', 'University name'],
                ['state', 'State'],
                ['country', 'Country'],
                ['program', 'Program'],
                ['research_category', 'Research category'],
                ['intake', 'Intake'],
                ['deadline', 'Deadline'],
                ['accepts_without_gre', 'GRE policy']
              ].map(([field, label]) => (
                <label key={field}>
                  <span className="mb-1 block text-xs font-bold text-brandNavy">{label}</span>
                  <input value={form[field] || ''} onChange={event => update(field, event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" required={field === 'university_name'} />
                </label>
              ))}
              <label className="md:col-span-3">
                <span className="mb-1 block text-xs font-bold text-brandNavy">Campus image URL or Upload</span>
                <div className="flex items-center gap-2">
                  <input value={form.imageUrl || ''} onChange={event => update('imageUrl', event.target.value)} placeholder="https://..." className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  <label className="cursor-pointer bg-brandPaleBlue hover:bg-blue-100 text-brandNavy px-4 py-2 text-xs font-bold rounded-xl border border-blue-200 transition-all whitespace-nowrap">
                    Upload
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const data = await api.uploadUniversityPicture(file);
                        update('imageUrl', `http://localhost:5001${data.imageUrl}`);
                      } catch (err) {
                        alert(err.message || 'Upload failed');
                      }
                    }} />
                  </label>
                </div>
              </label>
              {[
                ['rank_tier', 'Rank tier'],
                ['tuition_usd', 'Tuition USD'],
                ['living_cost_usd', 'Living cost USD'],
                ['cost_of_attendance_usd', 'Attendance USD'],
                ['min_cgpa', 'Min CGPA'],
                ['min_ielts', 'Min IELTS'],
                ['min_gre', 'Min GRE'],
                ['research_level', 'Research level']
              ].map(([field, label]) => (
                <label key={field}>
                  <span className="mb-1 block text-xs font-bold text-brandNavy">{label}</span>
                  <input type="number" step="0.1" value={form[field] || 0} onChange={event => update(field, event.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                </label>
              ))}
              <label className="md:col-span-3">
                <span className="mb-1 block text-xs font-bold text-brandNavy">Data note</span>
                <textarea value={form.data_note || ''} onChange={event => update('data_note', event.target.value)} rows="3" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              </label>
              <div className="md:col-span-3 flex justify-end gap-3 pt-3">
                <button type="button" onClick={close} className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-bold">Cancel</button>
                <button type="submit" className="flex items-center gap-2 rounded-xl bg-brandBlue px-5 py-2 text-sm font-bold text-white">
                  <Save size={15} />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
