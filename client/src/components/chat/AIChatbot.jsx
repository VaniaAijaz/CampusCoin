import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Bot,
  X,
  Send,
  Minimize2,
  Maximize2,
  RotateCcw,
  Copy,
  Check,
  TrendingUp,
  CreditCard,
  Split,
  GraduationCap,
  ChevronRight,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

/* ─── CampusCoin Design Tokens (matching LandingPage) ─── */
const C = {
  hero: "oklch(0.115 0.018 255)",
  heroSurface: "oklch(0.15 0.022 255)",
  heroFg: "oklch(0.985 0.003 250)",
  heroMuted: "oklch(0.73 0.018 252)",
  heroLine: "oklch(0.28 0.025 255)",
  brand: "oklch(0.59 0.22 262)",
  brandHover: "oklch(0.52 0.23 262)",
  highlight: "oklch(0.88 0.18 157)",
  highlightFg: "oklch(0.17 0.04 160)",
  growth: "oklch(0.64 0.17 157)",
  growthSoft: "oklch(0.94 0.05 158)",
  background: "oklch(0.99 0.003 250)",
  foreground: "oklch(0.16 0.025 260)",
  muted: "oklch(0.5 0.025 255)",
  border: "oklch(0.9 0.012 255)",
  cardOrbit: "oklch(0.61 0.23 290)",
  cardSun: "oklch(0.83 0.17 70)",
};

const MANROPE = { fontFamily: "'Manrope', 'Cabinet Grotesk', ui-sans-serif, system-ui, sans-serif" };

/* ─── CampusCoin BrandMark Component ─── */
function BrandMark({ size = 26, stroke = 5 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
        border: `${stroke}px solid ${C.brand}`,
        borderRightColor: "transparent",
        borderRadius: 999,
        transform: "rotate(-12deg)",
      }}
    >
      {/* Core highlight dot */}
      <span
        style={{
          position: "absolute",
          width: size * 0.23,
          height: size * 0.23,
          borderRadius: 999,
          background: C.highlight,
          left: size * 0.14,
          top: size * 0.14,
        }}
      />
      {/* Growth accent dot */}
      <span
        style={{
          position: "absolute",
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: 999,
          background: C.growth,
          right: -size * 0.18,
          top: -size * 0.14,
        }}
      />
    </span>
  );
}

/* ─── Static Demonstration Messages (Pure UI Only) ─── */
const INITIAL_DEMO_MESSAGES = [
  {
    id: "msg-1",
    role: "assistant",
    content: "Hey! 👋 I'm **CampusCoin AI**. How can I help you manage your student budget?",
    timestamp: "10:30 AM",
  },
  {
    id: "msg-2",
    role: "user",
    content: "How can I save more this month?",
    timestamp: "10:31 AM",
  },
  {
    id: "msg-3",
    role: "assistant",
    content:
      "Let's take a look at your spending and find some easy ways to save:\n\n• **Campus Dining & Café**: Preparing lunch twice a week saves ~$45/month.\n• **Subscriptions**: Review active streaming or music memberships for student discount rates.\n• **Khata Split Bills**: Instantly log shared rent and study trips so you never lose track of reimbursements.\n\nWould you like me to recommend a weekly spending cap?",
    timestamp: "10:31 AM",
  },
];

/* ─── Static Interactive Demonstration Responses (UI Only) ─── */
const MOCK_REPLIES = {
  "How to save more this month?":
    "Here are 3 student-tested saving tips for this semester:\n\n1. **Use the 50/30/20 student rule**: 50% essentials (rent/books), 30% campus life, 20% savings buffer.\n2. **Group Groceries**: Split bulk orders with roommates on CampusCoin Khata.\n3. **Campus Shuttle**: Skip ride shares during peak campus transit hours.",
  "What is CampusCoin?":
    "**CampusCoin** is the modern financial OS built specifically for university life! 🎓\n\nIt combines smart student budgeting, one-tap bill splitting with friends (Khata), real-time spending insights, and zero bank linking hassle.",
  "Check my food budget":
    "📊 **Food & Dining Overview**:\n• Monthly Target: **$250.00**\n• Spent so far: **$142.30** (57%)\n• Safe daily allowance remaining: **$12.50/day**\n\nYou're on pace for a green month! 🥗",
  "How does bill splitting work?":
    "🤝 **CampusCoin Khata** makes splitting effortless:\n\n1. Select transaction or enter amount\n2. Add your roommates or classmates\n3. CampusCoin calculates exact shares and tracks who has settled with zero awkward reminders!",
};

