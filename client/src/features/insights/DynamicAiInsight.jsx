import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, BrainCircuit } from "lucide-react";
import { getDynamicInsight, regenerateDynamicInsight } from "./insightsApi";
import toast from "react-hot-toast";

const cardClass =
  "bg-[#111726] border border-slate-800 shadow-xl rounded-3xl";

export default function DynamicAiInsight() {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dynamicInsight"],
    queryFn: getDynamicInsight,
    staleTime: 5 * 60 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: regenerateDynamicInsight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamicInsight"] });
      toast.success("AI Insight Regenerated!");
    },
    onError: () => {
      // Handled by global react-query error handler or fallback
    },
  });

  const isGenerating = isLoading || isFetching || generateMutation.isPending;

  return (
    <div
      className={`${cardClass} p-5 flex items-center justify-between gap-4 w-full relative overflow-hidden group transition-all duration-300 min-h-[76px]`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={`p-3 rounded-2xl border transition-all duration-500 shrink-0 ${
            isGenerating
              ? "bg-blue-600/30 border-blue-500/50 text-white animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              : "bg-blue-600/20 border-blue-500/30 text-blue-400"
          }`}
        >
          {isGenerating ? (
            <BrainCircuit className="w-6 h-6 animate-spin text-white duration-1000" />
          ) : (
            <Sparkles className="w-6 h-6 text-blue-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
              AI Financial Advisor
            </h4>
            {isGenerating && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-2xs font-mono text-blue-300 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                Thinking...
              </span>
            )}
          </div>

          {/* Localized skeleton state when generating / loading */}
          {isGenerating ? (
            <div
              className="animate-pulse bg-[#0B0F19] border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-2 w-full max-w-lg mt-1"
              aria-label="Generating AI insight"
            >
              <div className="h-3 bg-slate-700/60 rounded-full w-full" />
              <div className="h-3 bg-slate-800 rounded-full w-4/5" />
            </div>
          ) : (
            <p className="text-white font-bold text-sm leading-relaxed truncate-2-lines">
              {data?.tip || "Analyze your spending to get tailored tips."}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => generateMutation.mutate()}
        disabled={isGenerating}
        className="shrink-0 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold text-xs cursor-pointer shadow-sm"
        aria-label="Generate New Tip"
      >
        <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">
          {isGenerating ? "Thinking..." : "Generate New Tip"}
        </span>
      </button>
    </div>
  );
}
