import { useState, useEffect, useMemo } from "react";
import { Plus, Repeat, Calendar, Trash2, CreditCard, Sparkles, AlertCircle, X } from "lucide-react";
import { getSubscriptions, createSubscription, deleteSubscription } from "./subscriptionApi";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/currencyUtils";

/* ── Canonical CampusCoin Design Tokens ── */
const C = {
  hero:        "oklch(0.115 0.018 255)",
  heroFg:      "oklch(0.985 0.003 250)",
  heroMuted:   "oklch(0.73 0.018 252)",
  heroLine:    "oklch(0.31 0.025 255)",
  brand:       "oklch(0.59 0.22 262)",
  brandSoft:   "oklch(0.93 0.06 262)",
  highlight:   "oklch(0.88 0.18 157)",
  highlightFg: "oklch(0.17 0.04 160)",
  growth:      "oklch(0.64 0.17 157)",
  growthSoft:  "oklch(0.94 0.05 158)",
  background:  "oklch(0.99 0.003 250)",
  foreground:  "oklch(0.16 0.025 260)",
  muted:       "oklch(0.5 0.025 255)",
  border:      "oklch(0.9 0.012 255)",
  altBg:       "oklch(0.965 0.01 254)",
};
const M = { fontFamily: "'Manrope',ui-sans-serif,system-ui,sans-serif" };

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 999,
  background: C.altBg, border: `1.5px solid ${C.border}`,
  fontSize: 13, color: C.foreground, outline: "none",
  fontFamily: M.fontFamily, transition: "border-color 0.15s", boxSizing: "border-box",
};

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
        setSubscriptions(res.subscriptions);
      }
    } catch {
      toast.error("Failed to load subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const totalMonthlyBurn = useMemo(() => {
    return subscriptions.reduce((sum, s) => {
      const amt = Number(s.amount) || 0;
      return sum + (s.billing_cycle === "yearly" ? amt / 12 : amt);
    }, 0);
  }, [subscriptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createSubscription({
        name,
        amount: Number(amount),
        currency: user?.currency || "USD",
        billing_cycle: billingCycle,
        renewal_date: renewalDate,
      });
      if (res.success) {
        toast.success("Subscription added!");
        setModalOpen(false);
        setName("");
        setAmount("");
        setBillingCycle("monthly");
        setRenewalDate("");
        fetchSubs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding subscription");
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
        toast.success("Subscription deleted.");
        fetchSubs();
      }
    } catch {
      toast.error("Error deleting subscription");
    } finally {
      setItemToDelete(null);
    }
  };

  const getDueDays = (dateStr) => {
    if (!dateStr) return 0;
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
    <div style={{ ...M, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: C.brand, margin: "0 0 6px" }}>
            Recurring
          </p>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, color: C.foreground, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>
            Subscriptions
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "6px 0 0", fontWeight: 500 }}>
            Manage recurring software, media passes, and university memberships.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            height: 40, padding: "0 20px", borderRadius: 999,
            background: C.highlight, color: C.highlightFg,
            border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", ...M,
            boxShadow: `0 4px 16px ${C.highlight}55`, transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <Plus style={{ width: 14 }} />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* ── METRICS SUMMARY BANNER ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {/* Monthly Burn Rate */}
        <div style={{
          background: C.hero, borderRadius: 16, padding: "20px 24px",
          position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.1,
            backgroundImage: `linear-gradient(${C.heroLine} 1px,transparent 1px),linear-gradient(90deg,${C.heroLine} 1px,transparent 1px)`,
            backgroundSize: "32px 32px"
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: C.heroMuted }}>
              Monthly Burn Rate
            </span>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.heroFg, marginTop: 4, letterSpacing: "-0.03em" }}>
              {formatCurrency(totalMonthlyBurn, user?.currency || "USD")}
              <span style={{ fontSize: 13, fontWeight: 600, color: C.heroMuted, marginLeft: 6 }}>/month</span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginTop: 12 }}>
            Combined recurring expense allocation
          </span>
        </div>

        {/* Active Memberships */}
        <div style={{
          background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "20px 24px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: C.muted }}>
              Active Subscriptions
            </span>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.foreground, marginTop: 4, letterSpacing: "-0.03em" }}>
              {subscriptions.length}
            </div>
          </div>
          <span style={{ fontSize: 11, color: C.brand, fontWeight: 700, marginTop: 12 }}>
            Tracked student services
          </span>
        </div>
      </div>

      {/* ── SUBSCRIPTIONS LIST / GRID ── */}
      {loading ? (
        <div style={{ background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "48px 24px", textAlign: "center", color: C.muted, fontSize: 13 }}>
          Loading subscriptions…
        </div>
      ) : subscriptions.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {subscriptions.map((sub) => {
            const domain = sub.name.toLowerCase().replace(/\s+/g, "") + ".com";
            const logoUrl = `https://img.logo.dev/${domain}?token=pk_1234567890`;
            const dueDays = getDueDays(sub.renewal_date);

            return (
              <div
                key={sub._id}
                style={{
                  background: "#fff", border: `1.5px solid ${C.border}`,
                  borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column",
                  justifyContent: "space-between", gap: 16, transition: "box-shadow 0.15s",
                }}
              >
                {/* Header & Logo */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: C.altBg, border: `1px solid ${C.border}`,
                      overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, padding: 3,
                    }}>
                      <img
                        src={logoUrl}
                        alt={sub.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div style={{ display: "none", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: C.brand, fontWeight: 900, fontSize: 16 }}>
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: C.foreground, margin: "0 0 2px" }}>
                        {sub.name}
                      </h3>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {sub.billing_cycle || "Monthly"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(sub._id)}
                    title="Delete Subscription"
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: `1px solid ${C.border}`, background: "transparent",
                      color: C.muted, display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
                  >
                    <Trash2 style={{ width: 14 }} />
                  </button>
                </div>

                {/* Amount & Due Date */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                      Cost
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: C.foreground, letterSpacing: "-0.02em" }}>
                      {formatCurrency(sub.amount, sub.currency || user?.currency || "USD")}
                    </span>
                  </div>

                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: dueDays <= 3 ? "#fee2e2" : dueDays <= 7 ? "#fef3c7" : C.growthSoft,
                    color: dueDays <= 3 ? "#b91c1c" : dueDays <= 7 ? "#b45309" : C.growth,
                    border: `1px solid ${dueDays <= 3 ? "#fca5a5" : dueDays <= 7 ? "#fde68a" : C.growth + "40"}`,
                  }}>
                    <Calendar style={{ width: 11 }} />
                    Due in {dueDays}d
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 16,
          padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.brandSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Repeat style={{ width: 22, color: C.brand }} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: C.foreground, margin: "0 0 4px" }}>
              No subscriptions found
            </h3>
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
              Add student tools like Netflix, Spotify, or Adobe to automatically track renewals and monthly expenses.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6,
              height: 36, padding: "0 18px", borderRadius: 999,
              background: C.brand, color: "#fff", border: "none", fontSize: 13,
              fontWeight: 700, cursor: "pointer", ...M,
            }}
          >
            <Plus style={{ width: 13 }} /> Add Your First Subscription
          </button>
        </div>
      )}

      {/* ── ADD SUBSCRIPTION MODAL ── */}
      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                style={{
                  position: "relative", zIndex: 10, width: "100%", maxWidth: 440,
                  background: "#fff", border: `1.5px solid ${C.border}`,
                  borderRadius: 20, padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
                  ...M,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: `1px solid ${C.border}`, paddingBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: C.foreground, margin: 0, letterSpacing: "-0.02em" }}>
                      Add Subscription
                    </h3>
                    <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>
                      Track renewals and burn rate automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}
                  >
                    <X style={{ width: 18 }} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Service Name */}
                  <div style={{ position: "relative" }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                      Service Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Netflix, Spotify, GitHub"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle}
                    />

                    {/* Quick Popular Picks */}
                    {!name && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {["Netflix", "Spotify", "GitHub", "Adobe", "Prime"].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setName(p)}
                            style={{
                              padding: "4px 10px", borderRadius: 999,
                              background: C.altBg, border: `1px solid ${C.border}`,
                              fontSize: 11, fontWeight: 600, color: C.muted, cursor: "pointer",
                            }}
                          >
                            +{p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                      Amount ({user?.currency || "USD"})
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="9.99"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Billing Cycle */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                      Billing Cycle
                    </label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  {/* Renewal Date */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                      Next Renewal Date
                    </label>
                    <input
                      required
                      type="date"
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    />
                  </div>

                  {/* Submit */}
                  <div style={{ paddingTop: 8 }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        width: "100%", height: 42, borderRadius: 999,
                        background: C.highlight, color: C.highlightFg,
                        border: "none", fontSize: 14, fontWeight: 800,
                        cursor: "pointer", ...M, boxShadow: `0 4px 16px ${C.highlight}55`,
                        opacity: saving ? 0.7 : 1, transition: "all 0.15s",
                      }}
                    >
                      {saving ? "Saving…" : "Save Subscription"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* ── DELETE CONFIRMATION ── */}
      <GlassConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription? It will no longer calculate into your monthly burn rate."
        confirmText="Delete"
      />
    </div>
  );
}
