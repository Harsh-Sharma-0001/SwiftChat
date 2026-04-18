import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success(res.data.message);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.data?.registered === false) {
        toast.error("No account found. Please sign up first.");
        setTimeout(() => {
          navigate('/register');
        }, 2000);
      } else {
        toast.error(err.response?.data?.message || 'Failed to send reset signal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e20] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sc-accent opacity-20 rounded-full blur-[120px] pointer-events-none"></div>

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
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-sc-muted mb-2">Reset Signal</h1>
            <p className="text-sc-muted text-sm font-medium tracking-wide">
              {submitted ? 'Transmission Complete' : 'Restore your neural connection'}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-sc-muted" size={18} />
                <input
                  type="email"
                  placeholder="Neural Address (Email)"
                  className="sc-input !pl-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="gradient-btn w-full py-3.5 mt-2 flex items-center justify-center gap-2 group shadow-glow-pink"
              >
                {loading ? 'Transmitting...' : 'Send Reset Link'}
                {!loading && <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          ) : (
            <div className="text-center animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-sc-cyan/10 flex items-center justify-center text-sc-cyan shadow-glow-sm">
                  <CheckCircle size={40} />
                </div>
              </div>
              <p className="text-sc-text text-sm mb-8 leading-relaxed">
                Reset signal sent to your neural link (email). Check your inbox to calibrate your credentials.
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-sc-muted hover:text-white transition-colors">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
