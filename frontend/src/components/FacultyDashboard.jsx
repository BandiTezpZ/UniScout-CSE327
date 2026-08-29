import React, { useEffect, useRef, useState } from 'react';
import { Heart,
  Award, Bell, BookOpen, CheckCircle, Clock, FileUp, FileText, GraduationCap, LayoutDashboard,
  LogOut, Settings, Shield, Upload, User as UserIcon, XCircle
} from 'lucide-react';
import { api } from '../services/api';
import UniversityBrowser from './UniversityBrowser';
import Applications from './Applications';
import { Sparkles } from 'lucide-react';
import logo from '../assets/logo.jpg';

const defaultFacultyProfile = {
  fullName: '',
  email: '',
  mobileNumber: '',
  institution: '',
  department: '',
  designation: '',
  specialization: '',
  officeHours: '',
  bio: ''
};

export default function FacultyDashboard({ user, onLogout }) {
  const [imgError, setImgError] = useState(false);
  const [currentTab, setCurrentTab] = useState(() => {
    return sessionStorage.getItem('facultyDashboardTab') || 'dashboard';
  });

  useEffect(() => {
    sessionStorage.setItem('facultyDashboardTab', currentTab);
  }, [currentTab]);
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(defaultFacultyProfile);
  const [profileMsg, setProfileMsg] = useState('');
  const [error, setError] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [resetPassMsg, setResetPassMsg] = useState('');
  const [resetPassError, setResetPassError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [cvParsed, setCvParsed] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const loadRequests = () => api.getFacultyRecommendations().then(setRequests).catch(e => setError(e.message));
  const loadProfile = () => api.getFacultyProfile().then(data => setProfile({ ...defaultFacultyProfile, ...data })).catch(e => setError(e.message));

  useEffect(() => {
    loadRequests();
    loadProfile();
  }, []);

  const count = status => requests.filter(item => item.status === status).length;

  const requestAction = async (id, type) => {
    if (type === 'decline' && !window.confirm('Decline this recommendation request?')) return;
    try {
      await (type === 'accept' ? api.acceptRecommendation(id) : api.declineRecommendation(id));
      loadRequests();
    } catch (e) {
      setError(e.message);
    }
  };

  const uploadLetter = async (id, file) => {
    if (!file) return;
    setError('');
    if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) {
      setError('Choose a valid PDF no larger than 10 MB.');
      return;
    }
    try {
      await api.uploadRecommendationLetter(id, file);
      loadRequests();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleFacultyProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileMsg('');
    setError('');
    try {
      await api.updateFacultyProfile(profile);
      setProfileMsg('Faculty profile updated successfully.');
      loadProfile();
    } catch (e) {
      setError(e.message || 'Failed to update faculty profile');
    }
  };

  const handleCvUpload = async (file) => {
    if (!file) return;
    setUploadMsg('');
    setError('');
    setCvParsed(false);
    if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) {
      setError('Only PDF files up to 10 MB are supported.');
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    setUploading(true);
    setProgress(0);
    setActiveStep(1);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    try {
      setTimeout(() => setActiveStep(2), 800);
      const data = await api.uploadFacultyCV(file);
      clearInterval(interval);
      setProgress(100);
      setActiveStep(3);
      setUploadMsg(`${file.name} uploaded and parsed successfully.`);
      if (data.parsedData) {
        setProfile((prev) => ({ ...prev, ...data.parsedData }));
      }
      setTimeout(() => {
        setActiveStep(4);
        setUploading(false);
        setCvParsed(true);
      }, 1000);
    } catch (e) {
      clearInterval(interval);
      setUploading(false);
      setError(e.message || 'CV upload failed');
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setResetPassMsg('');
    setResetPassError('');
    try {
      await api.resetPassword(passwordForm.oldPassword, passwordForm.newPassword);
      setResetPassMsg('Password reset successful.');
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (e) {
      setResetPassError(e.message || 'Failed to reset password');
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await api.uploadProfilePicture(file);
      const updatedUser = { ...user, profilePicture: data.imageUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to upload profile picture');
    }
  };

  const nav = [
    ['dashboard', LayoutDashboard, 'Dashboard'],
    ['upload', FileUp, 'CV Upload'],
    ['profile', UserIcon, 'Profile Info'],
    
    ['browse', GraduationCap, 'Browse Universities'],
    ['shortlisted', Heart, 'Shortlisted Universities'],
    
    ['requests', FileText, 'Recommendation Requests'],
    ['settings', Settings, 'Profile Settings']
  ];

  return (
    <div className="h-full flex bg-brandGrayBg text-brandNavy font-sans overflow-hidden">
      <aside className="w-64 bg-brandNavy text-white flex flex-col justify-between p-6 shrink-0 shadow-xl overflow-y-auto custom-scrollbar">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="UniScout Logo" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
            <span className="text-xl font-bold tracking-wider">UniScout</span>
          </div>
          <nav className="space-y-1.5">
            {nav.map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setCurrentTab(key)}
                className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl text-sm text-left transition-all ${
                  currentTab === key ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="leading-tight">{label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="space-y-6 mt-6">
          <div className="bg-brandNavyLight/50 border border-brandNavyLight p-4 rounded-2xl">
            <h5 className="font-bold text-xs">Faculty Portal</h5>
            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Manage your faculty profile and recommendation requests.</p>
          </div>
          <div className="flex items-center justify-between border-t border-brandNavyLight pt-4">
            <div className="flex items-center space-x-3 min-w-0">
              {user.profilePicture && !imgError ? (
                <img src={`http://localhost:5001${user.profilePicture}`} alt="Profile" className="w-10 h-10 rounded-full object-cover shrink-0 shadow-md border border-brandBlue" onError={() => setImgError(true)} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brandBlue text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-white">{user.fullName}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">Faculty</p>
              </div>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-brandNavy text-base">Welcome, {user.fullName.split(' ')[0]}</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Review student requests and maintain your academic profile.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Bell size={18} className="text-gray-500" />
            {user.profilePicture && !imgError ? (
              <img src={`http://localhost:5001${user.profilePicture}`} alt="Profile" className="w-9 h-9 rounded-full object-cover shadow-sm border border-brandBlue/30" onError={() => setImgError(true)} />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brandGrayBg text-brandNavy font-bold border border-gray-200 text-sm flex items-center justify-center">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-8">
          {error && <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold">{error}</div>}

          {currentTab === 'browse' && <UniversityBrowser />}
          {currentTab === 'suggested' && <UniversityBrowser mode="suggested" />}
          {currentTab === 'applications' && <Applications role="Faculty" />}
          {currentTab === 'shortlisted' && <UniversityBrowser mode="saved" />}

          {currentTab === 'dashboard' && (
            <div className="grid gap-6 xl:grid-cols-3">
              <section className="xl:col-span-2 bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm">
                <h2 className="text-xl font-extrabold text-brandNavy">Faculty Information</h2>
                <div className="grid md:grid-cols-2 gap-4 mt-6 text-sm">
                  <InfoLine label="Full Name" value={profile.fullName || user.fullName} />
                  <InfoLine label="Email Address" value={profile.email || user.email} />
                  <InfoLine label="Institution" value={profile.institution || 'Not specified'} />
                  <InfoLine label="Department" value={profile.department || 'Not specified'} />
                  <InfoLine label="Designation" value={profile.designation || 'Not specified'} />
                  <InfoLine label="Specialization" value={profile.specialization || 'Not specified'} />
                </div>
              </section>
              <section className="bg-white rounded-3xl border border-blue-100 p-6 shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Request Summary</h3>
                <div className="mt-5 space-y-4">
                  {[['Pending', count('pending'), Clock], ['Accepted', count('accepted'), CheckCircle], ['Declined', count('declined'), XCircle]].map(([label, value, Icon]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl bg-blue-50/40 p-4">
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-brandBlue" />
                        <span className="text-sm font-bold">{label}</span>
                      </div>
                      <span className="text-xl font-extrabold">{value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {currentTab === 'upload' && (
            <>
              {!uploading && !cvParsed ? (
                <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-brandNavy">Upload Faculty CV</h2>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Upload your CV to automatically extract your academic background, research profile, and institutional details.
                    </p>
                  </div>

                  {uploadMsg && <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl text-xs font-bold">{uploadMsg}</div>}

                  <div
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleCvUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 border-gray-200 hover:border-brandBlue/60 hover:bg-gray-50/20`}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => handleCvUpload(e.target.files?.[0])} />
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-brandBlue flex items-center justify-center shadow-inner">
                      <Upload size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brandNavy">Drag and drop your CV file here</p>
                      <p className="text-xs text-gray-400 mt-1">or click to browse local storage</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] text-gray-400 font-semibold bg-gray-100/80 px-3 py-1 rounded-full inline-block">
                        Supported format: PDF Only • Max size: 10MB
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-brandNavy mb-4">What happens next?</h4>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="space-y-2">
                        <div className="w-7 h-7 bg-blue-50 text-brandBlue text-xs font-bold rounded-full flex items-center justify-center mx-auto shadow-inner">1</div>
                        <p className="text-[10px] font-bold">Upload CV</p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-7 h-7 bg-gray-50 text-gray-400 text-xs font-bold rounded-full flex items-center justify-center mx-auto">2</div>
                        <p className="text-[10px] text-gray-400 font-bold">Parse Document</p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-7 h-7 bg-gray-50 text-gray-400 text-xs font-bold rounded-full flex items-center justify-center mx-auto">3</div>
                        <p className="text-[10px] text-gray-400 font-bold">Extract Profile</p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-7 h-7 bg-gray-50 text-gray-400 text-xs font-bold rounded-full flex items-center justify-center mx-auto">4</div>
                        <p className="text-[10px] text-gray-400 font-bold">Update Summary</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : uploading ? (
                <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-brandNavy">Processing Faculty CV...</h2>
                    <p className="text-xs text-gray-500 mt-1">Our server is scanning the document using pdf-parse algorithm.</p>
                  </div>

                  <div className="border border-brandBlue/20 bg-blue-50/10 rounded-2xl p-6 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 text-brandBlue rounded-xl flex items-center justify-center shadow-inner shrink-0">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-xs font-bold text-brandNavy mb-2">
                        <span className="truncate">{fileName}</span>
                        <span className="shrink-0 ml-2">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brandBlue rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {progress < 100 ? `Uploading file (${fileSize})...` : 'Parsing academic metrics...'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : cvParsed ? (
                <div className="space-y-8">
                  {/* Header parsed summary */}
                  <div className="bg-gradient-to-r from-brandNavy to-brandNavyLight rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-brandNavyLight">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brandBlue opacity-20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex items-center space-x-4 z-10 relative">
                      <div className="w-14 h-14 bg-white/10 text-white border border-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow">
                        <FileText size={28} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-lg truncate">{fileName || 'Uploaded CV'}</h4>
                        <p className="text-[10px] text-gray-300 mt-1">Uploaded and auto-extracted academic metrics.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-extrabold text-brandNavy">Extracted Faculty Metrics</h3>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                        CV Parsing Complete
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {/* Institution */}
                      <div className="p-4 bg-brandWhite rounded-2xl border border-blue-100 flex flex-col justify-between shadow-sm">
                        <span className="text-[10px] text-brandSlate font-bold uppercase tracking-wider">Institution</span>
                        <p className="text-base font-extrabold mt-3 truncate text-brandNavy">{profile.institution || 'Not detected'}</p>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2 self-start border border-emerald-100">
                          Extracted Value
                        </span>
                      </div>

                      {/* Department */}
                      <div className="p-4 bg-brandWhite rounded-2xl border border-blue-100 flex flex-col justify-between shadow-sm">
                        <span className="text-[10px] text-brandSlate font-bold uppercase tracking-wider">Department</span>
                        <p className="text-base font-extrabold mt-3 truncate text-brandNavy">{profile.department || 'Not detected'}</p>
                        <span className="text-[9px] font-bold text-brandBlue bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-2 self-start border border-blue-100">
                          Extracted Value
                        </span>
                      </div>

                      {/* Designation */}
                      <div className="p-4 bg-brandWhite rounded-2xl border border-blue-100 flex flex-col justify-between shadow-sm">
                        <span className="text-[10px] text-brandSlate font-bold uppercase tracking-wider">Designation</span>
                        <p className="text-base font-extrabold mt-3 truncate text-brandNavy">{profile.designation || 'Not detected'}</p>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-2 self-start border border-indigo-100">
                          Extracted Value
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setCvParsed(false); setCurrentTab('profile'); }}
                      className="mt-6 w-full py-3 bg-brandBlue text-white rounded-xl font-bold hover:bg-brandBlueDark transition-colors"
                    >
                      Review Faculty Profile
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {currentTab === 'profile' && (
            <section className="max-w-4xl bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm">
              <h2 className="text-xl font-extrabold">Profile Info</h2>
              {profileMsg && <div className="mt-4 bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm font-bold">{profileMsg}</div>}
              <form onSubmit={handleFacultyProfileSubmit} className="grid md:grid-cols-2 gap-5 mt-6">
                {[
                  ['fullName', 'Full Name'],
                  ['mobileNumber', 'Mobile Number'],
                  ['institution', 'Institution'],
                  ['department', 'Department'],
                  ['designation', 'Designation'],
                  ['specialization', 'Specialization / Research Area'],
                  ['officeHours', 'Office Hours']
                ].map(([field, label]) => (
                  <label key={field} className="text-xs font-bold">
                    {label}
                    <input value={profile[field] || ''} onChange={e => setProfile({ ...profile, [field]: e.target.value })} className={`mt-1 w-full rounded-xl border ${profile[field] ? 'border-blue-100 bg-white' : 'border-red-500 bg-red-50'} p-3 text-sm font-normal`} />
                  </label>
                ))}
                <label className="md:col-span-2 text-xs font-bold">
                  Faculty Bio
                  <textarea rows="4" value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} className={`mt-1 w-full rounded-xl border ${profile.bio ? 'border-blue-100 bg-white' : 'border-red-500 bg-red-50'} p-3 text-sm font-normal`} />
                </label>
                <div className="md:col-span-2 flex justify-end">
                  <button className="rounded-xl bg-brandBlue px-6 py-3 text-sm font-bold text-white">Save Faculty Profile</button>
                </div>
              </form>
            </section>
          )}

          {currentTab === 'requests' && (
            <section className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold">Recommendation Requests</h1>
                <p className="text-gray-500">Accept a request, then submit the recommendation as a PDF.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[['pending', Clock], ['accepted', CheckCircle], ['declined', XCircle]].map(([status, Icon]) => (
                  <div className="bg-white rounded-2xl p-5 border" key={status}>
                    <Icon className="text-brandBlue" />
                    <p className="text-3xl font-bold mt-3">{count(status)}</p>
                    <p className="capitalize text-gray-500">{status}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {requests.map(item => (
                  <article className="bg-white border rounded-3xl p-6" key={item.id}>
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{item.studentName}</h3>
                        <p className="text-xs text-gray-500">{item.studentEmail}</p>
                      </div>
                      <span className="capitalize font-bold">{item.status}</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mt-5 text-sm">
                      <p><b>Purpose:</b> {item.purpose}</p>
                      <p><b>Deadline:</b> {item.deadline?.slice(0, 10)}</p>
                      <p><b>Relationship:</b> {item.relationshipToStudent}</p>
                      <p><b>Courses:</b> {item.coursesTaught || '-'}</p>
                      <p className="md:col-span-2"><b>Message:</b> {item.studentMessage || '-'}</p>
                    </div>
                    {item.status === 'pending' && (
                      <div className="flex gap-3 mt-5">
                        <button onClick={() => requestAction(item.id, 'accept')} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold">Accept</button>
                        <button onClick={() => requestAction(item.id, 'decline')} className="bg-red-50 text-red-600 px-5 py-2 rounded-xl font-bold">Decline</button>
                      </div>
                    )}
                    {item.status === 'accepted' && (
                      <div className="mt-5 p-4 bg-brandPaleBlue rounded-2xl">
                        <p className="font-bold text-sm">{item.submittedAt ? 'Letter submitted' : 'Upload recommendation letter'}</p>
                        <p className="text-xs text-gray-500 mb-3">PDF only, maximum 10 MB. A new upload replaces the previous letter.</p>
                        <div className="flex gap-3 items-center">
                          <label className="cursor-pointer bg-brandBlue text-white px-4 py-2 rounded-xl text-sm font-bold">
                            <input className="hidden" type="file" accept="application/pdf,.pdf" onChange={e => uploadLetter(item.id, e.target.files?.[0])} />
                            {item.submittedAt ? 'Replace PDF' : 'Choose PDF'}
                          </label>
                          {item.submittedAt && <button onClick={() => api.downloadRecommendationLetter(item.id, item.letterFileName)} className="text-brandBlue font-bold text-sm">Download {item.letterFileName}</button>}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
                {!requests.length && <p className="text-center bg-white rounded-3xl p-16 text-gray-400">No requests have been sent to this email.</p>}
              </div>
            </section>
          )}

          {currentTab === 'settings' && (
            <section className="max-w-xl bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-brandNavy">Profile Settings</h2>
                <p className="text-xs text-brandSlate mt-1">Manage your account security and profile picture.</p>
              </div>

              <div className="bg-white rounded-2xl border border-blue-100 p-6">
                <h3 className="font-bold text-sm text-brandNavy mb-4">Profile Picture</h3>
                <div className="flex items-center space-x-4">
                  {user.profilePicture && !imgError ? (
                    <img src={`http://localhost:5001${user.profilePicture}`} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-gray-200" onError={() => setImgError(true)} />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-brandBlue text-white flex items-center justify-center text-xl font-bold">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-brandPaleBlue hover:bg-blue-100 text-brandNavy text-xs font-bold rounded-xl border border-blue-200 transition-all">
                    Upload Picture
                    <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-blue-100 p-6">
                <h3 className="font-bold text-sm text-brandNavy mb-4">Reset Password</h3>
                {resetPassMsg && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold">{resetPassMsg}</div>}
                {resetPassError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{resetPassError}</div>}
                <form onSubmit={handlePasswordReset} className="space-y-4 mt-5">
                  <label className="text-xs font-bold block">Current Password<input type="password" required value={passwordForm.oldPassword} onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3 text-sm font-normal" /></label>
                  <label className="text-xs font-bold block">New Password<input type="password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="mt-1 w-full rounded-xl border bg-white p-3 text-sm font-normal" /></label>
                  <button className="w-full rounded-xl bg-brandBlue py-3 text-sm font-bold text-white">Update Password</button>
                </form>
              </div>
            </section>
          )}

          <div className="mt-8 bg-blue-50/30 border border-blue-100 p-5 rounded-3xl flex items-start space-x-3 max-w-xl">
            <Shield size={18} className="text-brandBlue shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-brandNavy">Secure & Confidential</p>
              <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">Faculty records and recommendation documents are protected inside UniScout.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-gray-400 font-bold text-xs uppercase">{label}</p>
      <p className="text-brandNavy font-extrabold mt-0.5">{value}</p>
    </div>
  );
}
