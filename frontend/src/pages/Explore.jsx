import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import PostCard from '../components/feed/PostCard';
import api from '../services/api';

export default function Explore() {
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const emotions = [
    { label: 'Energetic', vibe: 'Electric', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
    { label: 'Melancholy', vibe: 'Indigo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { label: 'Zen', vibe: 'Crystal', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]' },
    { label: 'Calm', vibe: 'Resonant', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { label: 'Inspired', vibe: 'Vivid', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { label: 'Nostalgic', vibe: 'Amber', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
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
    <div className="flex flex-col h-full overflow-y-auto w-full max-w-3xl mx-auto px-4 py-8">
      {/* Title Area */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          Explore the <span className="font-serif italic text-sc-accent-glow glow-pulse">Sentient</span> Prism.
        </h1>
        <p className="text-sc-muted max-w-md mx-auto">Discover frequencies and vibes synchronized across the neural network.</p>
      </div>

      {/* Search Input */}
      <form onSubmit={onSubmit} className="relative max-w-xl mx-auto w-full mb-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-sc-muted" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 bg-sc-surface border-2 border-sc-border rounded-full text-lg focus:ring-0 focus:border-sc-accent transition-colors shadow-[0_0_30px_rgba(20,20,40,0.5)]"
          placeholder="How are you feeling today?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {/* Emotion Bubbles */}
      {!hasSearched && (
        <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto mb-16 animate-fade-in">
          {emotions.map((em) => (
            <button
              key={em.label}
              onClick={() => handleSearch(em.label)}
              className={`px-8 py-3 rounded-full border border-sc-border bg-sc-hover text-sc-text hover:bg-sc-border transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${em.label === 'Zen' ? em.color : ''}`}
            >
              {em.label}
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
               <p className="text-sc-muted font-medium tracking-widest uppercase text-sm">Aligning Frequencies...</p>
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
  );
}
