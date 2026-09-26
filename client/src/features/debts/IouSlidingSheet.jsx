import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDebts, updateDebt } from "./debtApi";
import toast from "react-hot-toast";

// Apple visionOS Extreme Liquid Glass Standard Recipe
const glassRecipe =
  "bg-white/10 backdrop-blur-[64px] backdrop-saturate-[150%] border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]";

export default function IouSlidingSheet({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { data: debtsData } = useQuery({
    queryKey: ["debts"],
    queryFn: getDebts,
    placeholderData: keepPreviousData,
    enabled: isOpen,
  });

  const settleMutation = useMutation({
    mutationFn: (id) => updateDebt(id, { settlement_status: "settled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["dynamicInsight"] });
      toast.success("Debt marked as settled!");
    },
  });

  const debts = debtsData?.debts || [];
  const pendingDebts = debts.filter((d) => d.settlement_status === "pending");
  const owedToMe = pendingDebts.filter((d) => d.direction === "owed_to_me");
  const iOwe = pendingDebts.filter((d) => d.direction === "i_owe");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[6px] z-40"
          />
          <motion.div
            initial={{ x: "100%", y: 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: "100%", y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className={`fixed inset-y-0 right-0 w-full max-w-md ${glassRecipe} z-50 overflow-y-auto p-6 sm:p-8 rounded-l-[32px] text-white flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/20">
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-amber-300">
                    <Coins className="w-4 h-4" />
                  </div>
                  IOU & Debt Splitter
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white flex items-center justify-center transition-colors cursor-pointer min-h-[32px]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                    <ArrowRight className="text-emerald-300 w-4 h-4" />
                    Owed To Me (${owedToMe.reduce((s, d) => s + d.amount, 0).toFixed(2)})
                  </h3>
                  <div className="space-y-3">
                    {owedToMe.length === 0 && (
                      <p className="text-white/60 text-xs py-2">No pending incoming IOUs.</p>
                    )}
                    {owedToMe.map((debt) => (
                      <div
                        key={debt._id}
                        className="p-4 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <div className="font-bold text-white">{debt.counterparty_name}</div>
                          <div className="text-xs text-white/60">
                            {debt.due_date ? new Date(debt.due_date).toLocaleDateString() : "No due date"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-black text-emerald-300 text-sm">+${debt.amount.toFixed(2)}</div>
                          <button
                            onClick={() => settleMutation.mutate(debt._id)}
                            title="Settle debt"
                            className="w-8 h-8 rounded-full bg-emerald-400/30 hover:bg-emerald-400/50 border border-emerald-300/40 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer min-h-[32px]"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                    <ArrowLeft className="text-rose-300 w-4 h-4" />
                    I Owe (${iOwe.reduce((s, d) => s + d.amount, 0).toFixed(2)})
                  </h3>
                  <div className="space-y-3">
                    {iOwe.length === 0 && (
                      <p className="text-white/60 text-xs py-2">No pending outgoing IOUs.</p>
                    )}
                    {iOwe.map((debt) => (
                      <div
                        key={debt._id}
                        className="p-4 rounded-[20px] bg-white/10 border border-white/20 flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <div className="font-bold text-white">{debt.counterparty_name}</div>
                          <div className="text-xs text-white/60">
                            {debt.due_date ? new Date(debt.due_date).toLocaleDateString() : "No due date"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-black text-rose-300 text-sm">-${debt.amount.toFixed(2)}</div>
                          <button
                            onClick={() => settleMutation.mutate(debt._id)}
                            title="Settle debt"
                            className="w-8 h-8 rounded-full bg-rose-400/30 hover:bg-rose-400/50 border border-rose-300/40 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer min-h-[32px]"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/20">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs transition-colors cursor-pointer min-h-[44px]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
