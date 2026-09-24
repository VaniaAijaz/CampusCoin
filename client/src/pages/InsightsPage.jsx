import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb, Sparkles, Bookmark, Pin, TrendingUp,
  RefreshCw, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
const NOW = new Date();
const CURRENT_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}`;

export default function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [expanded, setExpanded] = useState({});

  const loadInsights = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/insights");
      setInsights(data.insights || []);
    } catch { toast.error("Failed to load insights."); }
    finally { setLoading(false); }
  }, []);

  const loadTips = useCallback(async () => {
    setTipsLoading(true);
    try {
      const { data } = await api.get("/tips");
      setTips(data.tips || []);
    } catch { /* silent */ }
    finally { setTipsLoading(false); }
  }, []);

  useEffect(() => { loadInsights(); loadTips(); }, [loadInsights, loadTips]);

  const generateInsight = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post(`/insights/generate?month=${month}`);
      toast.success("Insight generated!");
      loadInsights();
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed.");
    } finally { setGenerating(false); }
  };

  const toggleBookmark = async (id) => {
    try {
      const { data } = await api.put(`/insights/${id}/bookmark`);
      setInsights(ins => ins.map(i => i._id === id ? data.insight : i));
      toast.success(data.insight.isBookmarked ? "Bookmarked!" : "Bookmark removed.");
    } catch { toast.error("Failed to update bookmark."); }
  };

  const togglePin = async (id) => {
    try {
      const { data } = await api.put(`/insights/${id}/pin`);
      setInsights(ins => ins.map(i => i._id === id ? data.insight : i));
      toast.success(data.insight.isPinned ? "Pinned to dashboard!" : "Unpinned.");
    } catch { toast.error("Failed to update pin."); }
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const pinned = insights.filter(i => i.isPinned);
  const bookmarked = insights.filter(i => i.isBookmarked && !i.isPinned);
  const rest = insights.filter(i => !i.isPinned && !i.isBookmarked);

  const InsightCard = ({ insight, highlight }) => (
    <div className="cc-card" style={{
      border: `1px solid ${highlight ? "var(--color-brand)" : "var(--color-border)"}`,
      background: highlight ? "var(--color-brand-light)" : undefined,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div className="icon-box" style={{
          background: highlight ? "var(--color-brand)" : "var(--color-page)",
          color: highlight ? "#fff" : "var(--color-brand)",
          flexShrink: 0,
        }}>
          <Sparkles size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span className="cc-badge cc-badge-info">
              {new Date(insight.month).toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
            {insight.isPinned && <span className="cc-badge cc-badge-gold"><Pin size={9} /> Pinned</span>}
            {insight.isBookmarked && <span className="cc-badge cc-badge-neutral"><Bookmark size={9} /> Saved</span>}
          </div>
          <p style={{ fontSize: 13, color: "var(--color-dark)", margin: 0, lineHeight: 1.6 }}>
            {insight.summaryText}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            className="cc-btn-ghost"
            style={{ width: 32, height: 32, padding: 0, color: insight.isPinned ? "var(--color-gold)" : undefined }}
            onClick={() => togglePin(insight._id)} title="Pin"
          >
            <Pin size={14} />
          </button>
          <button
            className="cc-btn-ghost"
            style={{ width: 32, height: 32, padding: 0, color: insight.isBookmarked ? "var(--color-brand)" : undefined }}
            onClick={() => toggleBookmark(insight._id)} title="Bookmark"
          >
            <Bookmark size={14} />
          </button>
        </div>
      </div>

      {/* Flagged categories */}
      {insight.flaggedCategories?.length > 0 && (
        <div>
          <button
            onClick={() => toggleExpand(insight._id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
              cursor: "pointer", color: "var(--color-muted)", fontSize: 12, fontWeight: 600, padding: "6px 0",
            }}
          >
            <AlertTriangle size={13} color="var(--color-warning)" />
            {insight.flaggedCategories.length} flagged {insight.flaggedCategories.length === 1 ? "category" : "categories"}
            {expanded[insight._id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {expanded[insight._id] && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {insight.flaggedCategories.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--color-warning-bg)", borderRadius: 8, padding: "8px 12px",
                }}>
                  <TrendingUp size={13} color="var(--color-warning)" />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-warning-text)" }}>{f.categoryName}</span>
                    <span style={{ fontSize: 12, color: "var(--color-warning-text)" }}>
                      {" "}spent {fmt(f.currentAmount)} (+{f.percentChange}% vs avg {fmt(f.avgAmount)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      {insight.tipText && (
        <div style={{
          marginTop: 12,
          background: "var(--color-gold-light)", borderRadius: 9, padding: "10px 12px",
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <Lightbulb size={14} color="var(--color-gold)" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#8B7043", margin: 0, lineHeight: 1.5 }}>{insight.tipText}</p>
        </div>
      )}

      <div style={{ fontSize: 11, color: "var(--color-subtle)", marginTop: 10 }}>
        Generated {new Date(insight.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );

  return (
    <div className="page-content">
      <PageHeader
        title="AI Insights"
        subtitle="Personalized spending analysis and saving recommendations."
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="month" className="cc-input" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 160, height: 38 }} />
            <button className="cc-btn-primary" onClick={generateInsight} disabled={generating}>
              {generating ? <Spinner size={15} color="#fff" /> : <Sparkles size={15} />}
              {generating ? "Analyzing..." : "Generate Insight"}
            </button>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spinner size={28} /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          {/* Insights */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {insights.length === 0 ? (
              <div className="cc-card">
                <EmptyState
                  icon={<Sparkles size={24} />}
                  title="No insights yet"
                  description="Generate your first AI insight to see personalized spending analysis."
                  action={
                    <button className="cc-btn-primary" style={{ height: 36, fontSize: 12 }} onClick={generateInsight} disabled={generating}>
                      {generating ? <Spinner size={13} color="#fff" /> : <Sparkles size={13} />}
                      Generate Insight
                    </button>
                  }
                />
              </div>
            ) : (
              <>
                {pinned.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                      📌 Pinned
                    </div>
                    {pinned.map(i => <InsightCard key={i._id} insight={i} highlight />)}
                  </div>
                )}
                {bookmarked.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                      🔖 Bookmarked
                    </div>
                    {bookmarked.map(i => <InsightCard key={i._id} insight={i} />)}
                  </div>
                )}
                {rest.length > 0 && (
                  <div>
                    {(pinned.length > 0 || bookmarked.length > 0) && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                        All Insights
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {rest.map(i => <InsightCard key={i._id} insight={i} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Saving Tips Sidebar */}
          <div>
            <div className="cc-card" style={{ position: "sticky", top: "calc(var(--spacing-header) + 24px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Lightbulb size={16} color="var(--color-gold)" />
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-dark)" }}>Saving Tips</div>
                {tipsLoading && <Spinner size={14} />}
                <button onClick={loadTips} className="cc-btn-ghost" style={{ marginLeft: "auto", width: 28, height: 28, padding: 0 }} title="Refresh tips">
                  <RefreshCw size={13} />
                </button>
              </div>
              {tips.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-subtle)", lineHeight: 1.6 }}>
                  Keep logging transactions to get personalised saving tips.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tips.map((tip, i) => (
                    <div key={tip.id || i} style={{
                      background: i === 0 ? "var(--color-gold-light)" : "var(--color-page)",
                      borderRadius: 9,
                      padding: "10px 12px",
                      border: `1px solid ${i === 0 ? "#DDD0A8" : "var(--color-border)"}`,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                        {tip.category}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.5 }}>{tip.message}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-success)", background: "var(--color-success-bg)", padding: "1px 6px", borderRadius: 4 }}>
                          Save {fmt(tip.impact)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .insights-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
