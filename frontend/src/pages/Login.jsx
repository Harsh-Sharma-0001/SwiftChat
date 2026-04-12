import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { loginUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

// ── 0.05-opacity star field ────────────────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 0.8,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 4}s`,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ width: s.size, height: s.size, top: s.top, left: s.left, opacity: 0.05 }}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector(state => state.auth);

  useEffect(() => {
    if (user) navigate('/');
    if (error) toast.error(error);
  }, [user, error, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="min-h-screen bg-[#060e20] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Radial accent glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />

      {/* 0.05 opacity star field */}
      <StarField />

      {/* Floating Star Background Element */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 opacity-[0.05] shadow-glow pointer-events-none">
        <Sparkles size={300} className="text-sc-accent-light blur-[1px]" />
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in relative">
        <div className="glass-card p-10 backdrop-blur-md relative z-10 shadow-glow">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-sc-cyan to-sc-accent-light rounded-xl flex items-center justify-center mb-4 transform rotate-12 shadow-glow-sm">
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-sc-muted mb-2">Welcome Back</h1>
            <p className="text-sc-muted text-sm font-medium tracking-wide">Login to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sc-muted" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                className="sc-input !pl-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sc-muted" size={18} />
              <input
                type="password"
                placeholder="Password"
                className="sc-input !pl-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center text-xs mt-1">
              <label className="flex items-center gap-2 text-sc-muted cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" className="accent-sc-accent w-3 h-3" />
                Stay connected
              </label>
              <Link to="/forgot-password" virtual="true" className="text-sc-accent-light hover:underline font-medium">Forgot Password?</Link>
            </div>

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="gradient-btn w-full py-3.5 mt-2 flex items-center justify-center gap-2 group shadow-glow-pink"
            >
              {status === 'loading' ? 'Authenticating...' : 'Login'}
              {!status === 'loading' && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="text-center text-sm text-sc-muted mt-8">
            Don't have an account? <Link to="/register" className="text-sc-cyan font-semibold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
