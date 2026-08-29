import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield, Target, BarChart2, Box, Star } from 'lucide-react';
import { api } from '../services/api';
import logo from '../assets/logo.jpg';

export default function Login({ onLoginSuccess, onNavigateToSignup, onNavigateToVerify }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: otp and new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const data = await api.login(email, password, role);
      if (data.requiresVerification) {
        sessionStorage.setItem('verificationEmail', data.email || email);
        sessionStorage.setItem('verificationMessage', data.message);
        sessionStorage.setItem('verificationExpiresAt', data.otpExpiresAt || '');
        sessionStorage.setItem('verificationExpiresInSeconds', String(data.otpExpiresInSeconds || 120));
        if (data.devOtp) sessionStorage.setItem('devVerificationOtp', data.devOtp);
        if (onNavigateToVerify) onNavigateToVerify();
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials or verify email.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordEmail = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMessage('');
    setLoading(true);
    try {
      const data = await api.forgotPassword(forgotEmail);
      setForgotMessage(data.message + (data.devOtp ? ` (Dev OTP: ${data.devOtp})` : ''));
      setForgotStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMessage('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const data = await api.resetPasswordOtp(forgotEmail, forgotOtp, newPassword);
      setForgotMessage(data.message || 'Password reset successful!');
      setTimeout(() => {
        setIsForgotPassword(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Panel: Brand Details (Navy #0A1931) */}
      <div className="hidden lg:flex w-5/12 bg-brandNavy text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brandBlue opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brandBlue opacity-15 rounded-full blur-3xl -ml-20 -mb-20"></div>

        {/* Top Header */}
        <div className="flex items-center space-x-3 z-10">
          <img src={logo} alt="UniScout Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brandBlue/30" />
          <span className="text-2xl font-bold tracking-wider">UniScout</span>
        </div>

        {/* Content Highlights */}
        <div className="my-auto space-y-10 z-10 max-w-md">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold leading-tight">
              Find the right universities.<br />
              <span className="text-brandBlueLight">For your future.</span>
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              AI-assisted university discovery, funding information, and source-backed program suggestions — all in one place.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-brandNavyLight rounded-xl text-brandBlueLight mt-0.5">
                <Target size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white">Smart Recommendations</h4>
                <p className="text-gray-400 text-xs mt-1">Get matched with universities that fit your profile and goals.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-brandNavyLight rounded-xl text-brandBlueLight mt-0.5">
                <BarChart2 size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white">Funding Insights</h4>
                <p className="text-gray-400 text-xs mt-1">Understand your funding chances and find better opportunities.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-brandNavyLight rounded-xl text-brandBlueLight mt-0.5">
                <div className="relative">
                  <Box size={20} />
                  <Star size={10} className="absolute -top-1 -right-1 fill-brandBlueLight text-brandBlueLight" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white">Source-backed Discovery</h4>
                <p className="text-gray-400 text-xs mt-1">Review official program, admissions, and funding sources.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Building Illustration / Decorative SVG */}
        <div className="z-10 mt-6 opacity-60">
          <svg className="w-full h-24 text-brandBlue" fill="currentColor" viewBox="0 0 400 100">
            <path d="M20,90 L20,70 L30,70 L30,90 Z M40,90 L40,60 L60,60 L60,90 Z M70,90 L70,50 L90,50 L90,90 Z M100,90 L100,30 L130,30 L130,90 Z M140,90 L140,40 L160,40 L160,90 Z M170,90 L170,20 L210,20 L210,90 Z M220,90 L220,60 L240,60 L240,90 Z M250,90 L250,45 L280,45 L280,90 Z M290,90 L290,35 L310,35 L310,90 Z M320,90 L320,55 L350,55 L350,90 Z M360,90 L360,40 L380,40 L380,90 Z" opacity="0.3"/>
            <path d="M10,95 L390,95 L390,98 L10,98 Z" />
            <circle cx="190" cy="40" r="1" opacity="0.5"/>
            <circle cx="280" cy="20" r="1" opacity="0.5"/>
            <circle cx="100" cy="15" r="1.5" opacity="0.5"/>
          </svg>
        </div>
      </div>

      {/* Right Panel: Login Card Component */}
      <div className="w-full lg:w-7/12 bg-brandGrayBg flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md bg-brandPaleBlue rounded-3xl shadow-xl shadow-blue-100/50 p-10 border border-blue-100">
          {isForgotPassword ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-brandNavy">Reset Password</h2>
                <p className="text-gray-500 text-sm mt-2">Enter your email to receive a reset code</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}
              {forgotMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-xs font-semibold">
                  {forgotMessage}
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotPasswordEmail} className="space-y-5">
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
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-brandBlue hover:bg-brandBlueLight text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brandBlue/20 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brandNavy block">Verification Code</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter the code sent to your email"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all text-brandNavy"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brandNavy block">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all text-brandNavy"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brandNavy block">Confirm Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all text-brandNavy"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-brandBlue hover:bg-brandBlueLight text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brandBlue/20 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              )}

              <div className="mt-8 text-center text-xs">
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setForgotStep(1); setError(''); setForgotMessage(''); }}
                  className="text-gray-500 font-bold hover:text-brandBlue hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-brandNavy">Welcome back</h2>
                <p className="text-gray-500 text-sm mt-2">Login to your UniScout account</p>
              </div>

              {/* Role selector tabs */}
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                role === 'Student'
                  ? 'bg-white text-brandNavy shadow'
                  : 'text-gray-500 hover:text-brandNavy'
              }`}
              onClick={() => setRole('Student')}
            >
              Student Portal
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                role === 'Admin'
                  ? 'bg-white text-brandNavy shadow'
                  : 'text-gray-500 hover:text-brandNavy'
              }`}
              onClick={() => setRole('Admin')}
            >
              Admin Portal
            </button>
            <button type="button" className={`flex-1 py-2.5 text-sm font-semibold rounded-xl ${role === 'Faculty' ? 'bg-white text-brandNavy shadow' : 'text-gray-500'}`} onClick={() => setRole('Faculty')}>
              Faculty Portal
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-brandNavy block">Password</label>
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPassword(true); setError(''); setForgotMessage(''); }} 
                  className="text-xs font-semibold text-brandBlue hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all text-brandNavy"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-brandNavy transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brandBlue hover:bg-brandBlueLight text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brandBlue/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative my-6 text-center">
            <hr className="border-gray-200" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400 font-semibold">
              or continue with
            </span>
          </div>

          {/* Mock Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled
              title="OAuth login is coming soon"
              className="flex cursor-not-allowed items-center justify-center space-x-2 py-2.5 border border-gray-200 rounded-xl opacity-60 text-sm font-semibold text-brandNavy"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.84 14.97 1 12 1 7.35 1 3.39 3.66 1.39 7.56l3.75 2.91c.88-2.65 3.38-4.43 6.86-4.43z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.74 2.9c2.18-2.01 3.68-4.96 3.68-8.72z"/>
                <path fill="#FBBC05" d="M5.14 10.47a7.25 7.25 0 0 1 0 3.06l-3.75 2.91c-.88-1.75-1.39-3.78-1.39-5.97s.51-4.22 1.39-5.97l3.75 2.91z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.74-2.9c-1.12.75-2.55 1.19-4.22 1.19-3.48 0-5.98-1.78-6.86-4.43H1.39l-3.75 2.91C3.39 20.34 7.35 23 12 23z"/>
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              disabled
              title="OAuth login is coming soon"
              className="flex cursor-not-allowed items-center justify-center space-x-2 py-2.5 border border-gray-200 rounded-xl opacity-60 text-sm font-semibold text-brandNavy"
            >
              <svg className="w-4 h-4" viewBox="0 0 23 23">
                <path fill="#F25022" d="M0 0h11v11H0z"/>
                <path fill="#7FBA00" d="M12 0h11v11H12z"/>
                <path fill="#00A4EF" d="M0 12h11v11H0z"/>
                <path fill="#FFB900" d="M12 12h11v11H12z"/>
              </svg>
              <span>Microsoft</span>
            </button>
          </div>

          <div className="mt-8 text-center text-xs">
            <span className="text-gray-500">Don't have an account? </span>
            <button
              type="button"
              onClick={onNavigateToSignup}
              className="text-brandBlue font-bold hover:underline"
            >
              Sign up
            </button>
          </div>
            </>
          )}
        </div>

        {/* Security Footer */}
        <div className="mt-6 flex items-center space-x-2 text-gray-500 text-xs">
          <Shield size={14} className="text-gray-400" />
          <span>Your data is secure with UniScout</span>
        </div>
      </div>
    </div>
  );
}
