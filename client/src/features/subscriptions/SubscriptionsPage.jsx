import { useState, useEffect } from "react";
import { Plus, Repeat, Calendar, Trash2, X, CreditCard, Sparkles } from "lucide-react";
import { getSubscriptions, createSubscription, deleteSubscription } from "./subscriptionApi";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency, getCurrencySymbol } from "../../utils/currencyUtils";
import "../dashboard/Dashboard.css";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [renewalDate, setRenewalDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const res = await getSubscriptions();
      if (res.success) {
        setSubscriptions(res.subscriptions || []);
      }
    } catch (err) {
      toast.error("Couldn't load subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid name and amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await createSubscription({
        name: name.trim(),
        amount: Number(amount),
        currency: "USD",
        billing_cycle: billingCycle,
        renewal_date: renewalDate,
      });
      if (res.success) {
        toast.success("Subscription added.");
        setModalOpen(false);
        setName("");
        setAmount("");
        setRenewalDate("");
        fetchSubs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add subscription.");
    } finally {
      setSaving(false);
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
        toast.success("Subscription removed.");
        fetchSubs();
      }
    } catch (err) {
      toast.error("Failed to delete subscription.");
    } finally {
      setItemToDelete(null);
    }
  };

  const getDueDays = (dateStr) => {
    if (!dateStr) return 30;
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

  const totalMonthlyBurn = subscriptions.reduce((sum, s) => {
    const amt = Number(s.amount) || 0;
    return sum + (s.billing_cycle === "yearly" ? amt / 12 : amt);
  }, 0);

  return (
    <div className="dash-root">
      {/* ── Page Header ── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Subscriptions</h1>
          <p className="dash-page-desc">Keep track of your recurring memberships, streaming, and software tools.</p>
        </div>

        <div className="dash-page-actions">
          <button onClick={() => setModalOpen(true)} className="dash-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {/* ── Summary KPI Strip ── */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div>
            <div className="dash-kpi-icon-wrap" style={{ background: "#dbeafe", color: "#2563eb" }}>
              <Repeat style={{ width: 20, height: 20 }} />
            </div>
            <div className="dash-kpi-value">{subscriptions.length}</div>
            <p className="dash-kpi-label">Active Subscriptions</p>
          </div>
          <span className="dash-kpi-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
            Recurring
          </span>
        </div>

        <div className="dash-kpi-card">
          <div>
            <div className="dash-kpi-icon-wrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <CreditCard style={{ width: 20, height: 20 }} />
            </div>
            <div className="dash-kpi-value">{formatCurrency(totalMonthlyBurn, user?.currency)}</div>
            <p className="dash-kpi-label">Monthly Cost</p>
          </div>
          <span className="dash-kpi-badge" style={{ background: "#fee2e2", color: "#dc2626" }}>
            Estimated / mo
          </span>
        </div>

        <div className="dash-kpi-card">
          <div>
            <div className="dash-kpi-icon-wrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <Calendar style={{ width: 20, height: 20 }} />
            </div>
            <div className="dash-kpi-value">{formatCurrency(totalMonthlyBurn * 12, user?.currency)}</div>
            <p className="dash-kpi-label">Yearly Commitment</p>
          </div>
          <span className="dash-kpi-badge" style={{ background: "#dcfce7", color: "#16a34a" }}>
            Estimated / yr
          </span>
        </div>
      </div>

      {/* ── Subscriptions Cards Grid ── */}
      {loading ? (
        <div style={{ padding: "64px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#64748b", fontSize: 14 }}>
          <span
            style={{
              width: 20,
              height: 20,
              border: "2px solid #e2e8f0",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <span>Loading subscriptions...</span>
        </div>
      ) : subscriptions.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
          {subscriptions.map((sub) => {
            const dueDays = getDueDays(sub.renewal_date);
            const isUrgent = dueDays <= 3;
            const isSoon = dueDays <= 7;

            return (
              <div key={sub._id} className="dash-card" style={{ padding: "22px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 180 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: "#eff6ff",
                          border: "1px solid #dbeafe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 16,
                          color: "#2563eb",
                        }}
                      >
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>{sub.name}</h4>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em" }}>
                          {sub.billing_cycle || "Monthly"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(sub._id)}
                      className="dash-btn-danger"
                      style={{ width: 30, height: 30, padding: 0, borderRadius: 8 }}
                      title="Remove subscription"
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>

                  <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em", margin: "14px 0 4px" }}>
                    {formatCurrency(sub.amount, user?.currency)}
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 9999,
                      background: isUrgent ? "#fee2e2" : isSoon ? "#fef3c7" : "#dcfce7",
                      color: isUrgent ? "#dc2626" : isSoon ? "#d97706" : "#16a34a",
                      border: `1px solid ${isUrgent ? "#fecdd3" : isSoon ? "#fde68a" : "#bbf7d0"}`,
                    }}
                  >
                    <Calendar style={{ width: 13, height: 13 }} />
                    Due in {dueDays} days
                  </span>

                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                    {sub.renewal_date ? new Date(sub.renewal_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Active"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dash-empty-box">
          <div className="dash-empty-icon">
            <Repeat style={{ width: 24, height: 24 }} />
          </div>
          <h3 className="dash-empty-title">No recurring subscriptions yet.</h3>
          <p className="dash-empty-desc">Add services like Netflix, Spotify, Gym, or iCloud to monitor your recurring payments.</p>
          <button onClick={() => setModalOpen(true)} className="dash-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            <span>Add Subscription</span>
          </button>
        </div>
      )}

      {/* ── Add Subscription Modal ── */}
      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <motion.div
                key="bd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)", zIndex: -1 }}
              />
              <motion.div
                key="modal"
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  background: "#ffffff",
                  borderRadius: 22,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 24px 64px rgba(15,23,42,0.15)",
                  padding: "26px 28px",
                  fontFamily: "var(--dash-font)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2563eb", marginBottom: 2 }}>
                      Recurring Payment
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Add Subscription
                    </h3>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid #e2e8f0",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                    }}
                  >
                    <X style={{ width: 15, height: 15 }} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                      Service Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Netflix, Spotify, Gym, iCloud"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="dash-input"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                      Cost Amount ({getCurrencySymbol(user?.currency)})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="9.99"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="dash-input"
                      style={{ fontWeight: 800 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                      Billing Cycle
                    </label>
                    <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)} className="dash-select" style={{ width: "100%" }}>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                      Next Payment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      className="dash-input"
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                    <button type="button" onClick={() => setModalOpen(false)} className="dash-btn-secondary" style={{ height: 44 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="dash-btn-primary" style={{ height: 44 }}>
                      {saving ? "Saving..." : "Save Subscription"}
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
        message="Are you sure you want to remove this recurring subscription?"
        confirmText="Delete"
      />
    </div>
  );
}
