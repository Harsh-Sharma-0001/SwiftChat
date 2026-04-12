import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeed } from '../store/slices/feedSlice';
import PostCard from '../components/feed/PostCard';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function HomeFeed() {
  const dispatch = useDispatch();
  const { posts, status, error } = useSelector((state) => state.feed);

  useEffect(() => {
    const promise = dispatch(fetchFeed(1));
    return () => { promise.abort(); };
  }, [dispatch]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Glass Header with Fade-Mask Physics */}
      <div className="glass-header px-6 pt-8 pb-6">
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter flex items-center gap-3">
          Your Feed <Sparkles size={28} className="text-sc-accent-light" />
        </h2>
        <p className="text-xs text-sc-muted mt-1.5 uppercase tracking-widest font-bold">
          Your personalized algorithmic timeline
        </p>
      </div>

      {/* Feed Content */}
      <div className="flex flex-col gap-4 px-6 py-6">
        {status === 'loading' && posts.length === 0 ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="post-card w-full h-64 skeleton opacity-50"></div>
          ))
        ) : error ? (
          <div className="text-center py-10 bg-red-500/10 rounded-xl text-red-400">
            <p>{error}</p>
            <button
              onClick={() => dispatch(fetchFeed(1))}
              className="mt-4 px-4 py-2 bg-sc-hover rounded-lg hover:bg-sc-card transition flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-20 animate-pulse">
            <div className="w-16 h-16 bg-[#081329] rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Sparkles className="text-sc-accent-light" size={24} />
            </div>
            <h3 className="text-lg font-bold text-sc-accent-light tracking-widest uppercase text-sm">Scanning for Signals</h3>
            <p className="text-sc-muted mt-2 text-sm max-w-xs mx-auto">Calibrating the neural mesh...</p>
          </div>
        )}

        {status === 'succeeded' && posts.length >= 10 && (
          <div className="py-6 text-center text-xs text-sc-accent-light font-medium tracking-widest uppercase animate-pulse">
            Loading more posts...
          </div>
        )}
      </div>
    </div>
  );
}
