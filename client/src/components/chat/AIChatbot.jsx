import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Bot,
  X,
  Send,
  Minimize2,
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../core/api";

const INITIAL_MESSAGE = {
  id: "welcome-msg",
  role: "assistant",
  content:
    "Hey! 👋 I'm **CampusCoin AI**. I can help you understand your spending, budgeting, saving, and CampusCoin features.\n\nAsk me anything about your finances or pick a suggested topic below!",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const DEFAULT_SUGGESTIONS_AUTH = [
  { label: "📊 Month Spending", prompt: "How much did I spend this month?" },
  { label: "🍕 Food Spending", prompt: "What is my food spending this month?" },
  { label: "🎯 Budget Status", prompt: "How do my budgets look right now?" },
  { label: "💡 How to Save", prompt: "How can I save more money as a student?" },
];

const DEFAULT_SUGGESTIONS_GUEST = [
  { label: "✨ What is CampusCoin?", prompt: "What is CampusCoin and how does it help students?" },
  { label: "💡 College Budget Tips", prompt: "What are the best budgeting tips for college students?" },
  { label: "🎯 How Budgets Work", prompt: "How do category budgets work in CampusCoin?" },
  { label: "🤝 What is Khata?", prompt: "How does the Khata peer ledger work?" },
];

export default function AIChatbot() {
  const { user, isAuthenticated } = useAuth();
  const { color } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(
    isAuthenticated ? DEFAULT_SUGGESTIONS_AUTH : DEFAULT_SUGGESTIONS_GUEST
  );
  const [copiedId, setCopiedId] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch dynamic suggestions on mount or auth change
  useEffect(() => {
    api
      .get("/chat/suggestions")
      .then(({ data }) => {
        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      })
      .catch(() => {
        setSuggestions(isAuthenticated ? DEFAULT_SUGGESTIONS_AUTH : DEFAULT_SUGGESTIONS_GUEST);
      });
  }, [isAuthenticated]);

  // Scroll to bottom when messages update
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom("auto");
      setHasUnread(false);
    }
  }, [isOpen, messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Prepare history payload (last 6 turns excluding welcome)
    const historyPayload = messages
      .filter((m) => m.id !== "welcome-msg")
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/chat/message", {
        message: text,
        history: historyPayload,
      });

      const botReply =
        data.reply ||
        "I received your question but couldn't generate a full answer. Please try asking again.";

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isConfigured: data.isConfigured,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Sorry, I couldn't reach the AI service right now. Please verify your connection or server configuration.";

      const errorMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        isError: true,
        content: `⚠️ **Connection Error**\n\n${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed z-50 bottom-20 md:bottom-6 right-4 md:right-6 pointer-events-none">
      {/* Floating Chat Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="pointer-events-auto relative group flex items-center justify-center w-14 h-14 rounded-full bg-[#0E131F]/90 backdrop-blur-2xl border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_25px_var(--color-brand-primary,rgba(59,130,246,0.3))] hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.92 }}
        title={isOpen ? "Close CampusCoin AI" : "Open CampusCoin AI Assistant"}
        aria-label="CampusCoin AI Chatbot"
      >
        {/* Iridescent Accent Ring Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-primary/40 via-white/10 to-brand-accent/30 opacity-75 group-hover:opacity-100 transition-opacity blur-[2px]" />

        {/* Dynamic Icon */}
        <div className="relative z-10 flex items-center justify-center text-white">
          {isOpen ? (
            <X className="w-6 h-6 text-white/90 group-hover:rotate-90 transition-transform duration-200" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
          )}
        </div>

        {/* Unread Message Notification Dot */}
        {hasUnread && !isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full border-2 border-[#07090E] animate-bounce" />
        )}

        {/* Floating Tooltip (Desktop only) */}
        {!isOpen && (
          <div className="hidden md:block absolute right-16 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
            <span>Ask CampusCoin AI ✨</span>
          </div>
        )}
      </motion.button>

      {/* Floating Chat Modal Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={`pointer-events-auto absolute bottom-16 right-0 rounded-[28px] bg-[#0A0E18]/95 backdrop-blur-[64px] backdrop-saturate-[140%] border border-white/20 border-t-white/30 border-l-white/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(59,130,246,0.15)] flex flex-col overflow-hidden text-white transition-all duration-300 ${
              isExpanded
                ? "w-[calc(100vw-32px)] sm:w-[540px] md:w-[620px] h-[calc(100vh-120px)] max-h-[720px]"
                : "w-[calc(100vw-32px)] sm:w-[380px] md:w-[420px] h-[520px] max-h-[calc(100vh-130px)]"
            }`}
          >
            {/* Top Liquid Glass Header */}
            <div className="p-4 border-b border-white/10 bg-white/[0.04] flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-accent p-0.5 shadow-md shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-[#0A0E18] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-brand-primary" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0A0E18] rounded-full" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight truncate">
                      CampusCoin AI
                    </h3>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-accent border border-brand-primary/30">
                      Assistant
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    {isAuthenticated ? (user?.name ? `${user.name}'s context active` : "Connected to CampusCoin") : "Student Money Guide"}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Clear chat history"
                  className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  title={isExpanded ? "Collapse window" : "Expand window"}
                  className="hidden sm:block p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Conversation Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`relative max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed transform-gpu transition-all ${
                      msg.role === "user"
                        ? "bg-brand-primary text-white rounded-br-xs shadow-[0_4px_16px_rgba(59,130,246,0.3)] font-medium"
                        : msg.isError
                        ? "bg-rose-500/15 border border-rose-500/30 text-rose-200 rounded-bl-xs shadow-sm"
                        : "bg-white/[0.06] backdrop-blur-md border border-white/15 text-white/90 rounded-bl-xs shadow-sm"
                    }`}
                  >
                    {/* Assistant Message Header & Copy Tool */}
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10">
                        <span className="text-[10px] font-bold text-brand-accent flex items-center gap-1">
                          <Bot className="w-3 h-3" /> CampusCoin AI
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="text-white/40 hover:text-white transition-colors cursor-pointer p-0.5"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Rich Formatted Markdown Content */}
                    <FormattedMessage text={msg.content} isUser={msg.role === "user"} />

                    {/* Timestamp */}
                    <div
                      className={`text-[9px] mt-1.5 flex items-center gap-1 ${
                        msg.role === "user" ? "text-white/70 justify-end" : "text-white/40 justify-start"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing / Loading Animation Bubble */}
              {isLoading && (
                <div className="flex items-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-xs p-3.5 bg-white/[0.06] backdrop-blur-md border border-white/15 text-white/90 shadow-sm flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
                    <span className="text-xs text-white/60">CampusCoin AI is thinking</span>
                    <div className="flex items-center gap-1 ml-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Contextual Suggestions Tray */}
            {suggestions.length > 0 && (
              <div className="px-3 pt-2 pb-1 bg-white/[0.02] border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="shrink-0 px-2.5 py-1.5 rounded-full bg-white/8 hover:bg-white/15 border border-white/15 text-[11px] font-medium text-white/80 hover:text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input & Send Bar */}
            <div className="p-3 bg-white/[0.04] border-t border-white/10 shrink-0">
              <div className="relative flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about spending, budgets, savings..."
                  disabled={isLoading}
                  maxLength={1500}
                  className="flex-1 bg-white/10 hover:bg-white/15 focus:bg-white/15 border border-white/20 focus:border-brand-primary rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/40 outline-none transition-all pr-10 shadow-inner"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-9 h-9 rounded-2xl bg-brand-primary hover:bg-brand-hover text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md active:scale-95 shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Educational Disclaimer Footer */}
              <p className="text-[9px] text-white/40 text-center mt-2 font-medium tracking-tight">
                CampusCoin AI provides general student educational guidance. Not certified financial advice.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Lightweight, robust renderer for formatted markdown chunks
 * (bold, bullets, code, headers, numbers).
 */
function FormattedMessage({ text, isUser }) {
  if (!text) return null;

  // Split by double newline for paragraphs
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-2">
      {paragraphs.map((para, pIdx) => {
        // Render markdown list items
        if (para.includes("\n- ") || para.startsWith("- ") || para.startsWith("* ")) {
          const lines = para.split("\n");
          return (
            <ul key={pIdx} className="space-y-1 my-1 pl-1 list-none">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^[-*•]\s+/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-1.5 text-xs">
                    <span className="text-brand-accent mt-0.5 shrink-0">•</span>
                    <span>{parseInlineMarkdown(cleaned, isUser)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Render code blocks (e.g. ```env ... ```)
        if (para.startsWith("```") && para.endsWith("```")) {
          const codeContent = para.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
          return (
            <pre
              key={pIdx}
              className="p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto my-1.5"
            >
              <code>{codeContent}</code>
            </pre>
          );
        }

        // Render standard line with potential single line breaks
        const subLines = para.split("\n");
        return (
          <p key={pIdx} className="leading-relaxed">
            {subLines.map((subLine, sIdx) => (
              <span key={sIdx}>
                {parseInlineMarkdown(subLine, isUser)}
                {sIdx < subLines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Simple inline formatter for bold (**text**), code (`code`), and currency values ($123.45)
 */
function parseInlineMarkdown(text, isUser) {
  if (!text) return text;

  // Replace bold **words**
  const parts = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong
        key={`bold-${match.index}`}
        className={isUser ? "font-bold text-white" : "font-bold text-white tracking-wide"}
      >
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
