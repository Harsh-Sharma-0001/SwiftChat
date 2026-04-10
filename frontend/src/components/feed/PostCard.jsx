import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, MessageSquare, Share2, Sparkles, MoreHorizontal } from 'lucide-react';
import { toggleLike } from '../../store/slices/feedSlice';
import { formatDistanceToNow } from '../../utils/formatters';

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    dispatch(toggleLike(post.id));
  };

  const getMoodColor = (mood) => {
    switch (mood?.toLowerCase()) {
      case 'vibrant': return 'mood-vibrant text-sc-pink';
      case 'deep': return 'mood-deep text-purple-400';
      case 'ethereal': return 'mood-ethereal text-sc-cyan';
      default: return 'bg-sc-hover text-sc-muted border border-sc-border';
    }
  };

  return (
    <div className="post-card group">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sc-hover border border-sc-border overflow-hidden">
            {post.user?.avatarUrl ? (
              <img src={post.user.avatarUrl} alt={post.user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-lg">
                {post.user?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sc-text hover:underline cursor-pointer">{post.user?.displayName}</span>
              {post.emotion && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getMoodColor(post.emotion)}`}>
                  {post.emotion}
                </span>
              )}
            </div>
            <div className="flex flex-col text-xs text-sc-muted">
              <span>@{post.user?.username} • {formatDistanceToNow(new Date(post.createdAt))}</span>
            </div>
          </div>
        </div>
        <button className="text-sc-muted hover:text-white p-2">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {post.caption && <p className="text-sm text-sc-text mb-3 leading-relaxed">{post.caption}</p>}
        {post.mediaUrl && (
          <div className="w-full rounded-xl overflow-hidden bg-sc-hover border border-sc-border mb-3 max-h-[500px]">
            {post.mediaType === 'video' ? (
              <video src={post.mediaUrl} controls className="w-full object-contain max-h-[500px]" />
            ) : (
              <img src={post.mediaUrl} alt="Post media" className="w-full object-cover max-h-[500px] hover:scale-105 transition-transform duration-500" />
            )}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-sc-border/50">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${isLiked ? 'text-sc-pink' : 'text-sc-muted hover:text-sc-pink'}`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "animate-pulse" : ""} />
            <span>{likeCount >= 1000 ? (likeCount / 1000).toFixed(1) + 'k' : likeCount}</span>
          </button>
          
          <button className="flex items-center gap-2 text-sm font-medium text-sc-muted hover:text-sc-accent-light transition-colors">
            <MessageSquare size={18} />
            <span>{post._count?.comments || 0}</span>
          </button>

          <button className="flex items-center gap-2 text-sm font-medium text-sc-muted hover:text-sc-cyan transition-colors">
            <Share2 size={18} />
          </button>
        </div>

        {/* AI Generator Badge */}
        {post.caption?.includes('✨') || post.emotion ? (
           <div className="flex items-center gap-1.5 px-3 py-1 bg-sc-hover rounded-full border border-sc-border text-xs text-sc-muted">
             <Sparkles size={12} className="text-sc-accent" />
             AI Assisted
           </div>
        ) : null}
      </div>
    </div>
  );
}
