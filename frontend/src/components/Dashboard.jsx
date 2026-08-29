import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, CheckCircle2, Circle, AlertCircle, LogOut,
  LayoutDashboard, User as UserIcon, GraduationCap, Award, BookOpen,
  Settings, Briefcase, Sparkles, Shield, ChevronRight, FileUp, Bell
} from 'lucide-react';
import { api } from '../services/api';
import Recommendations from './Recommendations';
import UniversityBrowser from './UniversityBrowser';
import Applications from './Applications';
import logo from '../assets/logo.jpg';

const publicationsToText = publications => {
  if (!publications) return '';
  const items = Array.isArray(publications) ? publications : String(publications).split('\n');
  return items.map(item => {
    if (typeof item === 'string') return item;
    return [item.title, item.venue, item.year, item.authorship, item.topic].filter(Boolean).join(' | ');
  }).filter(Boolean).join('\n');
};

const textToPublications = value => String(value || '').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
  const [title, venue, year, authorship, topic] = line.split('|').map(part => part.trim());
  return { title: title || line, venue: venue || '', year: year || '', authorship: authorship || '', topic: topic || '' };
});

export default function Dashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0); // 0: Idle, 1: Uploading, 2: Parsing, 3: Extracting, 4: Done
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [imgError, setImgError] = useState(false);
  const [currentTab, setCurrentTab] = useState(() => {
    return sessionStorage.getItem('studentDashboardTab') || 'dashboard';
  }); // 'dashboard', 'upload', 'profile'
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetPassMsg, setResetPassMsg] = useState('');
  const [resetPassError, setResetPassError] = useState('');
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    degreeLevel: '',
    intendedMajor: '',
    cgpa: '',
    ieltsToefl: '',
    gresatgmat: '',
    budget: '',
    researchPapers: '0',
    projects: '0',
    internships: '0',
    extracurriculars: '',
    fundingNeed: '',
    skills: '',
    institution: '',
    graduationYear: '',
    researchInterests: '',
    publicationsText: '',
    desiredDegree: '',
    preferredCountries: '',
    fundingPreference: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('studentDashboardTab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    if (profile) {
      setFormData({
        degreeLevel: profile.degreeLevel || '',
        intendedMajor: profile.intendedMajor || '',
        cgpa: profile.cgpa !== null && profile.cgpa !== undefined ? String(profile.cgpa) : '',
        ieltsToefl: profile.ieltsToefl !== null && profile.ieltsToefl !== undefined ? String(profile.ieltsToefl) : '',
        gresatgmat: profile.gresatgmat !== null && profile.gresatgmat !== undefined ? String(profile.gresatgmat) : '',
        budget: profile.budget !== null && profile.budget !== undefined ? String(profile.budget) : '',
        researchPapers: String(profile.researchPapers || 0),
        projects: String(profile.projects || 0),
        internships: String(profile.internships || 0),
        extracurriculars: profile.extracurriculars || '',
        fundingNeed: profile.fundingNeed || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || ''),
        institution: profile.institution || '',
        graduationYear: profile.graduationYear || '',
        researchInterests: Array.isArray(profile.researchInterests) ? profile.researchInterests.join(', ') : (profile.researchInterests || ''),
        publicationsText: publicationsToText(profile.publications),
        desiredDegree: profile.desiredDegree || '',
        preferredCountries: Array.isArray(profile.preferredCountries) ? profile.preferredCountries.join(', ') : (profile.preferredCountries || ''),
        fundingPreference: profile.fundingPreference || profile.fundingNeed || ''
      });
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      const hasProfileData = data && (
        data.cgpa != null ||
        data.degreeLevel != null ||
        data.intendedMajor != null ||
        Boolean(data.latestCvName)
      );

      if (hasProfileData) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.log('No profile exists yet or failed to fetch.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaveSuccessMsg('');
    
    const submissionData = {
      ...formData,
      cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
      ieltsToefl: formData.ieltsToefl ? parseFloat(formData.ieltsToefl) : null,
      gresatgmat: formData.gresatgmat ? parseFloat(formData.gresatgmat) : null,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      researchPapers: parseInt(formData.researchPapers) || 0,
      projects: parseInt(formData.projects) || 0,
      internships: parseInt(formData.internships) || 0,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      researchInterests: formData.researchInterests.split(',').map(s => s.trim()).filter(Boolean),
      publications: textToPublications(formData.publicationsText),
      preferredCountries: formData.preferredCountries.split(',').map(s => s.trim()).filter(Boolean),
      fundingNeed: formData.fundingPreference || formData.fundingNeed,
      latestCvName: profile?.latestCvName || null
    };

    try {
      await api.updateProfile(submissionData);
      setSaveSuccessMsg('Profile updated successfully!');
      fetchProfile();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
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
      // Force reload to reflect changes
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to upload profile picture');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndUpload = (file) => {
    setErrorMsg('');
    if (!file) return;

    // Validate MIME-type strictly
    if (file.type !== 'application/pdf') {
      setErrorMsg('Strict validation: Only standard PDF files (.pdf) are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('The PDF is larger than the 10MB upload limit.');
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    startUploadFlow(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const startUploadFlow = async (file) => {
    setUploading(true);
    setProgress(0);
    setActiveStep(1); // Uploading

    // Simulated progress bar animation
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
      // Step 2: Parsing (takes 1.5s simulated delay)
      setTimeout(() => setActiveStep(2), 800);
      // Step 3: Extracting (takes 1.5s simulated delay)
      setTimeout(() => setActiveStep(3), 1600);

      const response = await api.uploadCV(file);
      
      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setProfile({
          ...response.parsedData,
          latestCvName: response.fileName
        });
        setUploading(false);
        setActiveStep(4);
      }, 2400);

    } catch (err) {
      clearInterval(interval);
      setUploading(false);
      setActiveStep(0);
      setErrorMsg(err.message || 'Failed to parse CV PDF');
    }
  };

  const handleReset = () => {
    setFileName('');
    setFileSize('');
    setProgress(0);
    setActiveStep(0);
    setErrorMsg('');
    setCurrentTab('upload');
  };

  return (
    <div className="h-full flex bg-brandGrayBg text-brandNavy font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brandNavy text-white flex flex-col justify-between p-6 shrink-0 shadow-xl overflow-y-auto custom-scrollbar">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="UniScout Logo" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
            <span className="text-xl font-bold tracking-wider">UniScout</span>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => { setCurrentTab('dashboard'); setSaveSuccessMsg(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl text-sm text-left transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
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
              className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl text-sm text-left transition-all ${
                currentTab === 'upload'
                  ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileUp size={18} />
              <span className="leading-tight">Upload CV</span>
            </button>
            <button
              onClick={() => { setCurrentTab('profile'); setSaveSuccessMsg(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl text-sm text-left transition-all ${
                currentTab === 'profile'
                  ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserIcon size={18} />
              <span className="leading-tight">Profile Info</span>
            </button>
            <button onClick={() => setCurrentTab('recommendations')} className={`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all ${currentTab === 'recommendations' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <FileText size={18} />
              <span className="leading-tight">Recommendations</span>
            </button>
            <button onClick={() => setCurrentTab('suggested')} className={`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all ${currentTab === 'suggested' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Sparkles size={18} />
              <span className="leading-tight">Suggested Universities</span>
            </button>
            <button onClick={() => setCurrentTab('browse')} className={`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all ${currentTab === 'browse' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <GraduationCap size={18} />
              <span className="leading-tight">Browse Universities</span>
            </button>
            <button onClick={() => setCurrentTab('shortlisted')} className={`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all ${currentTab === 'shortlisted' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Award size={18} />
              <span className="leading-tight">Shortlisted</span>
            </button>
            <button onClick={() => setCurrentTab('applications')} className={`w-full flex items-center space-x-3 px-4 py-3 font-medium rounded-xl text-sm text-left transition-all ${currentTab === 'applications' ? 'bg-brandBlue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <BookOpen size={18} />
              <span className="leading-tight">Applications</span>
            </button>
            <button
              onClick={() => { setCurrentTab('settings'); setResetPassMsg(''); setResetPassError(''); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 font-semibold rounded-xl text-sm text-left transition-all ${
                currentTab === 'settings'
                  ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
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
              {user.profilePicture && !imgError ? (
                <img src={`http://localhost:5001${user.profilePicture}`} alt="Profile" className="w-10 h-10 rounded-full object-cover shrink-0 shadow-md border border-brandBlue" onError={() => setImgError(true)} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brandBlue text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-white">{user.fullName}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{user.role}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-brandNavy text-base">Welcome, {user.fullName.split(' ')[0]}</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Let's find the perfect universities for your future.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button type="button" disabled title="Notifications coming soon" className="p-2 rounded-full text-gray-400 cursor-not-allowed">
              <Bell size={18} />
            </button>
            {user.profilePicture && !imgError ? (
              <img src={`http://localhost:5001${user.profilePicture}`} alt="Profile" className="w-9 h-9 rounded-full object-cover shadow-sm border border-brandBlue/30" onError={() => setImgError(true)} />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brandGrayBg text-brandNavy font-bold border border-gray-200 text-sm flex items-center justify-center">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          {currentTab === 'recommendations' && <Recommendations />}
          {currentTab === 'browse' && <UniversityBrowser />}
          {currentTab === 'suggested' && <UniversityBrowser mode="suggested" />}
          {currentTab === 'applications' && <Applications role="Student" />}
          {currentTab === 'shortlisted' && <UniversityBrowser mode="saved" />}
          
          {/* Main Workspace Column */}
          {!['recommendations', 'browse', 'suggested', 'shortlisted', 'applications'].includes(currentTab) && <div className="xl:col-span-2 space-y-8">
            
            {/* Tab 1: Dashboard View */}
            {(currentTab === 'dashboard' || currentTab === 'upload') && (
              <>
                {/* General Information Card */}
                {currentTab === 'dashboard' && (
                  <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-4">
                  <h2 className="text-xl font-extrabold text-brandNavy flex items-center space-x-2">
                    <UserIcon className="text-brandBlue" size={20} />
                    <span className="leading-tight">General Student Information</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 font-bold text-xs uppercase">Full Name</p>
                      <p className="text-brandNavy font-extrabold mt-0.5">{user.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold text-xs uppercase">Email Address</p>
                      <p className="text-brandNavy font-extrabold mt-0.5">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold text-xs uppercase">Current Degree Level</p>
                      <p className="text-brandNavy font-extrabold mt-0.5">{profile?.degreeLevel || 'Not Specified'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold text-xs uppercase">Intended Major</p>
                      <p className="text-brandNavy font-extrabold mt-0.5">{profile?.intendedMajor || 'Not Specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-400 font-bold text-xs uppercase">Latest Uploaded CV</p>
                      <p className="text-brandBlue font-extrabold mt-0.5 flex items-center space-x-1.5">
                        <FileText size={16} />
                        <span className="leading-tight">{profile?.latestCvName || 'No CV PDF uploaded yet'}</span>
                      </p>
                    </div>
                  </div>
                  </div>
                )}

                {/* Upload is a dedicated sidebar page, not part of the dashboard landing page. */}
                {currentTab === 'upload' && !uploading && activeStep !== 4 ? (
                  <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-xl font-extrabold text-brandNavy">Upload Your CV</h2>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Upload your CV and let UniScout's CV parser analyze your academic background, test scores, and research publications.
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-semibold flex items-start space-x-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span className="leading-tight">{errorMsg}</span>
                      </div>
                    )}

                    {/* Dashed Drag and Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                        dragActive
                          ? 'border-brandBlue bg-blue-50/30'
                          : 'border-gray-200 hover:border-brandBlue/60 hover:bg-gray-50/20'
                      }`}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                      <div className="w-16 h-16 rounded-full bg-blue-50 text-brandBlue flex items-center justify-center shadow-inner">
                        <Upload size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brandNavy">Drag and drop your CV file here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse local storage</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] text-gray-400 font-semibold bg-gray-100/80 px-3 py-1 rounded-full inline-block">
                          Supported format: PDF Only (strictly validated) • Max size: 10MB
                        </p>
                      </div>
                    </div>

                    {/* What happens next flow */}
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
                          <p className="text-[10px] text-gray-400 font-bold">Review Fields</p>
                        </div>
                        <div className="space-y-2">
                          <div className="w-7 h-7 bg-gray-50 text-gray-400 text-xs font-bold rounded-full flex items-center justify-center mx-auto">4</div>
                          <p className="text-[10px] text-gray-400 font-bold">Save Profile</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : uploading ? (
                  /* Uploading & Parsing Animation View (Screenshot 1 upload state) */
                  <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-xl font-extrabold text-brandNavy">Processing CV...</h2>
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
                ) : profile ? (
                  /* Extracted Information View (Screenshot 2 dashboard view) */
                  <div className="space-y-8">
                    
                    {/* Header parsed summary */}
                    <div className="bg-gradient-to-r from-brandNavy to-brandNavyLight rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-brandNavyLight">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-brandBlue opacity-20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                      <div className="flex items-center space-x-4 z-10 relative">
                        <div className="w-14 h-14 bg-white/10 text-white border border-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow">
                          <FileText size={28} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-lg truncate">{profile.latestCvName || fileName || 'Uploaded CV'}</h4>
                          <p className="text-[10px] text-gray-300 mt-1">Uploaded and auto-extracted academic metrics.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-brandNavy">Extracted Academic Metrics</h3>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                          Current Profile
                        </span>
                      </div>

                      {/* Metics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* CGPA */}
                        <div className="p-4 bg-brandWhite rounded-2xl border border-blue-100 flex flex-col justify-between shadow-sm">
                          <span className="text-[10px] text-brandSlate font-bold uppercase tracking-wider">CGPA</span>
                          <p className="text-xl font-black mt-2 text-brandNavy">{profile.cgpa !== null && profile.cgpa !== undefined ? `${parseFloat(profile.cgpa).toFixed(2)} / 4.00` : 'Not detected'}</p>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2 self-start border border-emerald-100">
                            Extracted Value
                          </span>
                        </div>

                        {/* IELTS/TOEFL */}
                        <div className="p-4 bg-brandWhite rounded-2xl border border-blue-100 flex flex-col justify-between shadow-sm">
                          <span className="text-[10px] text-brandSlate font-bold uppercase tracking-wider">English Index</span>
                          <p className="text-xl font-black mt-2 text-brandNavy">{profile.ieltsToefl !== null && profile.ieltsToefl !== undefined ? profile.ieltsToefl : 'Not detected'}</p>
                          <span className="text-[9px] font-bold text-brandBlue bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-2 self-start border border-blue-100">
                            Test Score
                          </span>
                        </div>

                        {/* GRE Score */}
                        <div className="p-4 bg-brandWhite rounded-2xl border border-blue-100 flex flex-col justify-between shadow-sm">
                          <span className="text-[10px] text-brandSlate font-bold uppercase tracking-wider">Standardized Score</span>
                          <p className="text-xl font-black mt-2 text-brandNavy">{profile.gresatgmat ?? 'Not detected'}</p>
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-2 self-start border border-indigo-100">
                            GRE/SAT/GMAT
                          </span>
                        </div>

                        {/* Degree Level */}
                        <div className="p-4 bg-brandWhite rounded-2xl border border-blue-100 flex flex-col justify-between shadow-sm">
                          <span className="text-[10px] text-brandSlate font-bold uppercase tracking-wider">Degree Level</span>
                          <p className="text-base font-extrabold mt-3 truncate text-brandNavy">{profile.degreeLevel || 'Not detected'}</p>
                          <span className="text-[9px] font-bold text-brandNavy bg-blue-50/50 px-2 py-0.5 rounded-full inline-block mt-2 self-start border border-blue-100">
                            {profile.intendedMajor || 'Major not detected'}
                          </span>
                        </div>
                      </div>

                      {/* Publications, projects, internships */}
                      <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 font-bold block">Research Papers</span>
                          <p className="text-lg font-extrabold mt-1 text-brandNavy">{profile.researchPapers || 0}</p>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 font-bold block">Projects</span>
                          <p className="text-lg font-extrabold mt-1 text-brandNavy">{profile.projects || 0}</p>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 font-bold block">Internships</span>
                          <p className="text-lg font-extrabold mt-1 text-brandNavy">{profile.internships || 0}</p>
                        </div>
                      </div>

                      {/* Search preferences and budget */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 font-bold block">Desired Degree</span>
                          <p className="text-sm font-extrabold mt-1 text-brandNavy">{profile.desiredDegree || profile.degreeLevel || 'Not specified'}</p>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 font-bold block">Preferred Countries</span>
                          <p className="text-sm font-extrabold mt-1 text-brandNavy">
                            {Array.isArray(profile.preferredCountries) && profile.preferredCountries.length
                              ? profile.preferredCountries.join(', ')
                              : 'Not specified'}
                          </p>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 font-bold block">Funding Preference</span>
                          <p className="text-sm font-extrabold mt-1 text-brandNavy">{profile.fundingPreference || profile.fundingNeed || 'Not specified'}</p>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 font-bold block">Budget</span>
                          <p className="text-sm font-extrabold mt-1 text-brandNavy">{profile.budget ? `$${profile.budget}` : 'Not specified'}</p>
                        </div>
                      </div>

                      {/* Extracurriculars */}
                      {profile.extracurriculars && (
                        <div className="space-y-2 pt-4 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Extracurricular Activities</span>
                          <p className="text-sm text-brandNavy font-medium">{profile.extracurriculars}</p>
                        </div>
                      )}

                      {/* Top Skills Tags */}
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Top Skills extracted</span>
                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold text-brandNavy bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Academic Summary */}
                      <div className="space-y-2 pt-4 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Academic Summary</span>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          This information was extracted automatically from the uploaded CV. Fields that could not be detected are left empty rather than guessed. Review the Profile Info tab and correct any parsing errors before requesting recommendations.
                        </p>
                      </div>

                      {/* Reset CV */}
                      <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all text-brandNavy"
                        >
                          Upload New CV
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-10 shadow-sm text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-brandBlue flex items-center justify-center mx-auto">
                      <FileUp size={28} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-brandNavy">No CV uploaded yet</h2>
                      <p className="text-xs text-gray-500 mt-2">
                        Upload a PDF CV from the dedicated Upload CV page to build your academic profile.
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab('upload')}
                      className="px-6 py-3 bg-brandBlue hover:bg-brandBlueLight text-white font-bold rounded-xl text-sm text-left transition-all shadow-md shadow-brandBlue/25"
                    >
                      Go to Upload CV
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Tab 2: Profile Info Manual Form */}
            {currentTab === 'profile' && (
              <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-brandNavy">Student Profile Information</h2>
                  <p className="text-xs text-brandSlate mt-1">
                    Manually update your academic credentials, standardized test scores, and research publications.
                  </p>
                </div>

                {saveSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl text-xs font-semibold">
                    {saveSuccessMsg}
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-semibold flex items-start space-x-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span className="leading-tight">{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Grid of basic parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Degree Level */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Degree Level</label>
                      <select
                        className={`w-full px-4 py-3 border ${formData.degreeLevel ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy`}
                        value={formData.degreeLevel}
                        onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value })}
                      >
                        <option value="">Not provided</option>
                        <option value="Undergraduate">Undergraduate (Bachelors)</option>
                        <option value="Graduate">Graduate (Masters)</option>
                        <option value="PhD">PhD (Doctorate)</option>
                      </select>
                    </div>

                    {/* Intended Major */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Intended Major</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        className={`w-full px-4 py-3 border ${formData.intendedMajor ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy`}
                        value={formData.intendedMajor}
                        onChange={(e) => setFormData({ ...formData, intendedMajor: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Institution</label>
                      <input
                        type="text"
                        placeholder="e.g. North South University"
                        className="w-full px-4 py-3 border bg-white border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Graduation Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2026"
                        className="w-full px-4 py-3 border bg-white border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={formData.graduationYear}
                        onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                      />
                    </div>

                    {/* CGPA */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">CGPA (Out of 4.00)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4.00"
                        placeholder="e.g. 3.65"
                        className={`w-full px-4 py-3 border ${formData.cgpa ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy`}
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      />
                    </div>

                    {/* English Score */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">English Test Score (IELTS)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="120"
                        placeholder="e.g. 7.5"
                        className={`w-full px-4 py-3 border ${formData.ieltsToefl ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy`}
                        value={formData.ieltsToefl}
                        onChange={(e) => setFormData({ ...formData, ieltsToefl: e.target.value })}
                      />
                    </div>

                    {/* GRE / SAT / GMAT */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Standardized Test Score (GRE)</label>
                      <input
                        type="number"
                        min="0"
                        max="1600"
                        placeholder="e.g. 322"
                        className={`w-full px-4 py-3 border ${formData.gresatgmat ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy`}
                        value={formData.gresatgmat}
                        onChange={(e) => setFormData({ ...formData, gresatgmat: e.target.value })}
                      />
                    </div>

                    {/* Preferred Budget */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Annual Budget ($ USD)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 25000"
                        className={`w-full px-4 py-3 border ${formData.budget ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy`}
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Research Papers, Projects, Internships */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-blue-100/50">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Research Papers</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={formData.researchPapers}
                        onChange={(e) => setFormData({ ...formData, researchPapers: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Projects</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={formData.projects}
                        onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Internships</label>
                      <input
                        type="number"
                        min="0"
                        className={`w-full px-4 py-3 border ${formData.internships ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy`}
                        value={formData.internships}
                        onChange={(e) => setFormData({ ...formData, internships: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Extracurriculars & Skills */}
                  <div className="space-y-4 pt-4 border-t border-blue-100/50">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Skills (Comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Python, React, SQL, Git"
                        className={`w-full px-4 py-3 border ${formData.skills ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy`}
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Research Interests / Topics</label>
                      <input
                        type="text"
                        placeholder="e.g. Machine Learning, Bioinformatics, Computer Vision"
                        className="w-full px-4 py-3 border bg-white border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={formData.researchInterests}
                        onChange={(e) => setFormData({ ...formData, researchInterests: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Publications</label>
                      <textarea
                        rows="4"
                        placeholder="One per line: Title | Exact venue | Year | Authorship | Topic"
                        className="w-full px-4 py-3 border bg-white border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={formData.publicationsText}
                        onChange={(e) => setFormData({ ...formData, publicationsText: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Extracurricular Activities</label>
                      <textarea
                        rows="3"
                        placeholder="e.g. Debate Club, Robotics team leader, volunteer work"
                        className={`w-full px-4 py-3 border ${formData.extracurriculars ? 'bg-white border-blue-100' : 'bg-red-50 border-red-500'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy`}
                        value={formData.extracurriculars}
                        onChange={(e) => setFormData({ ...formData, extracurriculars: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Search Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-blue-100/50">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Desired Degree</label>
                      <select
                        className="w-full px-4 py-3 border bg-white border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={formData.desiredDegree}
                        onChange={(e) => setFormData({ ...formData, desiredDegree: e.target.value })}
                      >
                        <option value="">Not provided</option>
                        <option value="MS">MS</option>
                        <option value="MSc">MSc</option>
                        <option value="PhD">PhD</option>
                        <option value="MS/PhD">MS/PhD</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Preferred Countries</label>
                      <input
                        type="text"
                        placeholder="e.g. United States, Canada"
                        className="w-full px-4 py-3 border bg-white border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={formData.preferredCountries}
                        onChange={(e) => setFormData({ ...formData, preferredCountries: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Funding Preference</label>
                      <select
                        className="w-full px-4 py-3 border bg-white border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={formData.fundingPreference}
                        onChange={(e) => setFormData({ ...formData, fundingPreference: e.target.value })}
                      >
                        <option value="">Not provided</option>
                        <option value="Required">Required</option>
                        <option value="Preferred">Preferred</option>
                        <option value="Not required">Not required</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-6 border-t border-blue-100/50 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('dashboard')}
                      className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-bold transition-all text-brandNavy"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-brandBlue hover:bg-brandBlueLight text-white font-bold rounded-xl text-sm text-left transition-all shadow-md shadow-brandBlue/25"
                    >
                      Save Profile Info
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 3: Settings */}
            {currentTab === 'settings' && (
              <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-brandNavy">Account Settings</h2>
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
                  {resetPassMsg && (
                    <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-semibold">
                      {resetPassMsg}
                    </div>
                  )}
                  {resetPassError && (
                    <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                      {resetPassError}
                    </div>
                  )}
                  <form onSubmit={handlePasswordReset} className="space-y-4 max-w-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">Current Password</label>
                      <input
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={passwordForm.oldPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brandNavy block">New Password</label>
                      <input
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-brandNavy"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-2.5 bg-brandBlue hover:bg-brandBlueLight text-white font-bold rounded-xl text-sm text-left transition-all"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>}

          {/* Right Status / Timeline Column */}
          {!['recommendations', 'browse', 'suggested', 'shortlisted', 'applications'].includes(currentTab) && <div className="space-y-6">
            {currentTab === 'upload' && (
              <div className="bg-brandPaleBlue rounded-3xl border border-blue-100 p-6 shadow-sm space-y-6">
              <h4 className="text-xs font-extrabold text-brandNavy uppercase tracking-wider">CV Parsing Progress</h4>
              
              <div className="space-y-5">
                {/* Step 1: Upload */}
                <div className="flex items-start space-x-3 text-xs">
                  {activeStep >= 1 ? (
                    <CheckCircle2 size={18} className="text-brandBlue shrink-0" />
                  ) : (
                    <Circle size={18} className="text-gray-300 shrink-0" />
                  )}
                  <div className="space-y-0.5">
                    <p className={`font-bold ${activeStep >= 1 ? 'text-brandNavy' : 'text-gray-400'}`}>CV Uploaded</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{fileName ? `${fileName} loaded successfully.` : 'Waiting for a PDF document.'}</p>
                  </div>
                </div>

                {/* Step 2: Parsing */}
                <div className="flex items-start space-x-3 text-xs">
                  {activeStep >= 2 ? (
                    <CheckCircle2 size={18} className="text-brandBlue shrink-0" />
                  ) : (
                    <Circle size={18} className="text-gray-300 shrink-0" />
                  )}
                  <div className="space-y-0.5">
                    <p className={`font-bold ${activeStep >= 2 ? 'text-brandNavy' : 'text-gray-400'}`}>Parsing Document</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">Scanning layout format using pdf-parse.</p>
                  </div>
                </div>

                {/* Step 3: Extracting */}
                <div className="flex items-start space-x-3 text-xs">
                  {activeStep >= 3 ? (
                    <CheckCircle2 size={18} className="text-brandBlue shrink-0" />
                  ) : (
                    <Circle size={18} className="text-gray-300 shrink-0" />
                  )}
                  <div className="space-y-0.5">
                    <p className={`font-bold ${activeStep >= 3 ? 'text-brandNavy' : 'text-gray-400'}`}>Extracting Information</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">Mapping CGPA, English index, and tests.</p>
                  </div>
                </div>

                {/* Step 4: Done */}
                <div className="flex items-start space-x-3 text-xs">
                  {activeStep >= 4 ? (
                    <CheckCircle2 size={18} className="text-brandBlue shrink-0" />
                  ) : (
                    <Circle size={18} className="text-gray-300 shrink-0" />
                  )}
                  <div className="space-y-0.5">
                    <p className={`font-bold ${activeStep >= 4 ? 'text-brandNavy' : 'text-gray-400'}`}>Ready for Review</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">Review and correct the extracted fields.</p>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Confidentiality Footer */}
            <div className="bg-blue-50/30 border border-blue-100 p-5 rounded-3xl flex items-start space-x-3">
              <Shield size={18} className="text-brandBlue shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-brandNavy">Secure & Confidential</p>
                <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">
                  Your academic records and uploaded data are fully protected and never shared.
                </p>
              </div>
            </div>
          </div>}
          
        </div>
      </main>
    </div>
  );
}
