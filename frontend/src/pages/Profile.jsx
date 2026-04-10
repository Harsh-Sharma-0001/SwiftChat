import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Settings, Grid, Activity, Award } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../services/api';
import PostCard from '../components/feed/PostCard';

const COLORS = ['#ec4899', '#7c3aed', '#06b6d4', '#eab308', '#8b5cf6'];

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useSelector(state => state.auth);
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // posts | analytics
  
  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const controller = new AbortController();
    const fetchProfileData = async () => {
      try {
        // In a real scenario, this would be a specific user fetch endpoint.
        // For MVP, we'll fetch the authorized User if it's their ID, else mock it.
        if (isOwnProfile) {
          setProfile(currentUser);
          const postsRes = await api.get('/posts/feed', { signal: controller.signal }); // Mocking user posts with feed
          setPosts(postsRes.data.data);
        } else {
          // Mock external user
          setProfile({ id, username: 'neural_surfer', displayName: 'Neural Surfer', followers: 1204, following: 432, emotionVibe: 'Resonant', bio: "Riding the sentient stream." });
          setPosts([]);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error(err);
        }
      }
    };
    fetchProfileData();
    return () => {
      controller.abort();
    };
  }, [id, currentUser, isOwnProfile]);

  if (!profile) return <div className="p-8 text-center animate-pulse">Syncing profile data...</div>;

  const mockAnalyticsData = [
    { name: 'Vibrant', value: 45 },
    { name: 'Deep', value: 30 },
    { name: 'Ethereal', value: 15 },
    { name: 'Nostalgic', value: 10 },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full max-w-4xl mx-auto px-4 py-8">
      
      {/* Profile Header Block */}
      <div className="glass-card mb-8 overflow-hidden relative border-sc-border">
        {/* Cover Photo Area with gradient mix */}
        <div className="h-48 w-full bg-gradient-to-r from-sc-surface via-sc-card to-sc-hover relative">
          <div className="absolute inset-0 bg-sc-accent opacity-20 blur-[50px]"></div>
          {isOwnProfile && (
            <button className="absolute top-4 right-4 bg-sc-bg/50 p-2 rounded-full hover:bg-sc-bg transition backdrop-blur">
               <Settings size={18} />
            </button>
          )}
        </div>

        {/* User Info Area */}
        <div className="px-8 pb-8 pt-0 relative">
          <div className="flex justify-between items-end -mt-16 mb-4 relative z-10">
             <div className="w-32 h-32 rounded-3xl bg-sc-hover border-4 border-sc-bg overflow-hidden shadow-glow-sm">
               {profile.avatarUrl ? (
                 <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-4xl font-black bg-gradient-accent text-white">
                   {profile.username[0].toUpperCase()}
                 </div>
               )}
             </div>
             
             {!isOwnProfile && (
               <button className="gradient-btn px-6 py-2 shadow-glow-pink">Follow Context</button>
             )}
          </div>

          <div>
             <h1 className="text-3xl font-extrabold flex items-center gap-2">
               {profile.displayName} 
               <Award size={20} className="text-sc-cyan" />
             </h1>
             <p className="text-sc-muted font-medium mb-3">@{profile.username}</p>
             <p className="text-sm max-w-lg mb-6 leading-relaxed">
               {profile.bio || 'Entity traversing the emotional matrix. Finding connections in the raw data stream.'}
             </p>

             <div className="flex items-center gap-6 text-sm">
               <div className="flex gap-2 items-baseline">
                 <span className="font-bold text-lg">{profile.followers || 1403}</span>
                 <span className="text-sc-muted">Followers</span>
               </div>
               <div className="flex gap-2 items-baseline">
                 <span className="font-bold text-lg">{profile.following || 284}</span>
                 <span className="text-sc-muted">Following</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-sc-hover rounded-full border border-sc-border">
                 <span className="w-2 h-2 rounded-full bg-sc-cyan animate-pulse"></span>
                 <span className="text-xs text-sc-cyan font-bold uppercase tracking-widest">{profile.emotionVibe || 'Establishing...'}</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-sc-border mb-8">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-4 text-center font-bold text-sm tracking-wider uppercase transition-all border-b-2 flex justify-center items-center gap-2 ${activeTab === 'posts' ? 'border-sc-accent text-sc-accent-light bg-sc-accent/5' : 'border-transparent text-sc-muted hover:bg-sc-hover/50'}`}
        >
           <Grid size={18} /> Neural Logs
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-4 text-center font-bold text-sm tracking-wider uppercase transition-all border-b-2 flex justify-center items-center gap-2 ${activeTab === 'analytics' ? 'border-sc-pink text-sc-pink bg-sc-pink/5' : 'border-transparent text-sc-muted hover:bg-sc-hover/50'}`}
        >
           <Activity size={18} /> Sentient Pattern
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="col-span-1 md:col-span-2 text-center py-20 text-sc-muted">
                No logs recorded in the current cycle.
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
           <div className="w-full animate-fade-in flex flex-col md:flex-row gap-6">
             <div className="w-full md:w-1/2 glass-card p-6 border-sc-pink/20">
               <h3 className="font-bold mb-4 flex items-center gap-2">
                 <Activity className="text-sc-pink" size={18} />
                 Emotional Resonance
               </h3>
               <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={mockAnalyticsData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {mockAnalyticsData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#13152a', borderColor: '#1e2140', borderRadius: '12px' }}
                       itemStyle={{ color: '#e2e8f0' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </div>

             <div className="w-full md:w-1/2 flex flex-col gap-4">
               {mockAnalyticsData.map((data, index) => (
                 <div key={data.name} className="glass-card p-4 flex items-center justify-between border-sc-border/50">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                       <span className="font-bold">{data.name}</span>
                    </div>
                    <span className="text-sc-muted">{data.value}% presence</span>
                 </div>
               ))}
               <div className="mt-4 p-4 rounded-xl bg-sc-hover border border-sc-border text-sm text-sc-muted leading-relaxed">
                 <strong className="text-sc-accent-light">AI Observation:</strong> Your recent activity strongly resonates with Vibrant frequencies. Consider connecting with users in the trending #EuphoricRhythms stream.
               </div>
             </div>
           </div>
        )}
      </div>

    </div>
  );
}
