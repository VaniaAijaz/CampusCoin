import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDebts, updateDebt } from "./debtApi";
import toast from "react-hot-toast";

export default function IouSlidingSheet({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { data: debtsData, isLoading } = useQuery({
    queryKey: ["debts"],
    queryFn: getDebts,
    enabled: isOpen,
  });

  const settleMutation = useMutation({
    mutationFn: (id) => updateDebt(id, { settlement_status: "settled" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["debts"]);
      queryClient.invalidateQueries(["dashboardData"]);
      queryClient.invalidateQueries(["dynamicInsight"]);
      toast.success("Debt marked as settled!");
    },
  });

  const debts = debtsData?.debts || [];
  const pendingDebts = debts.filter(d => d.settlement_status === "pending");
  const owedToMe = pendingDebts.filter(d => d.direction === "owed_to_me");
  const iOwe = pendingDebts.filter(d => d.direction === "i_owe");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0E1322] border-l border-slate-800 shadow-2xl z-50 overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Coins className="text-blue-400" />
                IOU & Debt Tracker
              </h2>
              <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ArrowRight className="text-emerald-400 w-4 h-4" /> 
                  Owed To Me (${owedToMe.reduce((s,d) => s + d.amount, 0).toFixed(2)})
                </h3>
                <div className="space-y-3">
                  {owedToMe.length === 0 && <p className="text-slate-500 text-sm">No pending incoming IOUs.</p>}
                  {owedToMe.map(debt => (
                    <div key={debt._id} className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{debt.counterparty_name}</div>
                        <div className="text-xs text-slate-500">{debt.due_date ? new Date(debt.due_date).toLocaleDateString() : "No due date"}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-black text-emerald-400">+${debt.amount.toFixed(2)}</div>
                        <button onClick={() => settleMutation.mutate(debt._id)} className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 transition-colors cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ArrowLeft className="text-rose-400 w-4 h-4" /> 
                  I Owe (${iOwe.reduce((s,d) => s + d.amount, 0).toFixed(2)})
                </h3>
                <div className="space-y-3">
                  {iOwe.length === 0 && <p className="text-slate-500 text-sm">No pending outgoing IOUs.</p>}
                  {iOwe.map(debt => (
                    <div key={debt._id} className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{debt.counterparty_name}</div>
                        <div className="text-xs text-slate-500">{debt.due_date ? new Date(debt.due_date).toLocaleDateString() : "No due date"}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-black text-rose-400">-${debt.amount.toFixed(2)}</div>
                        <button onClick={() => settleMutation.mutate(debt._id)} className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
