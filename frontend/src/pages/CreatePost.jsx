import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Upload, X, MapPin, Sparkles, Send } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { addPostToTop } from '../store/slices/feedSlice';

export default function CreatePost() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  
  // AI Caption State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiDrafts, setAiDrafts] = useState([]);
  const [tone, setTone] = useState('witty');
  
  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);

  const TONES = ['Witty', 'Funny', 'Heartfelt', 'Professional', 'Ethereal', 'Vibrant', 'Deep'];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setAiDrafts([]); // Reset drafts on new file
    }
  };

  const handleGenerateCaptions = async () => {
    setIsAiLoading(true);
    setAiDrafts([]);
    try {
      // In a real app, you might send the image to vision API. Here we just send tone.
      const res = await api.post('/ai/caption', { prompt: caption || undefined, tone: tone.toLowerCase() });
      setAiDrafts(res.data.data.captions);
    } catch (err) {
      toast.error('Failed to connect to AI Engine');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!caption && !file) return toast.error('Add media or caption');
    
    setIsPublishing(true);
    const formData = new FormData();
    if (caption) formData.append('caption', caption);
    if (file) formData.append('media', file);
    
    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dispatch(addPostToTop(res.data.data.post));
      toast.success('Post published successfully');
      navigate('/');
    } catch (err) {
      toast.error('Failed to publish post');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full max-w-6xl mx-auto px-4 py-8">
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Create New Post</h1>
        <p className="text-sc-muted">Craft your story with AI-augmented intelligence.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Side: Media & Settings */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          
          <div 
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-colors ${preview ? 'border-sc-accent bg-sc-hover/30' : 'border-sc-border bg-sc-surface hover:border-sc-accent-light hover:bg-sc-hover cursor-pointer'}`}
            style={{ minHeight: '300px' }}
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*"
              onChange={handleFileChange} 
            />
            
            {preview ? (
              <div className="relative w-full h-full flex flex-col items-center">
                {file.type.startsWith('video') ? (
                  <video src={preview} className="max-h-[300px] rounded-lg" controls />
                ) : (
                  <img src={preview} alt="Preview" className="max-h-[300px] object-contain rounded-lg" />
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  className="absolute -top-3 -right-3 bg-sc-bg border border-sc-border rounded-full p-1 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-sc-hover border border-sc-border flex items-center justify-center mb-2 shadow-glow-sm">
                  <Upload className="text-sc-accent-light" size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg text-sc-text mb-1">Drag and drop media</p>
                  <p className="text-xs text-sc-muted">Upload a high-resolution image or video (up to 4K support, max 100MB).</p>
                </div>
                <button className="px-6 py-2 bg-sc-card border border-sc-border rounded-full text-sm font-semibold hover:border-sc-accent transition mt-2">
                  Browse Files
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin size={18} className="text-sc-muted" />
            </div>
            <input 
              type="text" 
              className="w-full bg-sc-surface border border-sc-border rounded-xl pl-12 pr-4 py-4 outline-none focus:border-sc-accent transition-colors placeholder-sc-muted/70"
              placeholder="Add location..."
            />
          </div>
        </div>

        {/* Right Side: AI Studio */}
        <div className="w-full md:w-1/2">
          <div className="glass-card flex flex-col h-full border-sc-accent/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sc-accent-glow/10 blur-[50px] rounded-full pointer-events-none"></div>
            
            {/* AI Header */}
            <div className="p-6 border-b border-sc-border/50 flex justify-between items-center bg-sc-surface/50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center p-0.5 shadow-glow-sm">
                   <div className="w-full h-full bg-sc-bg rounded-[6px] flex items-center justify-center">
                     <Sparkles className="text-sc-accent-light" size={18} />
                   </div>
                 </div>
                 <div>
                   <h3 className="font-bold text-lg">AI Caption Studio</h3>
                   <p className="text-[10px] text-sc-pink font-bold tracking-widest uppercase">Analyzing Context Data...</p>
                 </div>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
              
              {/* Manual Input */}
              <textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption or a short prompt for the AI to expand..."
                className="w-full bg-sc-hover/50 border border-sc-border rounded-xl p-4 min-h-[120px] outline-none focus:border-sc-accent resize-none text-sm placeholder-sc-muted/60"
              />

              {/* Engine Personality */}
              <div>
                <p className="text-xs text-sc-muted font-bold tracking-wider uppercase mb-3 text-left">Engine Personality</p>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                    <button 
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${tone === t ? 'bg-sc-accent/20 border-sc-accent text-sc-accent-light' : 'bg-sc-surface border-sc-border text-sc-muted hover:border-white'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button Workspace */}
              <div className="flex justify-start">
                 <button 
                   onClick={handleGenerateCaptions}
                   disabled={isAiLoading || (!file && !caption)}
                   className="ghost-btn !border-sc-accent/50 text-sc-accent-light hover:!bg-sc-accent/10 flex items-center gap-2 text-sm disabled:opacity-50"
                 >
                   {isAiLoading ? <Sparkles className="animate-spin" size={16} /> : <Sparkles size={16} />}
                   {isAiLoading ? "Generating Variants..." : "Generate Variants"}
                 </button>
              </div>

              {/* Generated Drafts */}
              {aiDrafts.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 animate-fade-in">
                  <p className="text-xs text-sc-muted font-bold tracking-wider uppercase">Generated Drafts</p>
                  {aiDrafts.map((draft, i) => (
                    <div 
                      key={i} 
                      onClick={() => setCaption(draft.text)}
                      className="p-4 bg-sc-surface border border-sc-border rounded-xl cursor-pointer hover:border-sc-accent-light hover:bg-sc-hover transition-colors relative group"
                    >
                      <p className="text-sm pr-10">{draft.text}</p>
                      <div className="absolute bottom-3 right-4">
                         <span className={`text-[10px] uppercase font-bold tracking-wider ${draft.mood === 'VIBRANT' ? 'text-sc-pink' : draft.mood === 'DEEP' ? 'text-purple-400' : 'text-sc-cyan'}`}>
                           Mood: {draft.mood}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Publish */}
            <div className="p-6 border-t border-sc-border/50 bg-sc-surface/20">
              <button 
                onClick={handlePublish}
                disabled={isPublishing || (!caption && !file)}
                className="gradient-btn w-full py-4 text-center rounded-xl font-bold flex justify-center items-center gap-2 shadow-glow disabled:opacity-50 disabled:shadow-none"
              >
                {isPublishing ? 'Transmitting...' : 'Publish Post'} <Send size={18} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
