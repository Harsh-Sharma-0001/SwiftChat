import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, Mail, Lock, User, AtSign, ArrowRight } from 'lucide-react';
import { registerUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({ displayName: '', username: '', email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector(state => state.auth);

  useEffect(() => {
    if (user) navigate('/');
    if (error) toast.error(error);
  }, [user, error, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.username) return toast.error('Please fill required fields');
    if (formData.password.length < 8) return toast.error('Password must be at least 8 characters');
    dispatch(registerUser(formData));
  };

  return (
    <div className="min-h-screen bg-sc-bg flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-sc-cyan opacity-10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-sc-accent opacity-20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 animate-fade-in relative">
        <div className="glass-card p-10 backdrop-blur-md border-sc-cyan/20 shadow-glow relative z-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-sc-cyan to-sc-accent-light rounded-xl flex items-center justify-center mb-4 transform rotate-12 shadow-glow-sm">
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-sc-muted mb-2">Create Identity</h1>
            <p className="text-sc-muted text-sm">Join the network. Share the vibe.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative w-full">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-sc-muted" size={16} />
                <input type="text" name="displayName" placeholder="Display Name" className="sc-input !pl-10 text-sm py-2.5" onChange={handleChange} />
              </div>
              <div className="relative w-full">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-sc-muted" size={16} />
                <input type="text" name="username" placeholder="Username" className="sc-input !pl-10 text-sm py-2.5" onChange={handleChange} />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sc-muted" size={18} />
              <input type="email" name="email" placeholder="Email Address" className="sc-input !pl-12" onChange={handleChange} />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-sc-muted" size={18} />
              <input type="password" name="password" placeholder="Password (min 8 chars)" className="sc-input !pl-12" onChange={handleChange} />
            </div>

            <button type="submit" disabled={status === 'loading'} className="gradient-btn w-full py-3.5 mt-4 flex items-center justify-center gap-2 group">
              {status === 'loading' ? 'Syncing...' : 'Manifest Account'}
              {!status === 'loading' && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="text-center text-sm text-sc-muted mt-8">
            Neural link already established? <Link to="/login" className="text-sc-accent-light font-semibold hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
