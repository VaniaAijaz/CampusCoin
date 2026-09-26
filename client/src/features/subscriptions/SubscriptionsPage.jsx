import { useState, useEffect } from "react";
import { Plus, Repeat, Calendar, Trash2 } from "lucide-react";
import { getSubscriptions, createSubscription, deleteSubscription } from "./subscriptionApi";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";
import { AnimatePresence, motion } from "framer-motion";

const glassRecipe =
  "base-glass bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] transform-gpu backface-hidden";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [renewalDate, setRenewalDate] = useState("");

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const res = await getSubscriptions();
      if (res.success) {
        setSubscriptions(res.subscriptions);
      }
    } catch (err) {
      toast.error("Failed to load subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createSubscription({
        name,
        amount: Number(amount),
        currency: "USD",
        billing_cycle: billingCycle,
        renewal_date: renewalDate,
      });
      if (res.success) {
        toast.success("Subscription added!");
        setModalOpen(false);
        fetchSubs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding subscription");
    }
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteSubscription(itemToDelete);
      if (res.success) {
        toast.success("Subscription deleted.");
        fetchSubs();
      }
    } catch (err) {
      toast.error("Error deleting subscription");
    } finally {
      setItemToDelete(null);
    }
  };

  const getDueDays = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextDue = new Date(dateStr);
    nextDue.setHours(0, 0, 0, 0);

    while (nextDue < today) {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }

    const diffTime = Math.abs(nextDue - today);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 text-white w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5 drop-shadow-sm">
            <div className="p-2 rounded-full bg-white/20 border border-white/30">
              <Repeat className="w-5 h-5 text-purple-300" />
            </div>
            Subscriptions
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-1">
            Manage your recurring software, media, and campus memberships.
          </p>
        </div>
        <div>
          <button
            onClick={() => setModalOpen(true)}
            className="py-2.5 px-5 rounded-full bg-white/25 hover:bg-white/35 border border-white/40 text-white text-xs font-bold shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-white/70">Loading...</div>
      ) : subscriptions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub) => {
            const domain = sub.name.toLowerCase().replace(/\s+/g, "") + ".com";
            const logoUrl = `https://img.logo.dev/${domain}?token=pk_1234567890`; 
            const dueDays = getDueDays(sub.renewal_date);

            return (
              <div key={sub._id} className={`${glassRecipe} p-5 flex flex-col justify-between relative`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center p-1">
                      <img
                        src={logoUrl}
                        alt={sub.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center text-white/50 font-bold text-xs">
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{sub.name}</h4>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">{sub.billing_cycle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(sub._id)}
                    className="p-1.5 rounded-full hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div>
                  <div className="text-2xl font-black text-white">
                    ${Number(sub.amount).toFixed(2)}
                  </div>
                  
                  <div className={`mt-3 px-3 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-bold border ${
                    dueDays <= 3
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      : dueDays <= 7
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }`}>
                    <Calendar className="w-3.5 h-3.5" />
                    Due in {dueDays} Days
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-white/60">
          No subscriptions found.
        </div>
      )}

      {/* Subscription Modal using Portal */}
      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalOpen(false)}
                className="fixed inset-0 bg-black/75 backdrop-blur-md -z-10"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-md bg-white/[0.03] backdrop-blur-[64px] border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] text-white relative z-10"
              >
                <h3 className="text-xl font-bold mb-4 drop-shadow-sm">Add Subscription</h3>
                <form onSubmit={handleSubmit} className="space-y-4 text-sm relative">
                  <div className="relative">
                    <label className="block text-white/70 mb-1 text-xs">Service Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Netflix, Spotify"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:border-brand-primary outline-none placeholder:text-white/30"
                    />
                    
                    {/* Combobox Dropdown Logic Inline */}
                    {name && !['netflix', 'spotify', 'prime video', 'adobe', 'github'].includes(name.toLowerCase()) && (
                      <div className="absolute top-[100%] left-0 w-full mt-2 rounded-xl bg-black/40 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-2xl z-50 p-1 flex flex-col gap-1 max-h-48 overflow-y-auto">
                        {['Netflix', 'Spotify', 'Prime Video', 'Adobe', 'GitHub']
                          .filter(s => s.toLowerCase().includes(name.toLowerCase()))
                          .map(s => {
                            const dom = s.toLowerCase().replace(/\s+/g, "") + ".com";
                            return (
                              <div
                                key={s}
                                onClick={() => setName(s)}
                                className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                              >
                                <img src={`https://img.logo.dev/${dom}?token=pk_1234567890`} className="w-6 h-6 rounded-md bg-white/10 p-0.5 object-contain" alt={s} onError={(e) => { e.target.style.display = 'none'; }} />
                                <span className="font-bold text-white text-sm">{s}</span>
                              </div>
                            )
                          })
                        }
                        <div
                           onClick={() => { /* keep custom name */ }}
                           className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors text-white/50 text-xs italic"
                        >
                          Use "{name}"
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1 text-xs">Amount</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:border-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1 text-xs">Billing Cycle</label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:border-brand-primary outline-none"
                    >
                      <option className="bg-[#0B0F19] text-white" value="monthly">Monthly</option>
                      <option className="bg-[#0B0F19] text-white" value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1 text-xs">Next Renewal Date</label>
                    <input
                      required
                      type="date"
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white focus:border-brand-primary outline-none"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]"
                    >
                      Save Subscription
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      <GlassConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription?"
        confirmText="Delete"
      />
    </div>
  );
}
