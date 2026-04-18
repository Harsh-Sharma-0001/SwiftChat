import { useState, useEffect } from 'react';
import { Sparkles, Activity, Brain, Target, Network } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import api from '../services/api';

export default function AIInsights() {
  const [trending, setTrending] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState({
    flowState: 0,
    neuralLinks: 0,
    resonanceMatch: 'Scanning...',
    stats: { synapses: 0, pulse: 0, uptime: '100%' }
  });

  useEffect(() => {
    const syncData = async () => {
      try {
        const [trendRes, insightsRes, linksRes, matchRes] = await Promise.all([
          api.get('/interactions/trending-emotions').catch(() => ({ data: { data: {} } })),
          api.get('/interactions/insights').catch(() => ({ data: { data: {} } })),
          api.get('/users/neural-links-count').catch(() => ({ data: { data: { count: 0 } } })),
          api.get('/users/resonance-match').catch(() => ({ data: { data: { match: null } } }))
        ]);
        setTrending(trendRes.data?.data?.trending || []);
        const data = insightsRes.data?.data;
        const linksCount = linksRes.data?.data?.count || 0;
        const matchUser = matchRes.data?.data?.match;

        setRadarData(data?.radarData || []);
        setAreaData(data?.areaData || []);
        setInsights({
          flowState: data?.flowState || 0,
          neuralLinks: linksCount,
          resonanceMatch: matchUser ? matchUser.displayName : 'No match',
          resonanceVibe: matchUser ? matchUser.emotionVibe : null,
          stats: data?.stats || { synapses: 0, pulse: 0, uptime: '99.9%' }
        });
      } catch (e) {
        console.error('Failed to sync trending data', e);
      } finally {
        setTimeout(() => setIsLoading(false), 1500);
      }
    };
    syncData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full w-full justify-center items-center flex-col animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center opacity-20 pointer-events-none">
          <svg viewBox="0 0 800 800" className="w-[800px] h-[800px] animate-spin-slow">
             <defs>
               <radialGradient id="meshGlow" cx="50%" cy="50%" r="50%">
                 <stop offset="0%" stopColor="#ac8aff" stopOpacity="1" />
                 <stop offset="100%" stopColor="#081329" stopOpacity="0" />
               </radialGradient>
             </defs>
             <circle cx="400" cy="400" r="300" fill="none" stroke="url(#meshGlow)" strokeWidth="2" strokeDasharray="10 20" />
             <circle cx="400" cy="400" r="200" fill="none" stroke="#ec4899" strokeWidth="1" strokeDasharray="5 10" className="animate-ping" />
             <path d="M 400 100 Q 550 400 400 700 Q 250 400 400 100" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.5"/>
          </svg>
        </div>
        <div className="w-32 h-32 rounded-full bg-[#081329] shadow-[0_0_80px_rgba(172,138,255,0.4)] flex items-center justify-center mb-8 relative z-10 transition-all duration-500 scale-110">
          <div className="absolute inset-0 rounded-full border-2 border-sc-accent animate-spin-slow glow-pulse"></div>
          <Brain className="text-sc-accent-light animate-pulse" size={50} />
        </div>
        <h2 className="text-3xl font-extrabold tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-sc-accent-light to-sc-pink z-10">
          Neural Mesh Synchronizing
        </h2>
        <p className="mt-4 text-sc-muted text-sm max-w-sm text-center z-10 uppercase tracking-widest font-bold">Pooling parameters from the collective cognitive state. Please wait...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Glass Header with Fade-Mask */}
      <div className="glass-header px-6 pt-8 pb-6 text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-sc-accent to-sc-pink rounded-xl flex items-center justify-center mb-4 transform rotate-12 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
          <Brain className="text-white" size={24} />
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter leading-none relative z-10 mix-blend-screen drop-shadow-2xl">
          AI Insights
        </h1>
        <p className="text-sc-muted uppercase tracking-widest font-bold text-[10px] max-w-md mx-auto mt-3">
          Real-time macro analysis of your cognitive footprint
        </p>
      </div>

      <div className="px-6 py-8">
        {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
        <div className="glass-card p-6 shadow-glow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sc-accent opacity-10 rounded-full blur-[50px] group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-[#081329]">
               <Activity className="text-sc-accent-light" size={24} />
            </div>
            <h3 className="font-bold text-lg">Flow State</h3>
          </div>
          <div className="text-4xl font-extrabold text-white">{insights.flowState}%</div>
          <p className="text-sm tracking-wide text-sc-accent-light mt-2 uppercase text-[10px] font-bold">Optimized for Deep Work</p>
        </div>

        <div className="glass-card p-6 shadow-glow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sc-pink opacity-10 rounded-full blur-[50px] group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-[#081329]">
               <Target className="text-sc-pink" size={24} />
            </div>
            <h3 className="font-bold text-lg">Resonance Match</h3>
          </div>
          <div className="text-3xl font-extrabold text-white truncate px-2">{insights.resonanceMatch}</div>
          {insights.resonanceVibe ? (
            <p className="text-sm tracking-wide text-sc-pink mt-2 uppercase text-[10px] font-bold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sc-pink animate-pulse"></span> Shared Vibe: {insights.resonanceVibe}
            </p>
          ) : (
             <p className="text-sm tracking-wide text-sc-muted mt-2 uppercase text-[10px] font-bold flex items-center justify-center gap-1">
               Awaiting Connection
             </p>
          )}
        </div>

        <div className="glass-card p-6 shadow-glow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sc-cyan opacity-10 rounded-full blur-[50px] group-hover:opacity-20 transition-opacity"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-[#081329]">
               <Network className="text-sc-cyan" size={24} />
            </div>
            <h3 className="font-bold text-lg">Neural Links</h3>
          </div>
          <div className="text-4xl font-extrabold text-white">{insights.neuralLinks}</div>
          <p className="text-sm tracking-wide text-sc-cyan mt-2 uppercase text-[10px] font-bold">Active connections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Radar Chart Panel */}
        <div className="glass-card p-6 shadow-glow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-xl">Cognitive State</h3>
            <Sparkles className="text-sc-accent-light" size={20} />
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="User" dataKey="A" stroke="#ac8aff" strokeWidth={2} fill="#ac8aff" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart Panel */}
        <div className="glass-card p-6 shadow-glow flex flex-col">
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-xl">Creative Output vs Load</h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#ac8aff]"><span className="w-2 h-2 rounded-full bg-[#ac8aff]"></span> Output</span>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#ec4899]"><span className="w-2 h-2 rounded-full bg-[#ec4899]"></span> Load</span>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={areaData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ac8aff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ac8aff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#081329', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="Creative Output" stroke="#ac8aff" strokeWidth={3} fillOpacity={1} fill="url(#colorOutput)" />
                  <Area type="monotone" dataKey="Cognitive Load" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
