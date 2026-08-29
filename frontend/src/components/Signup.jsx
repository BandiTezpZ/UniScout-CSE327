import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowLeft, Info, Shield } from 'lucide-react';
import { api } from '../services/api';
import logo from '../assets/logo.jpg';

export default function Signup({ onNavigateToLogin, onNavigateToVerify }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [facultyProfile, setFacultyProfile] = useState({ institution: '', department: '', designation: '' });
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (!/^\d{11}$/.test(mobileNumber)) {
      setError('Mobile number must be exactly 11 digits.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const data = await api.register(fullName, email, password, role, mobileNumber, facultyProfile);
      setSuccessMsg(data.message);
      sessionStorage.setItem('verificationEmail', data.user?.email || email);
      sessionStorage.setItem('verificationMessage', data.message);
      sessionStorage.setItem('verificationExpiresAt', data.otpExpiresAt || '');
      sessionStorage.setItem('verificationExpiresInSeconds', String(data.otpExpiresInSeconds || 120));
      if (data.devOtp) sessionStorage.setItem('devVerificationOtp', data.devOtp);
      // Wait a moment then navigate to verify page
      setTimeout(() => {
        if (onNavigateToVerify) onNavigateToVerify();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brandGrayBg flex flex-col justify-center items-center p-8 font-sans">
      <div className="w-full max-w-md bg-brandPaleBlue rounded-3xl shadow-xl shadow-blue-100/50 p-10 border border-blue-100 relative">
        {/* Back Button */}
        <button
          onClick={onNavigateToLogin}
          className="absolute top-8 left-8 text-gray-400 hover:text-brandNavy transition-colors flex items-center space-x-1 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={logo} alt="UniScout Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brandBlue/30" />
            <span className="text-2xl font-bold tracking-wider text-brandNavy">UniScout</span>
          </div>
          <h2 className="text-3xl font-extrabold text-brandNavy">Create Account</h2>
          <p className="text-gray-500 text-sm mt-1">Get started with UniScout today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg ? (
          <div className="space-y-6 text-center">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-start space-x-3 text-left">
              <Info size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Account Created Successfully!</p>
                <p className="text-xs text-emerald-700 mt-1 font-normal leading-relaxed">
                  We've initialized your profile and sent a two-minute verification code to your email.
                </p>
              </div>
            </div>

            {successMsg && (
              <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl text-left space-y-3">
                <p className="text-xs font-bold text-brandNavy flex items-center space-x-1.5">
                  <span className="w-2 h-2 bg-brandBlue rounded-full animate-ping"></span>
                  <span>Redirecting to verification...</span>
                </p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Please check your email for the 6-digit OTP.
                </p>
                <button
                  onClick={onNavigateToVerify}
                  className="block text-center py-2.5 bg-brandBlue text-white hover:bg-brandBlueLight font-bold rounded-xl text-xs transition-colors w-full"
                >
                  Enter OTP Now
                </button>
              </div>
            )}

            <button
              onClick={onNavigateToLogin}
              className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-brandNavy font-bold rounded-xl text-sm transition-all"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brandNavy block">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all text-brandNavy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brandNavy block">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all text-brandNavy"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brandNavy block">Mobile Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 text-xs font-bold">
                  +
                </span>
                <input
                  type="text"
                  required
                  maxLength={11}
                  placeholder="11 digit mobile number"
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all text-brandNavy"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brandNavy block">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Create a strong password"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all text-brandNavy"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Role selector tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brandNavy block">Account Role</label>
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button
                  type="button"
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    role === 'Student'
                      ? 'bg-white text-brandNavy shadow'
                      : 'text-gray-500 hover:text-brandNavy'
                  }`}
                  onClick={() => setRole('Student')}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    role === 'Faculty'
                      ? 'bg-white text-brandNavy shadow'
                      : 'text-gray-500 hover:text-brandNavy'
                  }`}
                  onClick={() => setRole('Faculty')}
                >
                  Faculty
                </button>
              </div>
            </div>

            {role === 'Faculty' && ['institution', 'department', 'designation'].map(field => (
              <div className="space-y-1.5" key={field}>
                <label className="text-xs font-bold text-brandNavy block">{field[0].toUpperCase() + field.slice(1)}</label>
                <input required value={facultyProfile[field]} onChange={e => setFacultyProfile({ ...facultyProfile, [field]: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brandNavy block">Confirm Password</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brandBlue hover:bg-brandBlueLight text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brandBlue/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign up'}
            </button>
          </form>
        )}

        {!successMsg && (
          <div className="mt-6 text-center text-xs">
            <span className="text-gray-500">Already have an account? </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-brandBlue font-bold hover:underline"
            >
              Log in
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center space-x-2 text-gray-500 text-xs">
        <Shield size={14} className="text-gray-400" />
        <span>Your data is secure with UniScout</span>
      </div>
    </div>
  );
}
