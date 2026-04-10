import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { loginUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen bg-sc-bg flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sc-accent opacity-20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sc-pink opacity-20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 animate-fade-in relative">
        <div className="absolute -top-12 -left-12 rotate-12 opacity-50">
           <Sparkles size={100} className="text-sc-accent-light blur-[2px]" />
        </div>
        
        <div className="glass-card p-10 backdrop-blur-md border-sc-accent-light/20 relative z-10 shadow-glow">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-accent mb-2">SwiftChat</h1>
            <p className="text-sc-muted text-sm font-medium tracking-wide">Enter the Sentient Prism</p>
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
              <a href="#" className="text-sc-accent-light hover:underline">Lost signal?</a>
            </div>

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="gradient-btn w-full py-3.5 mt-2 flex items-center justify-center gap-2 group shadow-glow-pink"
            >
              {status === 'loading' ? 'Authenticating...' : 'Initialize Connection'}
              {!status === 'loading' && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="text-center text-sm text-sc-muted mt-8">
            New to the stream? <Link to="/register" className="text-sc-cyan font-semibold hover:underline">Manifest an Echo</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
