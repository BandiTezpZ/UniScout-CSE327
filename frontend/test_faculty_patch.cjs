const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/FacultyDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import Applications")) {
  content = content.replace("import UniversityBrowser from './UniversityBrowser';", "import UniversityBrowser from './UniversityBrowser';\nimport Applications from './Applications';\nimport { Sparkles, FileText } from 'lucide-react';");
}

// Fix min-h-screen to h-full
content = content.replace('<div className="min-h-screen flex bg-brandGrayBg text-brandNavy font-sans">', '<div className="h-full flex bg-brandGrayBg text-brandNavy font-sans overflow-hidden">');

// Fix aside overflow
content = content.replace('<aside className="w-64 bg-brandNavy text-white flex flex-col justify-between p-6 shrink-0 shadow-xl">', '<aside className="w-64 bg-brandNavy text-white flex flex-col justify-between p-6 shrink-0 shadow-xl overflow-y-auto custom-scrollbar">');

// Update nav array
//     ['dashboard', LayoutDashboard, 'Dashboard'],
//     ['upload', FileUp, 'CV Upload'],
//     ['profile', UserIcon, 'Profile Info'],
//     ['browse', GraduationCap, 'Browse Universities'],
//     ['shortlisted', BookOpen, 'Shortlisted Universities'],
//     ['requests', Award, 'Recommendation Requests'],
//     ['settings', Settings, 'Profile Settings']
// We need to add 'suggested' and 'applications'
const oldNav = `  const nav = [
    ['dashboard', LayoutDashboard, 'Dashboard'],
    ['upload', FileUp, 'CV Upload'],
    ['profile', UserIcon, 'Profile Info'],
    ['browse', GraduationCap, 'Browse Universities'],
    ['shortlisted', BookOpen, 'Shortlisted Universities'],
    ['requests', Award, 'Recommendation Requests'],
    ['settings', Settings, 'Profile Settings']
  ];`;
const newNav = `  const nav = [
    ['dashboard', LayoutDashboard, 'Dashboard'],
    ['upload', FileUp, 'CV Upload'],
    ['profile', UserIcon, 'Profile Info'],
    ['suggested', Sparkles, 'Suggested Universities'],
    ['browse', GraduationCap, 'Browse Universities'],
    ['shortlisted', Heart, 'Shortlisted Universities'],
    ['applications', BookOpen, 'Applications'],
    ['requests', FileText, 'Recommendation Requests'],
    ['settings', Settings, 'Profile Settings']
  ];`;
// Also need to import Heart if it's missing
content = content.replace("import {", "import { Heart,");
content = content.replace(oldNav, newNav);

// Add to main render
const targetRender = `{currentTab === 'browse' && <UniversityBrowser />}`;
const newRender = `{currentTab === 'browse' && <UniversityBrowser />}\n          {currentTab === 'suggested' && <UniversityBrowser mode="suggested" />}\n          {currentTab === 'applications' && <Applications role="Faculty" />}`;
content = content.replace(targetRender, newRender);

fs.writeFileSync(file, content);
console.log('Patched FacultyDashboard.jsx');
