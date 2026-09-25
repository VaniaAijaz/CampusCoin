import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, BrainCircuit } from "lucide-react";
import { getDynamicInsight, regenerateDynamicInsight } from "./insightsApi";
import toast from "react-hot-toast";

export default function DynamicAiInsight() {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dynamicInsight"],
    queryFn: getDynamicInsight,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: regenerateDynamicInsight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamicInsight"] });
      toast.success("AI Insight Regenerated!");
    },
    onError: () => {
      // Fallback
    },
  });

  const isGenerating = isLoading || isFetching || generateMutation.isPending;

  return (
    <div
      className="glass-element flex items-center justify-between gap-4 w-full relative overflow-hidden min-h-[76px] p-5 rounded-[32px] bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] text-white"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={`p-3 rounded-full border transition-all duration-300 shrink-0 ${
            isGenerating
              ? "bg-amber-400/80 border-white/50 text-white animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.5)]"
              : "bg-white/20 border-white/40 text-amber-300 shadow-inner"
          }`}
        >
          {isGenerating ? (
            <BrainCircuit className="w-6 h-6 animate-spin text-white" />
          ) : (
            <Sparkles className="w-6 h-6 text-amber-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-white/70 font-semibold text-[11px] uppercase tracking-wider">
              AI Financial Advisor
            </h4>
            {isGenerating && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-[10px] font-mono text-white animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                Thinking...
              </span>
            )}
          </div>

          <p className="text-white font-bold text-sm leading-relaxed truncate">
            {data?.tip || "Analyze your spending to get tailored tips."}
          </p>
        </div>
      </div>

      <button
        onClick={() => generateMutation.mutate()}
        disabled={isGenerating}
        className="shrink-0 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold text-xs cursor-pointer shadow-sm active:scale-95"
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
