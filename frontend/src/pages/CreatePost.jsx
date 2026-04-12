import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Upload, X, MapPin, Sparkles, Send, Zap } from 'lucide-react';
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
  const [tone, setTone] = useState('Witty');

  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);

  const TONES = [
    'Sarcastic', 'Poetic', 'Cinematic', 'Minimalist', 'Cyberpunk', 'Gen-Z', 
    'Witty', 'Funny', 'Heartfelt', 'Professional', 'Ethereal', 'Vibrant', 'Deep'
  ];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setAiDrafts([]);
    }
  };

  const resizeImage = (file, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
        };
      };
    });
  };

  const handleGenerateCaptions = async () => {
    setIsAiLoading(true);
    setAiDrafts([]);
    try {
      let imageData = null;
      if (file && file.type.startsWith('image/')) {
        imageData = await resizeImage(file);
      }

      const res = await api.post('/ai/caption', {
        prompt: caption || undefined,
        tone: tone.toLowerCase(),
        image: imageData
      });
      setAiDrafts(res.data.data.captions);
    } catch (err) {
      toast.error('Failed to connect to AI Vision Engine');
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
    <div className="flex flex-col min-h-full w-full max-w-6xl mx-auto px-4 relative">

      {/* ── Editorial Hero Header ─────────────────────────────── */}
      <div className="relative pt-10 pb-6 mb-2 overflow-hidden">
        {/* Ambient glow behind headline */}
        <div className="absolute -top-10 left-0 w-[600px] h-[300px] bg-sc-accent opacity-[0.07] rounded-full blur-[100px] pointer-events-none" />

        <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-sc-accent-light mb-3 flex items-center gap-2">
          <Zap size={10} className="fill-sc-accent-light" />
          AI Content Studio
        </p>

        <h1 className="text-7xl md:text-8xl font-extrabold leading-none tracking-tighter text-white relative z-10">
          Create
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-sc-accent via-[#c084fc] to-sc-pink">
            New Post.
          </span>
        </h1>

        <p className="mt-5 text-sc-muted text-sm uppercase tracking-widest font-bold max-w-xs">
          Compose your signal. Broadcast your frequency.
        </p>

        {/* Tonal separator — zero borders */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sc-accent/20 to-transparent" />
      </div>

      {/* ── Two-column workspace ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 py-6">

        {/* Left: Media + Location */}
        <div className="w-full md:w-1/2 flex flex-col gap-5">

          {/* Drop zone — tonal shift, no border */}
          <div
            className={`rounded-2xl flex flex-col items-center justify-center p-8 transition-all duration-300 ${
              preview
                ? 'bg-[#081329]/60 shadow-[0_0_40px_rgba(172,138,255,0.1)]'
                : 'bg-[#081329] hover:bg-[#0d1e3d] cursor-pointer'
            }`}
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
                  <video src={preview} className="max-h-[300px] rounded-xl" controls />
                ) : (
                  <img src={preview} alt="Preview" className="max-h-[300px] object-contain rounded-xl" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  className="absolute -top-3 -right-3 bg-[#060e20] rounded-full p-2 text-sc-muted hover:text-red-400 shadow-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#142449]/60 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(172,138,255,0.15)]">
                  <Upload className="text-sc-accent-light" size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg text-white mb-1">Drag and drop media</p>
                  <p className="text-xs text-sc-muted max-w-xs">
                    Upload a high-resolution image or video (up to 4K, max 100 MB).
                  </p>
                </div>
                <button className="px-6 py-2 bg-[#142449]/60 hover:bg-[#1a2d5a] rounded-full text-sm font-semibold transition-colors mt-2">
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Location — tonal, no border */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin size={18} className="text-sc-muted group-focus-within:text-sc-accent-light transition-colors" />
            </div>
            <input
              type="text"
              className="w-full bg-[#081329] hover:bg-[#0d1e3d] rounded-xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-sc-accent/20 transition-all placeholder-sc-muted/50 text-white"
              placeholder="Add location..."
            />
          </div>
        </div>

        {/* Right: AI Caption Studio */}
        <div className="w-full md:w-1/2">
          <div
            className="flex flex-col h-full rounded-2xl overflow-hidden relative"
            style={{ backdropFilter: 'blur(30px)', background: 'rgba(8,19,41,0.7)' }}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-sc-accent opacity-[0.08] rounded-full blur-[60px] pointer-events-none" />

            {/* Studio header — tonal band */}
            <div className="px-6 py-5 flex justify-between items-center bg-[#060e20]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sc-accent to-sc-pink flex items-center justify-center shadow-[0_0_20px_rgba(172,138,255,0.4)]">
                  <Sparkles className="text-white" size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">AI Caption Studio</h3>
                  <p className="text-[10px] text-sc-pink font-bold tracking-widest uppercase">Mistral · Sentient Output</p>
                </div>
              </div>
              {/* Live indicator */}
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Live</span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
              {/* Caption textarea */}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption or a short prompt for the AI to expand..."
                className="w-full bg-[#060e20]/60 hover:bg-[#060e20]/80 rounded-xl p-4 min-h-[140px] outline-none focus:ring-2 focus:ring-sc-accent/20 transition-all resize-none text-sm placeholder-sc-muted/50 text-white"
              />

              {/* Tone selector — pill chips, no border */}
              <div>
                <p className="text-[10px] text-sc-muted font-bold tracking-[0.3em] uppercase mb-3">Refine Tone</p>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                        tone === t
                          ? 'bg-sc-accent text-white shadow-[0_0_20px_rgba(172,138,255,0.5)]'
                          : 'bg-[#0d1e3d] text-sc-muted hover:bg-[#142449] hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate trigger */}
              <div className="flex justify-start">
                <button
                  onClick={handleGenerateCaptions}
                  disabled={isAiLoading || (!file && !caption)}
                  className="text-sc-accent-light hover:bg-sc-accent/10 py-2 px-4 rounded-xl flex items-center gap-2 text-sm disabled:opacity-40 transition-all font-bold"
                >
                  {isAiLoading
                    ? <Sparkles className="animate-spin text-sc-pink" size={16} />
                    : <Sparkles size={16} />}
                  {isAiLoading ? 'Synthesizing Context...' : 'Generate Magic'}
                </button>
              </div>

              {/* AI Draft variants */}
              {aiDrafts.length > 0 && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <p className="text-[10px] text-sc-muted font-bold tracking-[0.3em] uppercase">
                    Contextual Variants
                  </p>
                  {aiDrafts.map((draft, i) => (
                    <div
                      key={i}
                      onClick={() => setCaption(draft.text)}
                      className="p-4 bg-[#060e20]/60 hover:bg-[#0d1e3d] rounded-xl cursor-pointer transition-all relative group"
                    >
                      <p className="text-sm pr-12 leading-relaxed text-sc-text">{draft.text}</p>
                      <div className="absolute bottom-3 right-4">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          draft.mood === 'VIBRANT' ? 'text-sc-pink'
                          : draft.mood === 'DEEP' ? 'text-purple-400'
                          : 'text-sc-cyan'
                        }`}>
                          {draft.mood}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Publish footer — tonal band */}
            <div className="px-6 py-5 bg-[#060e20]/60">
              <button
                onClick={handlePublish}
                disabled={isPublishing || (!caption && !file)}
                className="gradient-btn w-full py-4 text-center font-bold flex justify-center items-center gap-2 shadow-[0_0_30px_rgba(172,138,255,0.3)] disabled:opacity-40 disabled:shadow-none"
              >
                {isPublishing ? 'Transmitting...' : 'Manifest Post'}
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
