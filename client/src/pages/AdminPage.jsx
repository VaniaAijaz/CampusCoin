import { useState, useEffect, useCallback } from "react";
import {
  Users, Tag, Megaphone, BarChart2, Trash2, Plus,
  UserCheck, UserX, Shield, RefreshCw, Search
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";

const fmt = (n) => Number(n || 0).toLocaleString();

const COLOR_OPTIONS = ["#0118A3","#3956BB","#B9A572","#E97B4F","#16A34A","#D97706","#DC2626","#9A9CA4"];

export default function AdminPage() {
  const [tab, setTab] = useState("stats");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [catModal, setCatModal] = useState(false);
  const [catEdit, setCatEdit] = useState(null);
  const [catForm, setCatForm] = useState({ name: "", type: "expense", icon: "tag", color: "#0118A3" });
  const [annModal, setAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", message: "", type: "info" });
  const [delUser, setDelUser] = useState(null);
  const [delCat, setDelCat] = useState(null);
  const [delAnn, setDelAnn] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data.stats);
    } catch { /* silent */ }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: 20 });
      if (userSearch) params.set("search", userSearch);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setUserTotal(data.total || 0);
    } catch { /* silent */ }
  }, [userSearch]);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/categories");
      setCategories(data.categories || []);
    } catch { /* silent */ }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/announcements");
      setAnnouncements(data.announcements || []);
    } catch { /* silent */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadUsers(), loadCategories(), loadAnnouncements()]);
    setLoading(false);
  }, [loadStats, loadUsers, loadCategories, loadAnnouncements]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  // User actions
  const toggleUser = async (id) => {
    setActionLoading(true);
    try {
      const { data } = await api.put(`/admin/users/${id}/toggle`);
      toast.success(`User ${data.user.isActive ? "enabled" : "disabled"}.`);
      loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); }
    finally { setActionLoading(false); }
  };

  const deleteUser = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/users/${delUser}`);
      toast.success("User deleted.");
      setDelUser(null);
      loadUsers(); loadStats();
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); }
    finally { setActionLoading(false); }
  };

  // Category actions
  const saveCat = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) { toast.error("Name required."); return; }
    setActionLoading(true);
    try {
      if (catEdit) {
        await api.put(`/admin/categories/${catEdit._id}`, catForm);
        toast.success("Category updated.");
      } else {
        await api.post("/admin/categories", catForm);
        toast.success("Category created.");
      }
      setCatModal(false); setCatEdit(null);
      setCatForm({ name: "", type: "expense", icon: "tag", color: "#0118A3" });
      loadCategories();
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); }
    finally { setActionLoading(false); }
  };

  const deleteCat = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/categories/${delCat}`);
      toast.success("Category deleted.");
      setDelCat(null); loadCategories();
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); }
    finally { setActionLoading(false); }
  };

  // Announcement actions
  const saveAnn = async (e) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.message.trim()) { toast.error("Title and message required."); return; }
    setActionLoading(true);
    try {
      await api.post("/admin/announcements", annForm);
      toast.success("Announcement created.");
      setAnnModal(false);
      setAnnForm({ title: "", message: "", type: "info" });
      loadAnnouncements();
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); }
    finally { setActionLoading(false); }
  };

  const deleteAnn = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/admin/announcements/${delAnn}`);
      toast.success("Announcement deleted.");
      setDelAnn(null); loadAnnouncements();
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); }
    finally { setActionLoading(false); }
  };

  const TABS = [
    { id: "stats",         label: "Overview",       icon: BarChart2   },
    { id: "users",         label: "Users",          icon: Users       },
    { id: "categories",    label: "Categories",     icon: Tag         },
    { id: "announcements", label: "Announcements",  icon: Megaphone   },
  ];

  return (
    <div className="page-content">
      <PageHeader
        title="Admin Panel"
        subtitle="Manage users, categories, announcements and view platform statistics."
        actions={
          <button className="cc-btn-secondary" onClick={loadAll} title="Refresh">
            <RefreshCw size={15} />
          </button>
        }
      />

      {/* Tab bar */}
      <div className="cc-tab-bar" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} className={`cc-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spinner size={28} /></div>
      ) : (
        <>
          {/* ── STATS TAB ── */}
          {tab === "stats" && stats && (
            <div>
              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Students",      value: fmt(stats.totalUsers),        color: "var(--color-brand)",   icon: <Users size={18} />      },
                  { label: "Active Students",      value: fmt(stats.activeUsers),       color: "var(--color-success)", icon: <UserCheck size={18} />  },
                  { label: "Total Transactions",   value: fmt(stats.totalTransactions), color: "var(--color-secondary)", icon: <BarChart2 size={18} /> },
                  { label: "Default Categories",   value: fmt(categories.length),       color: "var(--color-gold)",    icon: <Tag size={18} />        },
                ].map((s, i) => (
                  <div key={i} className="cc-card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div className="icon-box" style={{ width: 44, height: 44, background: `${s.color}14`, color: s.color }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--color-subtle)", fontWeight: 500 }}>{s.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-dark)", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top categories */}
              {stats.topCategories?.length > 0 && (
                <div className="cc-card">
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Most Used Categories</div>
                  <table className="cc-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Category</th>
                        <th style={{ textAlign: "right" }}>Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topCategories.map((c, i) => (
                        <tr key={i}>
                          <td style={{ color: "var(--color-subtle)", fontWeight: 600 }}>#{i + 1}</td>
                          <td style={{ fontWeight: 500 }}>{c.name}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(c.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── USERS TAB ── */}
          {tab === "users" && (
            <div>
              <div className="cc-card" style={{ marginBottom: 16, padding: "14px 16px" }}>
                <div className="search-input-wrap">
                  <Search size={15} />
                  <input
                    className="search-input"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    style={{ width: "100%", maxWidth: 400 }}
                  />
                </div>
              </div>

              <div className="cc-card" style={{ padding: 0, overflow: "hidden" }}>
                {users.length === 0 ? (
                  <EmptyState icon={<Users size={24} />} title="No users found" />
                ) : (
                  <>
                    <table className="cc-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Academic Year</th>
                          <th>Joined</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                                  {u.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                                  <div style={{ fontSize: 11, color: "var(--color-subtle)" }}>{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ color: "var(--color-muted)" }}>{u.academicYear || "—"}</td>
                            <td style={{ color: "var(--color-muted)" }}>
                              {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td>
                              <span className={`cc-badge ${u.isActive ? "cc-badge-success" : "cc-badge-danger"}`}>
                                {u.isActive ? "Active" : "Disabled"}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                                <button
                                  className="cc-btn-ghost"
                                  style={{
                                    width: 32, height: 32, padding: 0, borderRadius: 7,
                                    color: u.isActive ? "var(--color-warning)" : "var(--color-success)",
                                  }}
                                  onClick={() => toggleUser(u._id)}
                                  title={u.isActive ? "Disable user" : "Enable user"}
                                  disabled={actionLoading}
                                >
                                  {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                                </button>
                                <button
                                  className="cc-btn-ghost"
                                  style={{ width: 32, height: 32, padding: 0, borderRadius: 7, color: "var(--color-danger)" }}
                                  onClick={() => setDelUser(u._id)}
                                  title="Delete user"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: "10px 20px", borderTop: "1px solid var(--color-border)" }}>
                      <span style={{ fontSize: 12, color: "var(--color-subtle)" }}>{userTotal} total students</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── CATEGORIES TAB ── */}
          {tab === "categories" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button className="cc-btn-primary" onClick={() => { setCatEdit(null); setCatForm({ name: "", type: "expense", icon: "tag", color: "#0118A3" }); setCatModal(true); }}>
                  <Plus size={15} /> Add Default Category
                </button>
              </div>

              <div className="cc-card" style={{ padding: 0, overflow: "hidden" }}>
                {categories.length === 0 ? (
                  <EmptyState icon={<Tag size={24} />} title="No default categories" />
                ) : (
                  <table className="cc-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Color</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div className="icon-box" style={{ width: 30, height: 30, background: `${c.color}18`, color: c.color, borderRadius: 7 }}>
                                <Tag size={13} />
                              </div>
                              <span style={{ fontWeight: 500 }}>{c.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`cc-badge ${c.type === "income" ? "cc-badge-success" : "cc-badge-danger"}`} style={{ textTransform: "capitalize" }}>
                              {c.type}
                            </span>
                          </td>
                          <td>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: c.color, border: "2px solid var(--color-border)" }} />
                          </td>
                          <td>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                              <button
                                className="cc-btn-ghost"
                                style={{ width: 30, height: 30, padding: 0, borderRadius: 7 }}
                                onClick={() => { setCatEdit(c); setCatForm({ name: c.name, type: c.type, icon: c.icon || "tag", color: c.color || "#0118A3" }); setCatModal(true); }}
                              >
                                <Shield size={13} />
                              </button>
                              <button
                                className="cc-btn-ghost"
                                style={{ width: 30, height: 30, padding: 0, borderRadius: 7, color: "var(--color-danger)" }}
                                onClick={() => setDelCat(c._id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── ANNOUNCEMENTS TAB ── */}
          {tab === "announcements" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button className="cc-btn-primary" onClick={() => { setAnnForm({ title: "", message: "", type: "info" }); setAnnModal(true); }}>
                  <Plus size={15} /> New Announcement
                </button>
              </div>

              {announcements.length === 0 ? (
                <div className="cc-card">
                  <EmptyState
                    icon={<Megaphone size={24} />}
                    title="No announcements"
                    description="Create announcements and tips visible to all students."
                    action={<button className="cc-btn-primary" style={{ height: 36, fontSize: 12 }} onClick={() => setAnnModal(true)}><Plus size={13} /> Create</button>}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {announcements.map(a => (
                    <div key={a._id} className="cc-card" style={{
                      display: "flex", alignItems: "flex-start", gap: 14,
                      borderLeft: `3px solid ${a.type === "warning" ? "var(--color-warning)" : a.type === "tip" ? "var(--color-gold)" : "var(--color-brand)"}`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-dark)" }}>{a.title}</div>
                          <span className={`cc-badge ${a.type === "warning" ? "cc-badge-warning" : a.type === "tip" ? "cc-badge-gold" : "cc-badge-info"}`} style={{ textTransform: "capitalize" }}>
                            {a.type}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--color-muted)", margin: 0, lineHeight: 1.6 }}>{a.message}</p>
                        <div style={{ fontSize: 11, color: "var(--color-subtle)", marginTop: 8 }}>
                          {new Date(a.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                      <button
                        className="cc-btn-ghost"
                        style={{ color: "var(--color-danger)", width: 32, height: 32, padding: 0, borderRadius: 7, flexShrink: 0 }}
                        onClick={() => setDelAnn(a._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── MODALS ── */}

      {/* Category modal */}
      <Modal open={catModal} onClose={() => { setCatModal(false); setCatEdit(null); }} title={catEdit ? "Edit Category" : "Add Default Category"} maxWidth={420}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setCatModal(false)} disabled={actionLoading}>Cancel</button>
            <button className="cc-btn-primary" onClick={saveCat} disabled={actionLoading}>
              {actionLoading ? <Spinner size={15} color="#fff" /> : <Plus size={15} />}
              {catEdit ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form onSubmit={saveCat} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="cc-label">Name</label>
            <input type="text" className="cc-input" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" required />
          </div>
          {!catEdit && (
            <div>
              <label className="cc-label">Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["expense", "income"].map(t => (
                  <button key={t} type="button" onClick={() => setCatForm(f => ({ ...f, type: t }))} style={{
                    height: 38, borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 13, textTransform: "capitalize",
                    border: `2px solid ${catForm.type === t ? "var(--color-brand)" : "var(--color-border)"}`,
                    background: catForm.type === t ? "var(--color-brand-light)" : "transparent",
                    color: catForm.type === t ? "var(--color-brand)" : "var(--color-muted)",
                  }}>{t}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="cc-label">Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setCatForm(f => ({ ...f, color: c }))} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                  outline: catForm.color === c ? `3px solid ${c}` : "none", outlineOffset: 2,
                }} />
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Announcement modal */}
      <Modal open={annModal} onClose={() => setAnnModal(false)} title="New Announcement" maxWidth={480}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setAnnModal(false)} disabled={actionLoading}>Cancel</button>
            <button className="cc-btn-primary" onClick={saveAnn} disabled={actionLoading}>
              {actionLoading ? <Spinner size={15} color="#fff" /> : <Megaphone size={15} />}
              Publish
            </button>
          </>
        }
      >
        <form onSubmit={saveAnn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="cc-label">Title</label>
            <input type="text" className="cc-input" value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" required />
          </div>
          <div>
            <label className="cc-label">Message</label>
            <textarea className="cc-textarea" value={annForm.message} onChange={e => setAnnForm(f => ({ ...f, message: e.target.value }))} placeholder="Write your message here..." required />
          </div>
          <div>
            <label className="cc-label">Type</label>
            <select className="cc-select" value={annForm.type} onChange={e => setAnnForm(f => ({ ...f, type: e.target.value }))}>
              <option value="info">ℹ️ Info</option>
              <option value="tip">💡 Tip</option>
              <option value="warning">⚠️ Warning</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete user confirm */}
      <Modal open={!!delUser} onClose={() => setDelUser(null)} title="Delete User" maxWidth={400}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setDelUser(null)} disabled={actionLoading}>Cancel</button>
            <button className="cc-btn-danger" onClick={deleteUser} disabled={actionLoading}>
              {actionLoading ? <Spinner size={15} color="#fff" /> : <Trash2 size={15} />} Delete
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
          Permanently delete this user account and all their data? This cannot be undone.
        </p>
      </Modal>

      {/* Delete category confirm */}
      <Modal open={!!delCat} onClose={() => setDelCat(null)} title="Delete Category" maxWidth={400}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setDelCat(null)} disabled={actionLoading}>Cancel</button>
            <button className="cc-btn-danger" onClick={deleteCat} disabled={actionLoading}>
              {actionLoading ? <Spinner size={15} color="#fff" /> : <Trash2 size={15} />} Delete
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
          Delete this default category? Students using it will keep their transactions, but the category will no longer appear in new ones.
        </p>
      </Modal>

      {/* Delete announcement confirm */}
      <Modal open={!!delAnn} onClose={() => setDelAnn(null)} title="Delete Announcement" maxWidth={400}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setDelAnn(null)} disabled={actionLoading}>Cancel</button>
            <button className="cc-btn-danger" onClick={deleteAnn} disabled={actionLoading}>
              {actionLoading ? <Spinner size={15} color="#fff" /> : <Trash2 size={15} />} Delete
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
          Delete this announcement? It will no longer be visible to students.
        </p>
      </Modal>
    </div>
  );
}