/* ─── Quick Suggestion Chips ─── */
const SUGGESTIONS = [
  { label: "💡 How to save?", prompt: "How to save more this month?", icon: TrendingUp },
  { label: "🎓 What is CampusCoin?", prompt: "What is CampusCoin?", icon: GraduationCap },
  { label: "🍕 Food budget", prompt: "Check my food budget", icon: CreditCard },
  { label: "🤝 Split bills", prompt: "How does bill splitting work?", icon: Split },
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState(INITIAL_DEMO_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [hasUnread, setHasUnread] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on message updates
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom("auto");
      setHasUnread(false);
    }
  }, [isOpen, messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  // Handle Send in UI Mode (Simulated UI demo response, no network calls)
  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: currentTime,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate realistic friendly typing delay (UI visual only)
    setTimeout(() => {
      const replyContent =
        MOCK_REPLIES[text] ||
        `Thanks for asking about "${text}"! 💡\n\nCampusCoin AI analyzes your student habits in real-time to suggest optimized budget limits, smart savings targets, and stress-free spending schedules.`;

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 850);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_DEMO_MESSAGES);
    setIsTyping(false);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div
      style={MANROPE}
      className="fixed z-50 bottom-6 right-4 sm:right-6 pointer-events-none select-none"
    >
      {/* ─── FLOATING CHAT BUTTON ─── */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="pointer-events-auto relative group flex items-center justify-center w-14 h-14 rounded-full cursor-pointer focus:outline-none"
        style={{
          background: isOpen ? C.heroSurface : C.hero,
          border: `1.5px solid ${isOpen ? C.highlight : C.heroLine}`,
          boxShadow: `0 12px 32px -4px rgba(0,0,0,0.5), 0 0 24px ${isOpen ? "oklch(0.88 0.18 157 / 0.35)" : "oklch(0.59 0.22 262 / 0.3)"}`,
        }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.94 }}
        title={isOpen ? "Close CampusCoin AI" : "Open CampusCoin AI Assistant"}
        aria-label="CampusCoin AI Chatbot"
      >
        {/* Soft Animated Glow Halo */}
        <span
          className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle, ${C.brand} 0%, transparent 70%)`,
            filter: "blur(6px)",
          }}
        />

        {/* Dynamic Icon Switch */}
        <div className="relative z-10 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close-icon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <X style={{ width: 22, height: 22, color: C.heroFg }} />
              </motion.div>
            ) : (
              <motion.div
                key="ai-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative flex items-center justify-center"
              >
                <BrandMark size={24} stroke={4.5} />
                <Sparkles
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    width: 12,
                    height: 12,
                    color: C.highlight,
                  }}
                  className="animate-pulse"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Unread Message Notification Dot */}
        {hasUnread && !isOpen && (
          <span
            className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 animate-bounce"
            style={{
              background: C.highlight,
              borderColor: C.hero,
            }}
          />
        )}

        {/* Cute Floating Tooltip (Desktop) */}
        {!isOpen && (
          <div
            className="hidden md:flex items-center gap-1.5 absolute right-16 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-xl"
            style={{
              background: C.hero,
              borderColor: C.heroLine,
              color: C.heroFg,
              transform: "translateX(0)",
            }}
          >
            <span>Ask CampusCoin AI</span>
            <span style={{ color: C.highlight }}>✨</span>
          </div>
        )}
      </motion.button>

      {/* ─── CHAT PANEL / WINDOW ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={`pointer-events-auto absolute bottom-18 right-0 rounded-[24px] flex flex-col overflow-hidden text-white transition-all duration-300 ${
              isExpanded
                ? "w-[calc(100vw-32px)] sm:w-[500px] md:w-[560px] h-[calc(100vh-120px)] max-h-[680px]"
                : "w-[calc(100vw-32px)] sm:w-[380px] md:w-[410px] h-[540px] max-h-[calc(100vh-110px)]"
            }`}
            style={{
              background: C.hero,
              border: `1.5px solid ${C.heroLine}`,
              boxShadow: "0 28px 70px -15px rgba(0,0,0,0.75), 0 0 40px oklch(0.59 0.22 262 / 0.18)",
            }}
          >
            {/* ── Chat Header ── */}
            <div
              className="px-4 py-3.5 flex items-center justify-between shrink-0 select-none"
              style={{
                background: C.heroSurface,
                borderBottom: `1px solid ${C.heroLine}`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* AI Avatar with Live Status Dot */}
                <div
                  className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: C.hero,
                    border: `1.5px solid ${C.heroLine}`,
                  }}
                >
                  <BrandMark size={20} stroke={3.8} />
                  {/* Glowing active indicator */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{
                      background: C.highlight,
                      borderColor: C.heroSurface,
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        ...MANROPE,
                        fontSize: 14,
                        fontWeight: 800,
                        color: C.heroFg,
                        letterSpacing: "-0.01em",
                      }}
                      className="truncate"
                    >
                      Campus<span style={{ color: C.brand }}>Coin</span> AI
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                      style={{
                        background: C.highlight,
                        color: C.highlightFg,
                      }}
                    >
                      Copilot
                    </span>
                  </div>
                  <p
                    style={{ ...MANROPE, fontSize: 11, color: C.heroMuted }}
                    className="truncate flex items-center gap-1.5 mt-0.5"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                      style={{ background: C.growth }}
                    />
                    Online · Student Money Guide
                  </p>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Reset Demo History */}
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset conversation demo"
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  style={{ color: C.heroMuted }}
                >
                  <RotateCcw style={{ width: 15, height: 15 }} />
                </button>

                {/* Expand / Collapse Window (Desktop) */}
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  title={isExpanded ? "Standard size" : "Expand window"}
                  className="hidden sm:block p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  style={{ color: C.heroMuted }}
                >
                  {isExpanded ? (
                    <Minimize2 style={{ width: 15, height: 15 }} />
                  ) : (
                    <Maximize2 style={{ width: 15, height: 15 }} />
                  )}
                </button>

                {/* Close Panel */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  style={{ color: C.heroMuted }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>

            {/* ── Scrollable Message Area ── */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth select-text"
              style={{ background: C.hero }}
            >
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`relative max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed transition-all ${
                        isUser
                          ? "rounded-br-xs shadow-md font-medium"
                          : "rounded-bl-xs shadow-sm"
                      }`}
                      style={{
                        background: isUser ? C.brand : C.heroSurface,
                        color: isUser ? "#FFFFFF" : C.heroFg,
                        border: isUser ? "none" : `1px solid ${C.heroLine}`,
                      }}
                    >
                      {/* Assistant Tag & Copy Icon */}
                      {!isUser && (
                        <div
                          className="flex items-center justify-between mb-1.5 pb-1 border-b"
                          style={{ borderColor: C.heroLine }}
                        >
                          <span
                            className="text-[10px] font-bold flex items-center gap-1"
                            style={{ color: C.highlight }}
                          >
                            <Sparkles style={{ width: 11, height: 11 }} /> CampusCoin AI
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="hover:text-white transition-colors cursor-pointer p-0.5"
                            style={{ color: C.heroMuted }}
                            title="Copy text"
                          >
                            {copiedId === msg.id ? (
                              <Check style={{ width: 12, height: 12, color: C.growth }} />
                            ) : (
                              <Copy style={{ width: 12, height: 12 }} />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Formatted Markdown Content */}
                      <FormattedContent text={msg.content} isUser={isUser} />

                      {/* Timestamp */}
                      <div
                        className={`text-[9px] mt-1.5 flex items-center gap-1 ${
                          isUser ? "justify-end opacity-75" : "justify-start"
                        }`}
                        style={{ color: isUser ? "#FFFFFF" : C.heroMuted }}
                      >
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing / Loading Indicator */}
              {isTyping && (
                <div className="flex items-start">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-bl-xs p-3 flex items-center gap-2.5 shadow-sm"
                    style={{
                      background: C.heroSurface,
                      border: `1px solid ${C.heroLine}`,
                      color: C.heroFg,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: C.hero }}
                    >
                      <BrandMark size={14} stroke={2.8} />
                    </div>
                    <span style={{ fontSize: 11, color: C.heroMuted }}>
                      CampusCoin AI is thinking
                    </span>
                    <div className="flex items-center gap-1 ml-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]"
                        style={{ background: C.highlight }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]"
                        style={{ background: C.highlight }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: C.highlight }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Quick Suggestions Tray ── */}
            <div
              className="px-3 pt-2.5 pb-1.5 flex gap-1.5 overflow-x-auto no-scrollbar"
              style={{
                background: C.heroSurface,
                borderTop: `1px solid ${C.heroLine}`,
              }}
            >
              {SUGGESTIONS.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isTyping}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    style={{
                      background: C.hero,
                      border: `1px solid ${C.heroLine}`,
                      color: C.heroMuted,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = C.heroFg;
                      e.currentTarget.style.borderColor = C.highlight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = C.heroMuted;
                      e.currentTarget.style.borderColor = C.heroLine;
                    }}
                  >
                    <IconComponent style={{ width: 12, height: 12, color: C.growth }} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Input & Send Bar ── */}
            <div
              className="p-3 shrink-0"
              style={{
                background: C.heroSurface,
                borderTop: `1px solid ${C.heroLine}`,
              }}
            >
              <div className="relative flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask CampusCoin AI anything..."
                  disabled={isTyping}
                  maxLength={500}
                  className="flex-1 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/40 outline-none transition-all pr-10"
                  style={{
                    background: C.hero,
                    border: `1px solid ${C.heroLine}`,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.brand;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.heroLine;
                  }}
                />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-9 h-9 rounded-full text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md active:scale-95 shrink-0"
                  style={{
                    background: inputValue.trim() ? C.brand : C.heroLine,
                  }}
                  title="Send message"
                >
                  <Send style={{ width: 15, height: 15 }} />
                </button>
              </div>

              {/* Disclaimer Subtext */}
              <p
                style={{
                  ...MANROPE,
                  fontSize: 10,
                  color: C.heroMuted,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                CampusCoin Student AI • Instant Financial Guidance
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Lightweight Markdown Formatting Renderer (UI Only) ─── */
function FormattedContent({ text, isUser }) {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-2">
      {paragraphs.map((para, pIdx) => {
        // Bullet list check
        if (para.includes("\n• ") || para.startsWith("• ") || para.startsWith("- ")) {
          const lines = para.split("\n");
          return (
            <ul key={pIdx} className="space-y-1 my-1 pl-1 list-none">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^[•\-\*]\s+/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-1.5 text-xs">
                    <span style={{ color: isUser ? "#FFFFFF" : C.growth }} className="mt-0.5 shrink-0">
                      •
                    </span>
                    <span>{parseBold(cleaned)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard lines
        const subLines = para.split("\n");
        return (
          <p key={pIdx} className="leading-relaxed">
            {subLines.map((subLine, sIdx) => (
              <span key={sIdx}>
                {parseBold(subLine)}
                {sIdx < subLines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function parseBold(str) {
  if (!str) return str;
  const parts = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.substring(lastIdx, match.index));
    }
    parts.push(
      <strong key={`b-${match.index}`} className="font-bold text-white">
        {match[1]}
      </strong>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }

  return parts.length > 0 ? parts : str;
}
