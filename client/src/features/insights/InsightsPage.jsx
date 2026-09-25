import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Bookmark,
  Calendar,
  Zap,
  TrendingUp,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import AiInsightsCard from "./AiInsightsCard";
import {
  getInsights,
  generateInsight,
  getSmartTips,
  getForecast,
} from "./insightsApi";
import toast from "react-hot-toast";

export default function InsightsPage() {
  const [insightsList, setInsightsList] = useState([]);
  const [activeInsight, setActiveInsight] = useState(null);
  const [smartTips, setSmartTips] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [insRes, tipsRes, fcRes] = await Promise.all([
        getInsights(),
        getSmartTips(),
        getForecast(),
      ]);

      if (insRes.success && insRes.insights.length > 0) {
        setInsightsList(insRes.insights);
        setActiveInsight(insRes.insights[0]);
      } else {
        const gen = await generateInsight();
        if (gen.success) {
          setInsightsList([gen.insight]);
          setActiveInsight(gen.insight);
        }
      }

      if (tipsRes.success) setSmartTips(tipsRes.tips);
      if (fcRes.success) setForecast(fcRes.forecast);
    } catch {
      toast.error("Failed to load AI insights.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            AI Financial Insights & Copilot
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Plain-text, actionable financial advice generated autonomously by analyzing your campus spend velocity.
          </p>
        </div>

        <button
          onClick={() => fetchAll()}
          className="self-start sm:self-auto py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold border border-white/10 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Primary Autonomous AI Insights Hero */}
      <AiInsightsCard insight={activeInsight} onRefresh={fetchAll} />

      {/* Grid: Next Month Forecast & Smart Saving Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Month Predictive Cash Flow Forecast */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <div className="p-2 rounded-xl bg-brand-primary text-brand-dark/10 border border-brand-primary/20 text-brand-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Next Month Student Forecast</h3>
              <p className="text-xs text-zinc-400">Predictive estimation using rolling 3-month trailing moving averages.</p>
            </div>
          </div>

          {forecast ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-3xs uppercase tracking-wider text-zinc-400 block font-medium">Est. Inflow</span>
                  <span className="text-lg font-bold text-brand-mint mt-1 block">
                    ${forecast.income.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-3xs uppercase tracking-wider text-zinc-400 block font-medium">Est. Spend</span>
                  <span className="text-lg font-bold text-brand-coral mt-1 block">
                    ${forecast.expense.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-3xs uppercase tracking-wider text-zinc-400 block font-medium">Est. Net</span>
                  <span
                    className={`text-lg font-bold mt-1 block ${
                      forecast.balance >= 0 ? "text-brand-mint" : "text-brand-coral"
                    }`}
                  >
                    {forecast.balance >= 0 ? "+" : ""}${forecast.balance.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300 leading-relaxed">
                {forecast.balance >= 0 ? (
                  <p>
                    Based on your quarterly pace, you are on track to preserve approximately{" "}
                    <strong className="text-brand-mint">${forecast.balance.toFixed(0)}</strong> next month.
                    Consider allocating this surplus toward textbook reserves or student emergency funds.
                  </p>
                ) : (
                  <p>
                    Pacing models indicate an estimated monthly deficit of{" "}
                    <strong className="text-brand-coral">${Math.abs(forecast.balance).toFixed(0)}</strong> next month.
                    Review your high-frequency categories to reduce burn rate.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-400">
              Gathering transaction data for predictive forecast...
            </div>
          )}
        </div>

        {/* Personalized Student Saving Tips */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Smart Saving Tactics</h3>
              <p className="text-xs text-zinc-400">Contextual tips dynamically triggered by month-over-month shifts.</p>
            </div>
          </div>

          {smartTips.length > 0 ? (
            <div className="space-y-3">
              {smartTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all text-xs flex items-start gap-3"
                >
                  <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <div className="font-semibold text-white mb-0.5">{tip.category}</div>
                    <p className="text-zinc-300 leading-relaxed">{tip.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400">
              <p className="mb-2 font-medium text-white">No unusual spending spikes detected!</p>
              <p>Your current category trends match historical averages. Keep tracking expenses daily.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
