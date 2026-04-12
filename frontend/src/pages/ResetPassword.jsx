import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../services/api';

// ── Minimal star field component with 0.05 opacity ───────────────────────────
function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 4}s`,
    duration: `${3 + Math.random() * 4}s`,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            width: star.size,
            height: star.size,
            top: star.top,
            left: star.left,
            opacity: 0.05,
            animation: `twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  // If no token, redirect to forgot password
  useEffect(() => {
    if (!token) {
      navigate('/forgot-password', { replace: true });
    }
  }, [token, navigate]);

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: 'Weak', color: '#ef4444', width: '30%' };
    if (password.length < 8) return { label: 'Fair', color: '#f59e0b', width: '60%' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { label: 'Strong', color: '#10b981', width: '100%' };
    }
    return { label: 'Good', color: '#a855f7', width: '80%' };
  };

  const strength = passwordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setMessage(res.data?.message || 'Neural Link re-synced successfully.');
      setStatus('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Token invalid or expired. Please request a new link.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#060e20] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
      />

      {/* 0.05 opacity star field */}
      <StarField />

      {/* Sparkles icon */}
      <div
        className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ opacity: 0.07 }}
      >
        <Sparkles size={280} className="text-sc-accent-light" />
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div
          className="rounded-2xl p-10 shadow-2xl relative"
          style={{
            background: 'rgba(14, 24, 55, 0.7)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(172,138,255,0.18)',
            boxShadow: '0 0 60px rgba(124,58,237,0.15), 0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          {/* Icon + Title */}
          <div className="text-center mb-8">
            <div
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transform rotate-12"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                boxShadow: '0 0 28px rgba(6,182,212,0.4)',
              }}
            >
              <ShieldCheck className="text-white" size={26} />
            </div>
            <h1 className="text-2xl font-bold mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Set New Password
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Create a strong new password to re-secure your neural node.
            </p>
          </div>

          {/* Success State */}
          {status === 'success' ? (
            <div className="text-center">
              <div
                className="rounded-xl p-6 mb-6"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}
              >
                <CheckCircle size={36} className="text-sc-accent-light mx-auto mb-3" />
                <p className="font-bold text-sc-accent-light mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Neural Link Re-synced!
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                  {message}
                </p>
              </div>
              <Link
                to="/login"
                className="gradient-btn w-full py-3.5 flex items-center justify-center gap-2"
                id="reset-to-login-btn"
              >
                Proceed to Login
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Error display */}
              {status === 'error' && (
                <div
                  className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <div className="relative">
                  <Lock
                    className="absolute top-1/2 -translate-y-1/2"
                    size={18}
                    style={{ left: '1rem', color: '#64748b' }}
                  />
                  <input
                    id="reset-password-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="New password (min 8 chars)"
                    className="sc-input"
                    style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute top-1/2 -translate-y-1/2 transition-colors"
                    style={{ right: '1rem', color: '#64748b' }}
                    tabIndex={-1}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password strength meter */}
                {strength && (
                  <div className="mt-2">
                    <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-1 rounded-full transition-all duration-500"
                        style={{ width: strength.width, background: strength.color }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock
                  className="absolute top-1/2 -translate-y-1/2"
                  size={18}
                  style={{ left: '1rem', color: '#64748b' }}
                />
                <input
                  id="reset-confirm-password-input"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className="sc-input"
                  style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute top-1/2 -translate-y-1/2 transition-colors"
                  style={{ right: '1rem', color: '#64748b' }}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword && (
                <p
                  className="text-xs -mt-2"
                  style={{ color: password === confirmPassword ? '#10b981' : '#f87171' }}
                >
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}

              <button
                id="reset-submit-btn"
                type="submit"
                disabled={status === 'loading' || password !== confirmPassword || password.length < 8}
                className="gradient-btn w-full py-3.5 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Re-syncing...
                  </>
                ) : (
                  <>
                    Re-sync Neural Link
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm mt-8" style={{ color: '#475569' }}>
            Didn't request this?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#a855f7' }}>
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
