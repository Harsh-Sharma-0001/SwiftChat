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
    return () => {
      promise.abort();
    };
  }, [dispatch]);

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full max-w-2xl mx-auto px-4 py-8 relative">
      <div className="sticky top-0 z-20 backdrop-blur-md bg-sc-bg/80 pb-4 mb-6 border-b border-sc-border">
        <h2 className="text-2xl font-bold flex items-center gap-2">
           The Stream <Sparkles size={20} className="text-sc-accent-light" />
        </h2>
        <p className="text-sm text-sc-muted mt-1">Your personalized algorithmic timeline</p>
      </div>

      <div className="flex flex-col gap-2">
        {status === 'loading' && posts.length === 0 ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="post-card w-full h-64 skeleton opacity-50 mb-4"></div>
          ))
        ) : error ? (
          <div className="text-center py-10 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <p>{error}</p>
            <button 
              onClick={() => dispatch(fetchFeed(1))}
              className="mt-4 px-4 py-2 bg-sc-hover rounded-lg hover:bg-sc-border transition flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-sc-hover rounded-full flex items-center justify-center mx-auto mb-4 border border-sc-border rotate-12">
              <Sparkles className="text-sc-muted" size={24} />
            </div>
            <h3 className="text-lg font-bold">The void is empty</h3>
            <p className="text-sc-muted mt-2 text-sm max-w-xs mx-auto">Follow creators or manifest an echo yourself to populate the stream.</p>
          </div>
        )}
      </div>
      
      {/* Very Simple AI Loading Indicator at bottom (Mocking infinite scroll) */}
      {status === 'succeeded' && posts.length >= 10 && (
         <div className="py-6 text-center text-xs text-sc-accent-light font-medium tracking-widest uppercase animate-pulse">
           Synchronizing further data...
         </div>
      )}
    </div>
  );
}
