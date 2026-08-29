import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Loader } from 'lucide-react';
import { api } from '../services/api';

export default function VerifyEmail({ onNavigateToLogin, onVerificationSuccess }) {
  const email = sessionStorage.getItem('verificationEmail') || '';
  const [devOtp, setDevOtp] = useState(sessionStorage.getItem('devVerificationOtp') || '');
  const initialMessage = sessionStorage.getItem('verificationMessage') || '';
  const initialSeconds = Number(sessionStorage.getItem('verificationExpiresInSeconds') || 120);
  const [token, setToken] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(Number.isFinite(initialSeconds) ? initialSeconds : 120);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState(initialMessage);

  const expired = secondsLeft <= 0;
  const canResend = expired || resendCooldown <= 0;
  const countdown = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const seconds = (secondsLeft % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  useEffect(() => {
    if (success || expired) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft(current => {
        const next = Math.max(0, current - 1);
        if (next === 0) {
          setErrorMsg('This verification code has expired.');
          setNotice('');
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expired, success]);

  useEffect(() => {
    if (success || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown(current => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown, success]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (expired) {
      setErrorMsg('This verification code has expired.');
      return;
    }
    if (!email) {
      setErrorMsg('Please return to signup or login before verifying your email.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const data = await api.verifyEmail(email, token);
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (onVerificationSuccess) onVerificationSuccess(data.user);
      }
      sessionStorage.removeItem('verificationEmail');
      sessionStorage.removeItem('verificationMessage');
      sessionStorage.removeItem('verificationExpiresAt');
      sessionStorage.removeItem('verificationExpiresInSeconds');
      sessionStorage.removeItem('devVerificationOtp');
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMsg('Please return to signup or login before requesting a new code.');
      return;
    }
    setErrorMsg('');
    setNotice('');
    setResending(true);
    try {
      const data = await api.resendOtp(email);
      sessionStorage.setItem('verificationMessage', data.message);
      sessionStorage.setItem('verificationExpiresAt', data.otpExpiresAt || '');
      sessionStorage.setItem('verificationExpiresInSeconds', String(data.otpExpiresInSeconds || 120));
      if (data.devOtp) {
        sessionStorage.setItem('devVerificationOtp', data.devOtp);
        setDevOtp(data.devOtp);
      } else {
        sessionStorage.removeItem('devVerificationOtp');
        setDevOtp('');
      }
      setSecondsLeft(data.otpExpiresInSeconds || 120);
      setResendCooldown(30);
      setToken('');
      setNotice('A new verification code has been sent.');
    } catch (err) {
      setErrorMsg(err.message || 'Unable to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-brandGrayBg flex flex-col justify-center items-center p-8 font-sans">
      <div className="w-full max-w-md bg-brandPaleBlue rounded-3xl shadow-xl shadow-blue-100/50 p-10 border border-blue-100 text-center">
        {!loading && !success && (
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-brandNavy">Verify Email</h2>
              <p className="text-gray-500 text-sm mt-2">Enter the 6-digit verification OTP sent to {email || 'your email'}.</p>
            </div>
            <div className={`p-4 border rounded-xl ${expired ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-100 text-brandNavy'}`}>
              <p className="text-xs font-bold uppercase">Code expires in</p>
              <p className="text-4xl font-extrabold mt-1 tabular-nums">{countdown}</p>
            </div>
            {notice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
                {notice}
              </div>
            )}
            {devOtp && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
                <p className="text-xs font-bold uppercase">Local development OTP</p>
                <p className="text-2xl tracking-[0.35em] font-extrabold mt-1">{devOtp}</p>
                <p className="text-xs mt-2">SMTP is not configured, so the code is shown here for the local demo.</p>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}
            <input
              type="text"
              required
              maxLength={6}
              inputMode="numeric"
              placeholder="000000"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center tracking-widest font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all text-brandNavy"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              disabled={expired}
            />
            <button
              type="submit"
              disabled={expired || loading || token.length !== 6}
              className="w-full py-3 bg-brandBlue hover:bg-brandBlueLight text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brandBlue/20 disabled:opacity-50"
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || resending}
              className="w-full py-3 border border-brandBlue/30 hover:bg-blue-50 text-brandBlue font-bold rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {resending ? 'Sending...' : canResend ? 'Resend OTP' : `Resend OTP in ${resendCooldown}s`}
            </button>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-brandNavy font-bold rounded-xl text-sm transition-all"
            >
              Back to Login
            </button>
          </form>
        )}
        
        {loading ? (
          <div className="space-y-6">
            <Loader className="w-12 h-12 text-brandBlue animate-spin mx-auto" />
            <div>
              <h2 className="text-2xl font-extrabold text-brandNavy">Verifying Email...</h2>
              <p className="text-gray-500 text-sm mt-2">Checking OTP credentials with UniScout servers</p>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md border border-emerald-100">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-brandNavy">Email Verified!</h2>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                Your email has been verified successfully. You can now continue to your UniScout portal dashboard.
              </p>
            </div>
            <button
              onClick={() => {
                const savedUser = localStorage.getItem('user');
                if (savedUser && onVerificationSuccess) onVerificationSuccess(JSON.parse(savedUser));
                else onNavigateToLogin();
              }}
              className="w-full py-3 bg-brandBlue hover:bg-brandBlueLight text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brandBlue/20"
            >
              Continue
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
