import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  MoreVertical,
  Search,
  Edit,
  X,
  User,
  Trash2,
  Loader,
  ChevronRight,
} from "lucide-react";
import { toggleChat, setAiSuggestion } from "../store/slices/chatSlice";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";
import toast from "react-hot-toast";

// ── New Synapse Modal (User Search) ───────────────────────────────────────────
function NewSynapseModal({ onClose, onSelectContact }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(res.data.data.users || []);
    } catch {
      toast.error("Search signal lost");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const glassStyle = {
    background: "rgba(8,19,41,0.85)",
    backdropFilter: "blur(30px)",
    border: "1px solid rgba(172,138,255,0.20)",
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center px-4"
      style={{
        background: "rgba(2, 6, 23, 0.85)",
        backdropFilter: "blur(12px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl animate-fade-in flex flex-col gap-6 min-h-[400px]"
        style={glassStyle}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">New Synapse</h3>
            <p className="text-xs text-sc-muted mt-0.5">
              Search the neural network
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sc-muted hover:text-white transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none z-10"
            size={16}
          />
          <input
            autoFocus
            type="text"
            placeholder="Enter username or display name..."
            className="sc-input text-sm"
            style={{ paddingLeft: "2.5rem" }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {searching ? (
            <div className="text-center py-6 text-sc-muted animate-pulse text-sm">
              Scanning network...
            </div>
          ) : results.length === 0 && query ? (
            <div className="text-center py-6 text-sc-muted text-sm">
              No users found on this frequency.
            </div>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onSelectContact({
                    _id: u.id,
                    displayName: u.displayName,
                    username: u.username,
                    avatarUrl: u.avatarUrl,
                    lastMessage: "New connection...",
                    timestamp: new Date().toISOString(),
                  });
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-sc-hover overflow-hidden flex-shrink-0 flex items-center justify-center font-bold">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    u.displayName?.[0]
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{u.displayName}</p>
                  <p className="text-xs text-sc-muted">@{u.username}</p>
                </div>
                <ChevronRight size={14} className="ml-auto text-sc-muted" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Three-Dots Menu ───────────────────────────────────────────────────────────
function ContactMenu({ onClose, onPurge, onViewProfile }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-[3000] border border-white/10 bg-[#0 board-bg]/95 backdrop-blur-2xl"
      style={{ background: "rgba(8,19,41,0.98)" }}
    >
      <button
        onClick={onViewProfile}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-colors text-sc-text text-left"
      >
        <User size={15} className="text-sc-cyan" />
        View Identity
      </button>
      <div className="h-px bg-white/10" />
      <button
        onClick={onPurge}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-500/15 transition-colors text-red-400 text-left"
      >
        <Trash2 size={15} />
        Purge Transmission
      </button>
    </div>
  );
}

// ── Main Messages Page ────────────────────────────────────────────────────────
export default function Messages() {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewSynapse, setShowNewSynapse] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [assistLoading, setAssistLoading] = useState(false);

  // ── Fetch initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const [msgRes, connectRes] = await Promise.all([
          api.get("/interactions/messages", { signal: controller.signal }),
          api.get("/users/connects", { signal: controller.signal }),
        ]);
        const allMessages = msgRes.data.data.messages || [];
        const connects = connectRes.data.data.users || [];

        setMessages(allMessages);

        const contactMap = new Map();
        connects.forEach((c) => {
          contactMap.set(c.id || c._id, {
            ...c,
            _id: c.id || c._id,
            lastMessage: "Initiate connection...",
            timestamp: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
          });
        });

        allMessages.forEach((msg) => {
          const otherUser =
            msg.senderId?._id === currentUser.id
              ? msg.receiverId
              : msg.senderId;
          if (!otherUser) return;
          const mapKey = otherUser._id || otherUser.id;
          const existing = contactMap.get(mapKey);
          if (
            !existing ||
            new Date(existing.timestamp) <= new Date(msg.createdAt)
          ) {
            contactMap.set(mapKey, {
              ...otherUser,
              _id: mapKey,
              lastMessage: msg.content,
              timestamp: msg.createdAt,
            });
          }
        });

        const contactList = Array.from(contactMap.values()).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );
        setContacts(contactList);
        if (contactList.length > 0)
          setActiveContact((prev) => prev || contactList[0]);
      } catch (err) {
        if (err.code !== "ERR_CANCELED" && err.name !== "CanceledError") {
          console.error("Failed to fetch messages/connects", err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [currentUser.id]);

  // ── Socket.io real-time listener ────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const handleNewMessage = ({ message }) => {
      // Add to messages list
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [message, ...prev];
      });

      // Update contact list last message
      const sender = message.senderId;
      const senderId = sender?._id || sender?.id;
      if (senderId && senderId !== currentUser.id) {
        setContacts((prev) =>
          prev.map((c) =>
            c._id === senderId
              ? {
                  ...c,
                  lastMessage: message.content,
                  timestamp: message.createdAt,
                }
              : c,
          ),
        );
      }
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [currentUser.id]);

  // ── Auto-scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContact]);

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact || isSending) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic = {
      _id: optimisticId,
      content: inputText,
      senderId: { _id: currentUser.id },
      receiverId: { _id: activeContact._id },
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [optimistic, ...prev]);
    setInputText("");
    setIsSending(true);

    try {
      const res = await api.post("/interactions/messages", {
        receiverId: activeContact._id,
        content: optimistic.content,
      });
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m._id === optimisticId ? res.data.data.message : m)),
      );
      // Update contact last message
      setContacts((prev) =>
        prev.map((c) =>
          c._id === activeContact._id
            ? {
                ...c,
                lastMessage: optimistic.content,
                timestamp: new Date().toISOString(),
              }
            : c,
        ),
      );
    } catch (err) {
      toast.error("Transmission failed");
      // Remove optimistic on error
      setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  };

  // ── Quick Assist (AI vibe analysis) ─────────────────────────────────────────
  const handleQuickAssist = async () => {
    if (assistLoading || !activeContact) return;
    setAssistLoading(true);

    const recentMessages = currentChatMessages.slice(-3).map((m) => ({
      role: m.senderId?._id === currentUser.id ? "user" : "assistant",
      content: m.content,
    }));

    const contextPrompt =
      recentMessages.length > 0
        ? `Conversation with ${activeContact.displayName}. Recent history:\n${recentMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}\n\nSuggest a witty, sentient-style reply for me to send (keep it under 50 words):`
        : `Suggest a clever opening message to ${activeContact.displayName} (sentient, futuristic style, under 40 words):`;

    try {
      const res = await api.post("/ai/chat", {
        message: contextPrompt,
        context: {
          display_name: currentUser.displayName || currentUser.username,
          username: currentUser.username,
          email: currentUser.email,
          bio: currentUser.bio,
          currentPath: window.location.pathname,
          active_contact: activeContact.displayName,
        },
      });

      const suggestion = res.data.data.response;

      // Relocate to ARIA Widget
      dispatch(setAiSuggestion(suggestion));
      dispatch(toggleChat(true));
      toast.success("AI suggestion relocated to Quick Chat ✨");
    } catch {
      toast.error("AI assist unavailable");
    } finally {
      setAssistLoading(false);
    }
  };

  // ── Purge conversation ───────────────────────────────────────────────────────
  const handlePurge = async () => {
    if (!activeContact) return;
    setShowMenu(false);
    try {
      await api.delete(`/interactions/messages/${activeContact._id}`);
      setMessages((prev) =>
        prev.filter(
          (m) =>
            !(
              (m.senderId?._id === currentUser.id &&
                m.receiverId?._id === activeContact._id) ||
              (m.receiverId?._id === currentUser.id &&
                m.senderId?._id === activeContact._id)
            ),
        ),
      );
      toast.success("Transmission purged");
    } catch {
      toast.error("Failed to purge transmission");
    }
  };

  // ── Add contact from New Synapse ─────────────────────────────────────────────
  const handleSelectContact = (contact) => {
    if (!contacts.find((c) => c._id === contact._id)) {
      setContacts((prev) => [contact, ...prev]);
    }
    setActiveContact(contact);
  };

  // ── Filter current chat ──────────────────────────────────────────────────────
  const currentChatMessages = messages
    .filter((m) => {
      const sendId = m.senderId?._id || m.senderId;
      const recvId = m.receiverId?._id || m.receiverId;
      return (
        (sendId === currentUser.id && recvId === activeContact?._id) ||
        (recvId === currentUser.id && sendId === activeContact?._id)
      );
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <>
      {showNewSynapse && (
        <NewSynapseModal
          onClose={() => setShowNewSynapse(false)}
          onSelectContact={handleSelectContact}
        />
      )}

      <div className="flex h-full w-full overflow-hidden">
        {/* CONTACTS SIDEBAR */}
        <div className="w-[300px] flex-shrink-0 bg-[#081329]/80 flex flex-col border-r border-white/5">
          <div className="p-5 flex justify-between items-center border-b border-white/5 bg-[#142449]/30 backdrop-blur-md">
            <h2 className="text-lg font-extrabold tracking-tight">
              Active Synapses
            </h2>
            <button
              onClick={() => setShowNewSynapse(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-sc-muted hover:text-white"
              title="New Synapse"
            >
              <Edit size={17} />
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sc-muted"
                size={15}
              />
              <input
                type="text"
                placeholder="Search connections..."
                className="w-full bg-[#142449]/30 rounded-xl pl-9 pr-4 py-2 outline-none focus:bg-[#142449]/60 transition-colors text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-32 animate-pulse text-sc-muted text-xs uppercase tracking-widest gap-2">
                <Sparkles className="text-sc-accent-light" size={14} />{" "}
                Syncing...
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center p-6 text-sc-muted text-xs mt-4">
                No connections yet. Click <Edit size={12} className="inline" />{" "}
                to start a new synapse!
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c._id}
                  onClick={() => setActiveContact(c)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-colors relative ${activeContact?._id === c._id ? "bg-[#142449]/50" : "hover:bg-white/5"}`}
                >
                  {activeContact?._id === c._id && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sc-accent shadow-[0_0_8px_rgba(172,138,255,0.6)]" />
                  )}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-sc-hover flex items-center justify-center font-bold text-sm">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        c.displayName?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-bold text-sm truncate">
                        {c.displayName}
                      </h4>
                      <span className="text-[10px] text-sc-muted whitespace-nowrap ml-2">
                        {new Date(c.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-sc-muted truncate">
                      {c.lastMessage}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN CHAT PANEL */}
        <div className="flex-1 flex flex-col bg-[#060e20]/40 overflow-hidden">
          {activeContact ? (
            <div
              key={activeContact._id}
              className="flex flex-col h-full animate-fade-in"
            >
              {/* Chat Banner */}
              <div className="flex-shrink-0 px-6 py-4 bg-[#081329]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center font-bold overflow-hidden">
                    {activeContact.avatarUrl ? (
                      <img
                        src={activeContact.avatarUrl}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      activeContact.displayName?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold leading-none">
                      {activeContact.displayName}
                    </h3>
                    <p className="text-[11px] text-sc-accent-light uppercase tracking-widest font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sc-accent-light animate-pulse" />
                      Synchronized
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setShowMenu((v) => !v)}
                    className="p-2 hover:bg-white/10 rounded-xl transition text-sc-muted hover:text-white"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {showMenu && (
                    <ContactMenu
                      onClose={() => setShowMenu(false)}
                      onPurge={handlePurge}
                      onViewProfile={() => {
                        setShowMenu(false);
                        navigate(`/profile/${activeContact._id}`);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-[#081329] rounded-full text-[10px] uppercase font-bold tracking-widest text-sc-muted">
                    Synchronization Epoch · Today
                  </span>
                </div>

                {currentChatMessages.map((msg) => {
                  const senderId = msg.senderId?._id || msg.senderId;
                  const isMe = senderId === currentUser.id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col max-w-[75%] ${isMe ? "self-end" : "self-start"} ${msg.optimistic ? "opacity-60" : ""}`}
                    >
                      <div
                        className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl ${isMe ? "bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white rounded-br-sm shadow-[0_4px_15px_rgba(124,58,237,0.3)]" : "bg-[#142449] text-sc-text rounded-bl-sm shadow-[0_4px_15px_rgba(0,0,0,0.2)]"}`}
                      >
                        {msg.content}
                      </div>
                      <span
                        className={`text-[10px] mt-1 text-sc-muted font-bold ${isMe ? "self-end" : "self-start"}`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {msg.optimistic && " · Sending..."}
                      </span>
                    </div>
                  );
                })}

                {currentChatMessages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center py-20 text-center">
                    <div>
                      <Sparkles
                        className="text-sc-accent/30 mx-auto mb-3"
                        size={32}
                      />
                      <p className="text-sc-muted text-sm">
                        Start the transmission with{" "}
                        <strong>{activeContact.displayName}</strong>
                      </p>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Bar */}
              <div className="flex-shrink-0 p-4 bg-[#081329]/80 backdrop-blur-md border-t border-white/5">
                <form
                  onSubmit={handleSend}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Transmit signal..."
                    className="w-full bg-[#142449]/50 rounded-full pl-6 pr-14 py-3.5 outline-none focus:bg-[#142449] transition-colors focus:shadow-[0_0_15px_rgba(172,138,255,0.15)] text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="absolute right-2 w-10 h-10 rounded-full bg-sc-accent flex items-center justify-center text-white disabled:opacity-40 transition-all hover:shadow-glow-sm"
                  >
                    {isSending ? (
                      <Loader size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} className="relative left-[1px]" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 rounded-full bg-[#081329] flex items-center justify-center mb-6 shadow-glow">
                <Sparkles className="text-sc-accent opacity-40" size={40} />
              </div>
              <h2 className="text-3xl font-extrabold mb-2">Awaiting Signal</h2>
              <p className="text-sc-muted text-sm max-w-sm mb-6">
                Select a connection or click the pencil icon to open a new
                neural channel.
              </p>
              <button
                onClick={() => setShowNewSynapse(true)}
                className="gradient-btn px-6 py-2.5 flex items-center gap-2 shadow-glow-pink"
              >
                <Edit size={16} /> New Synapse
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
