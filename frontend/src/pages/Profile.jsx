import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Settings,
  Grid,
  Activity,
  Award,
  X,
  Edit3,
  Bell,
  Lock,
  Trash2,
  ChevronRight,
  Save,
  Loader,
  CheckCircle,
  User,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import api from "../services/api";
import PostCard from "../components/feed/PostCard";
import RightPanel from "../components/layout/RightPanel";
import { fetchProfile } from "../store/slices/authSlice";

const COLORS = ["#ec4899", "#7c3aed", "#06b6d4", "#eab308", "#8b5cf6"];

// ── Toast helper ─────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl text-white animate-fade-in"
      style={{
        background:
          type === "error"
            ? "linear-gradient(135deg,#ef4444,#b91c1c)"
            : "linear-gradient(135deg,#7c3aed,#06b6d4)",
      }}
    >
      <CheckCircle size={16} />
      {message}
    </div>
  );
}

// ── Identity Edit Modal ───────────────────────────────────────────────────────
function IdentityModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    displayName: profile.displayName || "",
    username: profile.username || "",
    email: profile.email || "",
    bio: profile.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.put("/users/update", form);
      onSaved(res.data.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed. Try again.");
      setSaving(false);
    }
  };

  const glassStyle = {
    background: "rgba(8,19,41,0.60)",
    backdropFilter: "blur(30px)",
    border: "1px solid rgba(172,138,255,0.20)",
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4"
      style={{
        background: "rgba(2, 6, 23, 0.85)",
        backdropFilter: "blur(12px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl animate-fade-in flex flex-col gap-6 min-h-[400px]"
        style={glassStyle}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sc-muted hover:text-white transition p-1"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-sc-accent/15">
            <Edit3 size={18} className="text-sc-accent-light" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none">Edit Identity</h3>
            <p className="text-xs text-sc-muted mt-1">
              Reconfigure your neural signature
            </p>
          </div>
        </div>

        {error && (
          <div
            className="mb-4 px-4 py-2.5 rounded-xl text-sm text-red-400"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-sc-muted mb-2 block">
              Display Name
            </label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="sc-input text-sm px-4"
              placeholder="Your display name"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-sc-muted mb-2 block">
              Username
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-sc-muted text-sm select-none pointer-events-none">
                @
              </span>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="sc-input text-sm pl-10"
                placeholder="username"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-sc-muted mb-1.5 block">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="sc-input text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-sc-muted mb-1.5 block">
              Bio
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              maxLength={250}
              className="sc-input text-sm resize-none"
              placeholder="Describe your neural signature..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="gradient-btn w-full py-3 text-sm flex items-center justify-center gap-2 mt-1"
          >
            {saving ? (
              <>
                <Loader size={16} className="animate-spin" /> Syncing
                Identity...
              </>
            ) : (
              <>
                <Save size={16} /> Update Identity
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Settings Drawer ───────────────────────────────────────────────────────────
function SettingsDrawer({ profile, onClose, onUpdate }) {
  const dispatch = useDispatch();
  // Initialize from persisted DB settings so state survives refreshes
  const [notifsEnabled, setNotifsEnabled] = useState(
    profile.settings?.notifications ?? true,
  );
  const [privateMode, setPrivateMode] = useState(
    profile.settings?.isPrivate ?? profile.isPrivate ?? false,
  );
  const [aiInsights, setAiInsights] = useState(
    profile.settings?.aiInsights ?? true,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const drawerStyle = {
    background: "rgba(2, 6, 23, 0.99)", // Forced solid-like slate-950
    backdropFilter: "blur(80px)", // backdrop-blur-3xl equivalent
    borderLeft: "1px solid rgba(172,138,255,0.15)",
  };

  const handleSettingsUpdate = async (updates) => {
    try {
      await api.patch("/users/settings", updates);
      if (updates.isPrivate !== undefined) {
        setPrivateMode(updates.isPrivate);
        onUpdate(updates);
      }
      if (updates.notifications !== undefined)
        setNotifsEnabled(updates.notifications);
      if (updates.aiInsights !== undefined) setAiInsights(updates.aiInsights);
    } catch {
      // Silent fail — local state already updated optimistically
    }
  };

  const handlePrivateToggle = (val) => {
    handleSettingsUpdate({ isPrivate: val });
  };

  const Toggle = ({
    value,
    onChange,
    label,
    description,
    icon: Icon,
    iconClass,
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-sc-hover ${iconClass}`}>
          <Icon size={15} />
        </div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {description && (
            <p className="text-[11px] text-sc-muted mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${value ? "bg-sc-accent" : "bg-sc-hover"}`}
        aria-label={label}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-300 ${value ? "translate-x-4" : "translate-x-1"}`}
        />
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[1000]"
      style={{ background: "rgba(6,14,32,0.50)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute top-0 right-0 h-full w-full max-w-[360px] flex flex-col shadow-2xl transition-transform duration-300 animate-slide-in-right"
        style={drawerStyle}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sc-accent/15">
              <Settings size={16} className="text-sc-accent-light" />
            </div>
            <div>
              <h2 className="font-bold text-base">Neural Settings</h2>
              <p className="text-[11px] text-sc-muted">Configure your node</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sc-muted hover:text-white transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Section: Privacy */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-sc-muted mb-3">
            Privacy
          </p>
          <div
            className="rounded-xl overflow-hidden mb-6"
            style={{ background: "rgba(20,36,73,0.35)" }}
          >
            <div className="px-4">
              <Toggle
                value={privateMode}
                onChange={handlePrivateToggle}
                label="Private Mode"
                description="Only followers see your signals"
                icon={Lock}
                iconClass="text-sc-pink"
              />
            </div>
          </div>

          {/* Section: Notifications */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-sc-muted mb-3">
            Notifications
          </p>
          <div
            className="rounded-xl overflow-hidden mb-6"
            style={{ background: "rgba(20,36,73,0.35)" }}
          >
            <div className="px-4">
              <Toggle
                value={notifsEnabled}
                onChange={(val) => handleSettingsUpdate({ notifications: val })}
                label="Neural Notifications"
                description="Receive alerts when your signals resonate"
                icon={Bell}
                iconClass="text-sc-cyan"
              />
              <Toggle
                value={aiInsights}
                onChange={(val) => handleSettingsUpdate({ aiInsights: val })}
                label="AI Insights"
                description="Weekly neural pattern analysis"
                icon={Activity}
                iconClass="text-sc-accent-light"
              />
            </div>
          </div>

          {/* Section: Danger Zone */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-sc-muted mb-3">
            Danger Zone
          </p>
          <div
            className="rounded-xl p-4 mb-6"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Trash2 size={15} />
                  <span>Terminate Account</span>
                </div>
                <ChevronRight size={15} />
              </button>
            ) : (
              <div>
                <p className="text-xs text-red-400 mb-3">
                  This will permanently erase your neural signature from the
                  network. This is irreversible.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 text-xs rounded-lg bg-sc-hover text-sc-muted hover:text-sc-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 py-2 text-xs rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors">
                    Terminate (Demo)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-white/8">
          <p className="text-[10px] text-sc-muted text-center">
            SwiftChat Neural OS v1.0 · All settings are synced locally
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showSettings, setShowSettings] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [toast, setToast] = useState(null);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const controller = new AbortController();
    const fetchProfileData = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${id}`, { signal: controller.signal }),
          api.get(`/users/${id}/posts`, { signal: controller.signal }),
        ]);

        setProfile(profileRes.data.data.user);
        setPosts(
          Array.isArray(postsRes.data.data)
            ? postsRes.data.data
            : postsRes.data.data?.posts || [],
        );
      } catch (err) {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          console.error("Failed to sync profile", err);
        }
      }
    };
    fetchProfileData();
    return () => controller.abort();
  }, [id]);

  const handleIdentitySaved = (updatedUser) => {
    setProfile((prev) => ({ ...prev, ...updatedUser }));
    dispatch(fetchProfile());
    setShowIdentityModal(false);
    setToast({ message: "Identity matrix updated!", type: "success" });
  };

  const handleProfileUpdate = (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    if (updates.isPrivate !== undefined) {
      setToast({
        message: `Private Mode ${updates.isPrivate ? "Enabled" : "Disabled"}`,
        type: "success",
      });
    }
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) =>
      prev.filter((p) => (p.id || p._id?.toString()) !== postId),
    );
  };

  if (!profile)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 rounded-full bg-sc-accent/20 mx-auto mb-3 animate-ping" />
          <p className="text-sc-muted text-sm">Syncing profile matrix...</p>
        </div>
      </div>
    );

  const mockAnalyticsData = [
    { name: "Vibrant", value: 45 },
    { name: "Deep", value: 30 },
    { name: "Ethereal", value: 15 },
    { name: "Nostalgic", value: 10 },
  ];

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
      {showSettings && (
        <SettingsDrawer
          profile={profile}
          onClose={() => setShowSettings(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
      {showIdentityModal && (
        <IdentityModal
          profile={profile}
          onClose={() => setShowIdentityModal(false)}
          onSaved={handleIdentitySaved}
        />
      )}

      <div className="flex flex-col min-h-full">
        {/* Glass Header with Fade-Mask */}
        <div className="glass-header px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors transition-transform active:scale-95"
          >
            <ArrowLeft size={20} className="text-sc-accent-light" />
          </button>
          <div>
            <h2 className="text-xl font-black tracking-tight leading-none">
              {profile.displayName}
            </h2>
            <p className="text-[10px] text-sc-muted uppercase tracking-widest font-bold mt-1">
              Node Identity · {profile._count.posts} Signals
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-6 py-6">
          {/* Profile Header Block */}
          <div className="glass-card mb-8 overflow-hidden relative border border-white/5 shadow-glow">
            {/* Cover Photo Area */}
            <div className="h-48 w-full bg-gradient-to-r from-sc-surface via-sc-card to-sc-hover relative">
              <div className="absolute inset-0 bg-sc-accent opacity-20 blur-[50px]"></div>
            </div>

            {/* User Info Area */}
            <div className="px-8 pb-8 pt-0 relative">
              {/* Avatar & Action Button Row */}
              <div className="flex justify-between items-end -mt-16 mb-8 relative z-10">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-sc-hover overflow-hidden shadow-glow-sm ring-4 ring-sc-bg transition-transform hover:scale-[1.02]">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black bg-gradient-accent text-white">
                      {profile.username[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pb-2">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setShowSettings(true)}
                      className="p-3 rounded-xl bg-sc-surface/80 border border-white/5 hover:bg-sc-hover transition-all text-sc-text shadow-glow-sm"
                      title="Neural Settings"
                    >
                      <Settings size={20} />
                    </button>
                  ) : (
                    <button
                      disabled={profile.isSyncing}
                      onClick={async () => {
                        try {
                          setProfile((prev) => ({ ...prev, isSyncing: true }));
                          const res = await api.post(
                            `/users/follow/${profile.id || profile._id}`,
                          );
                          setProfile((prev) => ({
                            ...prev,
                            isFollowing: res.data.data.following,
                            isSyncing: false,
                            _count: {
                              ...prev._count,
                              followers: res.data.data.following
                                ? prev._count.followers + 1
                                : prev._count.followers - 1,
                            },
                          }));
                          setToast({
                            message: res.data.message,
                            type: "success",
                          });
                        } catch (err) {
                          setProfile((prev) => ({ ...prev, isSyncing: false }));
                          setToast({
                            message: "Neural Sync Failed",
                            type: "error",
                          });
                        }
                      }}
                      className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-glow-sm min-w-[140px] ${profile.isFollowing ? "bg-sc-hover border border-white/10 text-sc-accent-light" : "gradient-btn shadow-glow-pink text-white"}`}
                    >
                      {profile.isSyncing
                        ? "Establishing..."
                        : profile.isFollowing
                          ? "Synchronized"
                          : "Follow Context"}
                    </button>
                  )}
                </div>
              </div>

              {/* Identity Info - Aggressive Flexbox Spacing */}
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex items-center flex-wrap gap-4 mb-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-2">
                      {profile.displayName}
                      <Award size={24} className="text-sc-cyan" />
                      {isOwnProfile && (
                        <button
                          onClick={() => setShowIdentityModal(true)}
                          className="p-1.5 rounded-lg hover:bg-sc-hover transition-colors text-sc-muted hover:text-sc-accent-light"
                          title="Edit Identity"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}
                    </h1>

                    {profile.isPrivate && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-sc-pink/10 text-sc-pink rounded-full border border-sc-pink/20 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15_rgba(236,72,153,0.1)]">
                        <Lock size={10} /> Private Node
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-sc-accent-light font-bold text-xl tracking-tight">
                      @{profile.username}
                    </p>
                    <p className="text-sc-muted text-sm flex items-center gap-2 font-medium">
                      <Mail size={14} className="opacity-50" /> {profile.email}
                    </p>
                  </div>
                </div>

                <p className="text-base md:text-lg text-sc-text/90 max-w-2xl leading-relaxed italic border-l-2 border-sc-accent/30 pl-6 py-1">
                  {profile.bio ||
                    "Entity traversing the emotional matrix. Finding connections in the raw data stream."}
                </p>

                <div className="flex items-center flex-wrap gap-8 py-2">
                  <div className="flex gap-2 items-baseline">
                    <span className="font-bold text-2xl">
                      {profile._count?.followers ?? 0}
                    </span>
                    <span className="text-sc-muted font-bold text-sm uppercase tracking-widest">
                      Followers
                    </span>
                  </div>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-bold text-2xl">
                      {profile._count?.following ?? 0}
                    </span>
                    <span className="text-sc-muted font-bold text-sm uppercase tracking-widest">
                      Following
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-sc-hover rounded-full border border-white/5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sc-cyan animate-pulse"></span>
                    <span className="text-xs text-sc-cyan font-extrabold uppercase tracking-widest">
                      {profile.emotionVibe || "Establishing..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="flex mb-8 bg-[#081329] rounded-xl overflow-hidden p-1 shadow-glow-sm">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-3 text-center font-bold text-sm tracking-wider uppercase transition-all flex justify-center items-center gap-2 rounded-lg ${activeTab === "posts" ? "text-sc-accent-light bg-sc-accent/10 shadow-[0_0_15px_rgba(172,138,255,0.2)]" : "text-sc-muted hover:bg-white/5"}`}
            >
              <Grid size={18} /> Posts
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-3 text-center font-bold text-sm tracking-wider uppercase transition-all flex justify-center items-center gap-2 rounded-lg ${activeTab === "analytics" ? "text-sc-pink bg-sc-pink/10 shadow-[0_0_15px_rgba(236,72,153,0.2)]" : "text-sc-muted hover:bg-white/5"}`}
            >
              <Activity size={18} /> AI Insights
            </button>
          </div>

          {/* Tab Content */}
          <div className="w-full">
            {activeTab === "posts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post.id || post._id}
                      post={post}
                      onDelete={handlePostDelete}
                    />
                  ))
                ) : (
                  <div className="col-span-1 md:col-span-2 text-center py-20">
                    <p className="text-xs text-sc-muted italic tracking-wider mb-1">
                      — Neural Silence —
                    </p>
                    <p className="text-sc-muted text-sm">
                      No signals transmitted in this cycle.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="w-full animate-fade-in flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2 glass-card p-6 shadow-glow">
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
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#13152a",
                            borderColor: "#1e2140",
                            borderRadius: "12px",
                          }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="w-full md:w-1/2 flex flex-col gap-4">
                  {mockAnalyticsData.map((data, index) => (
                    <div
                      key={data.name}
                      className="glass-card p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <span className="font-bold">{data.name}</span>
                      </div>
                      <span className="text-sc-muted">
                        {data.value}% presence
                      </span>
                    </div>
                  ))}
                  <div className="mt-4 p-4 rounded-xl bg-sc-hover text-sm text-sc-muted leading-relaxed">
                    <strong className="text-sc-accent-light">
                      AI Observation:
                    </strong>{" "}
                    Your recent activity strongly resonates with Vibrant
                    frequencies. Consider connecting with users in the trending
                    #EuphoricRhythms stream.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
