import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import VerifyEmail from './components/VerifyEmail';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import Chatbot from './components/Chatbot';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, signup, verify
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    // Check if we are in verification flow
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      setView('verify');
    } else {
      // Check session
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUser && token) {
        setUser(JSON.parse(savedUser));
      }
    }
    setIsCheckingSession(false);
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('login');
    window.history.pushState({}, document.title, '/'); // Clear query params if any
  };

  const handleVerifyBack = () => {
    window.history.pushState({}, document.title, '/'); // Clear query params
    setView('login');
  };

  const Footer = () => (
    <footer className="w-full bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500 mt-auto">
      &copy; 2026 UniScout. All rights reserved.
    </footer>
  );

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex flex-col bg-brandGrayBg font-sans">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-gray-400 font-bold text-sm">Checking UniScout session...</div>
        </div>
        <Footer />
      </div>
    );
  }

  // 1. Verification Flow Route
  if (view === 'verify') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex flex-col">
          <VerifyEmail onNavigateToLogin={handleVerifyBack} onVerificationSuccess={handleLoginSuccess} />
        </div>
        <Footer />
      </div>
    );
  }

  // 2. Logged In Routes
  if (user) {
    let ComponentToRender = Dashboard;
    if (user.role === 'Admin') {
      ComponentToRender = AdminDashboard;
    } else if (user.role === 'Faculty') {
      ComponentToRender = FacultyDashboard;
    }
    return (
      <div className="h-screen flex flex-col overflow-hidden relative">
        <div className="flex-grow flex flex-col min-h-0">
          <ComponentToRender user={user} onLogout={handleLogout} />
        </div>
        <Chatbot user={user} />
      </div>
    );
  }

  // 3. Logged Out Auth Routes
  if (view === 'signup') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex flex-col">
          <Signup onNavigateToLogin={() => setView('login')} onNavigateToVerify={() => setView('verify')} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col">
        <Login
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignup={() => setView('signup')}
          onNavigateToVerify={() => setView('verify')}
        />
      </div>
      <Footer />
    </div>
  );
}
