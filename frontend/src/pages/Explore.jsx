import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import PostCard from '../components/feed/PostCard';
import api from '../services/api';

export default function Explore() {
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const tones = [
    'Sarcastic', 'Poetic', 'Cinematic', 'Minimalist', 'Cyberpunk', 'Gen-Z', 
    'Witty', 'Funny', 'Heartfelt', 'Professional', 'Ethereal', 'Vibrant', 'Deep'
  ];

  const handleSearch = async (searchQuery) => {
    if (!searchQuery) return;
    setQuery(searchQuery);
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const res = await api.post('/ai/search', { query: searchQuery });
      setPosts(res.data.data.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Glass Header with Fade-Mask */}
      <div className="glass-header px-6 pt-8 pb-6">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-tight">
          Explore<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sc-accent-light to-sc-pink inline-block">Network</span>
        </h1>
        <p className="text-xs text-sc-muted mt-2 uppercase tracking-widest font-bold">Discover signals across the frequencies.</p>
      </div>

      <div className="px-6 py-6 flex flex-col gap-8">
        {/* Search Input */}
        <form onSubmit={onSubmit} className="relative max-w-xl w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-sc-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-sc-surface rounded-full text-lg outline-none focus:ring-2 focus:ring-sc-accent/20 transition-all shadow-[0_0_30px_rgba(20,20,40,0.5)]"
            placeholder="How are you feeling today?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        {/* Emotion Bubbles */}
        {!hasSearched && (
          <div className="flex flex-wrap gap-4 animate-fade-in">
            {tones.map((t) => (
              <button
                key={t}
                onClick={() => handleSearch(t)}
                className={`px-6 py-2.5 rounded-full bg-sc-hover text-sc-text hover:bg-sc-card transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-glow-sm text-sm font-semibold`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Results Area */}
        {hasSearched && (
          <div className="w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                 <Sparkles className="text-sc-accent-light w-10 h-10 mb-4 animate-spin-slow" />
                 <p className="text-sc-muted font-medium tracking-widest uppercase text-sm">Searching...</p>
              </div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-sc-muted">
                No matching frequencies found. Try another emotion.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
