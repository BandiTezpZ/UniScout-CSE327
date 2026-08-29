import React, { useState, useEffect, useMemo } from 'react';
import { Database, LogOut, Shield, Users, RefreshCw, CheckCircle, XCircle, Search, Plus } from 'lucide-react';
import { api } from '../services/api';
import AdminUniversityManager from './AdminUniversityManager';
import logo from '../assets/logo.jpg';

export default function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('adminDashboardTab') || 'users';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('date_desc');
  const [showAddUser, setShowAddUser] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', role: 'Student' });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('adminDashboardTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch users list');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', role: '', isBlocked: false });

  const startEdit = (user) => {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName, email: user.email, role: user.role, isBlocked: !!user.isBlocked });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await api.updateUser(editingUser.id, editForm);
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updatedUser.user } : u));
      setEditingUser(null);
    } catch (err) {
      alert(err.message || 'Failed to update user');
    }
  };

  const toggleBlocked = async (row) => {
    try {
      const next = !row.isBlocked;
      await api.setUserBlocked(row.id, next);
      setUsers(users.map(u => u.id === row.id ? { ...u, isBlocked: next } : u));
    } catch (err) {
      alert(err.message || 'Failed to update blocked status');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const result = await api.adminCreateUser(addForm);
      setUsers([result.user, ...users]);
      setShowAddUser(false);
      setAddForm({ fullName: '', email: '', password: '', role: 'Student' });
    } catch (err) {
      alert(err.message || 'Failed to create user');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = Array.isArray(users) ? [...users] : [];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.fullName && u.fullName.toLowerCase().includes(lowerQ)) ||
        (u.email && u.email.toLowerCase().includes(lowerQ))
      );
    }

    return result.sort((a, b) => {
      if (sortType === 'name_asc') return (a.fullName || '').localeCompare(b.fullName || '');
      if (sortType === 'name_desc') return (b.fullName || '').localeCompare(a.fullName || '');
      if (sortType === 'role') return (a.role || '').localeCompare(b.role || '');
      if (sortType === 'status') return (a.isBlocked === b.isBlocked ? 0 : a.isBlocked ? 1 : -1);
      
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      if (sortType === 'date_asc') return dateA - dateB;
      return dateB - dateA;
    });
  }, [users, searchQuery, sortType]);

  return (
    <div className="h-full overflow-y-auto bg-brandGrayBg text-brandNavy font-sans flex flex-col">
      {/* Top Banner */}
      <header className="bg-brandNavy text-white px-8 py-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="UniScout Logo" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
          <div>
            <span className="text-lg font-bold tracking-wider block">UniScout Control Panel</span>
            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Admin Role Portal</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs font-bold text-white">{user.fullName}</p>
            <p className="text-[10px] text-gray-400">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all flex items-center space-x-1"
          >
            <LogOut size={16} />
            <span className="text-xs font-bold">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex gap-2 rounded-2xl bg-white p-1 shadow-sm border border-gray-200 w-fit">
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold ${activeTab === 'users' ? 'bg-brandBlue text-white' : 'text-brandSlate'}`}>
            <Users size={15} />
            Users
          </button>
          <button onClick={() => setActiveTab('universities')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold ${activeTab === 'universities' ? 'bg-brandBlue text-white' : 'text-brandSlate'}`}>
            <Database size={15} />
            Universities
          </button>
        </div>

        {activeTab === 'universities' ? (
          <AdminUniversityManager />
        ) : (
        <>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-xl font-extrabold text-brandNavy flex items-center space-x-2">
            <Users size={22} className="text-brandBlue" />
            <span>Registered Users Management</span>
          </h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-xs font-medium border border-gray-200 rounded-xl focus:outline-none focus:border-brandBlue focus:ring-1 focus:ring-brandBlue/30 w-48"
              />
            </div>
            
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-xl focus:outline-none focus:border-brandBlue focus:ring-1 focus:ring-brandBlue/30 text-gray-600 bg-white"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="role">Role</option>
              <option value="status">Status</option>
            </select>

            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-brandBlue text-white hover:bg-blue-700 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Add User</span>
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-xs font-bold rounded-xl transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Reload</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-gray-400 text-sm font-semibold">
              Loading UniScout database records...
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
            <div className="p-20 text-center text-gray-400 text-sm font-semibold">
              No users match your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brandPaleBlue border-b border-blue-100 text-brandSlate font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">User Details</th>
                    <th className="p-4">Account Role</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4">Extracted CV Metrics</th>
                    <th className="p-4">Created Timestamp</th>
                    <th className="p-4 pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedUsers.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-brandPaleBlue/30 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-brandNavy">{row.fullName}</p>
                        <p className="text-[10px] text-brandSlate mt-0.5">{row.email}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${row.isBlocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {row.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${
                          row.role === 'Admin'
                            ? 'bg-purple-50 text-purple-600 border-purple-100'
                            : 'bg-blue-50 text-brandBlue border-blue-100'
                        }`}>
                          {row.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {row.isVerified ? (
                          <span className="flex items-center space-x-1 text-emerald-600 font-bold text-[10px]">
                            <CheckCircle size={14} />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-amber-500 font-bold text-[10px]">
                            <XCircle size={14} />
                            <span>Pending Verification</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {row.profile && row.profile.cgpa ? (
                          <div className="space-y-1 text-[10px] text-gray-600 font-medium">
                            <p><span className="font-bold text-brandNavy">CGPA:</span> {row.profile.cgpa.toFixed(2)}</p>
                            <p><span className="font-bold text-brandNavy">IELTS/TOEFL:</span> {row.profile.ieltsToefl || 'N/A'}</p>
                            <p><span className="font-bold text-brandNavy">GRE:</span> {row.profile.gresatgmat || 'N/A'}</p>
                          </div>
                        ) : row.role === 'Student' ? (
                          <span className="text-gray-400 italic">No CV uploaded yet</span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 font-medium">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex space-x-2 text-xs">
                          <button onClick={() => startEdit(row)} className="text-brandBlue hover:underline">Edit</button>
                          <button onClick={() => toggleBlocked(row)} className={row.isBlocked ? 'text-emerald-600 hover:underline' : 'text-amber-600 hover:underline'}>
                            {row.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold mb-4">Edit User</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-brandNavy block mb-1">Full Name</label>
                  <input
                    className="w-full border rounded p-2"
                    value={editForm.fullName}
                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brandNavy block mb-1">Email</label>
                  <input
                    className="w-full border rounded p-2"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brandNavy block mb-1">Role</label>
                  <select
                    className="w-full border rounded p-2"
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={editForm.isBlocked} onChange={e => setEditForm({ ...editForm, isBlocked: e.target.checked })} />
                  Block this user
                </label>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-brandBlue text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold mb-4">Add New User</h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-brandNavy block mb-1">Full Name *</label>
                  <input
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-brandBlue focus:border-brandBlue outline-none"
                    value={addForm.fullName}
                    onChange={e => setAddForm({ ...addForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brandNavy block mb-1">Email *</label>
                  <input
                    required
                    type="email"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-brandBlue focus:border-brandBlue outline-none"
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brandNavy block mb-1">Password *</label>
                  <input
                    required
                    type="password"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-brandBlue focus:border-brandBlue outline-none"
                    value={addForm.password}
                    onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brandNavy block mb-1">Role *</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-brandBlue focus:border-brandBlue outline-none bg-white"
                    value={addForm.role}
                    onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={addLoading} className="px-4 py-2 bg-brandBlue text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50">
                    {addLoading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </>
        )}
      </main>

      {/* Security Footer */}
      <footer className="h-12 border-t border-gray-200 bg-white flex items-center justify-center space-x-2 text-gray-500 text-xs shrink-0 mt-6">
        <Shield size={14} className="text-gray-400" />
        <span>UniScout Admin Console Access Secured</span>
      </footer>
    </div>
  );
}
