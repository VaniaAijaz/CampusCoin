import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3, Calendar, Download,
  PieChart as PieIcon, TrendingUp, Tag,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  getMonthlySummary, getReportByCategory,
  getSixMonthsTrends, getDailyReport, getTopCategory,
} from "./reportsApi";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";
import toast from "react-hot-toast";
import { generateStatementPDF } from "./StatementGenerator";
import { useAuth } from "../auth/AuthContext";
import AdSenseAd from "../../components/ads/AdSenseAd";

/* ── exact landing page tokens ── */
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

/* Brand-aligned chart palette — landing page colors only */
const CHART_COLORS = [
  "oklch(0.59 0.22 262)",  // brand blue
  "oklch(0.64 0.17 157)",  // growth green
  "oklch(0.88 0.18 157)",  // highlight
  "oklch(0.61 0.23 290)",  // cardOrbit purple
  "oklch(0.73 0.18 252)",  // heroMuted blue
  "oklch(0.83 0.17 70)",   // cardSun amber
  "oklch(0.59 0.18 230)",  // teal
  "oklch(0.5 0.025 255)",  // muted
];

/* Custom tooltip */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...M, background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:10, padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.08)", fontSize:12 }}>
      <p style={{ fontWeight:700, color:C.muted, marginBottom:8, fontSize:10, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:16, marginBottom:3 }}>
          <span style={{ color:p.fill||p.color, fontWeight:600 }}>{p.name}</span>
          <span style={{ color:C.foreground, fontWeight:800 }}>${Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [endDate,      setEndDate]      = useState(() => new Date().toISOString().split("T")[0]);
  const [summary,      setSummary]      = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [sixMonths,    setSixMonths]    = useState([]);
  const [dailyData,    setDailyData]    = useState([]);
  const [topCat,       setTopCat]       = useState(null);
  const [loading,      setLoading]      = useState(true);

  /* ── all logic exactly preserved ── */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, sixRes, dailyRes, topRes] = await Promise.all([
        getMonthlySummary(endDate), getReportByCategory(endDate,"expense"),
        getSixMonthsTrends(), getDailyReport(endDate), getTopCategory(),
      ]);
      if (sumRes.success)   setSummary(sumRes);
      if (catRes.success)   setCategoryData(catRes.data);
      if (sixRes.success)   setSixMonths(sixRes.data);
      if (dailyRes.success) setDailyData(dailyRes.data);
      if (topRes.success)   setTopCat(topRes.topCategory);
    } catch { toast.error("Failed to load analytics reports."); }
    finally { setLoading(false); }
  }, [endDate]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const formattedDaily = useMemo(() => {
    if (!dailyData?.length) return [];
    const map = {};
    dailyData.forEach(item => {
      const day = item._id?.day, type = item._id?.type;
      if (!map[day]) map[day] = { day:`Day ${day}`, income:0, expense:0 };
      if (type==="income") map[day].income=item.total;
      else if (type==="expense") map[day].expense=item.total;
    });
    return Object.values(map);
  }, [dailyData]);

  const pieData = useMemo(() => categoryData.map((cat,i) => ({ ...cat, fill:cat.color||CHART_COLORS[i%CHART_COLORS.length] })), [categoryData]);

  const handleDownloadPDF = () => generateStatementPDF(user, endDate);

  /* summary values */
  const inc = summary?.income  || 0;
  const exp = summary?.expense || 0;
  const bal = summary?.balance || 0;

  return (
    <div style={{ ...M, display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── HEADER ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div>
          <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 6px" }}>
            Analytics
          </p>
          <h1 style={{ fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:900, color:C.foreground, margin:0, letterSpacing:"-0.03em", lineHeight:1 }}>
            Financial Reports
          </h1>
          <p style={{ fontSize:14, color:C.muted, margin:"6px 0 0", fontWeight:500 }}>
            In-depth breakdowns, multi-month trajectories and exportable statements.
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          <input type="date" max={new Date().toISOString().split("T")[0]} value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ padding:"9px 14px", borderRadius:999, border:`1.5px solid ${C.border}`, background:"#fff", fontSize:13, color:C.foreground, outline:"none", cursor:"pointer", ...M }}
            onFocus={e => e.target.style.borderColor=C.brand}
            onBlur={e => e.target.style.borderColor=C.border}
          />
          <button onClick={handleDownloadPDF} style={{
            display:"inline-flex", alignItems:"center", gap:7, height:42, padding:"0 22px", borderRadius:999,
            background:C.highlight, color:C.highlightFg, border:"none", fontSize:14, fontWeight:800, cursor:"pointer", ...M,
            boxShadow:`0 4px 16px ${C.highlight}55`, transition:"background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background="oklch(0.82 0.18 157)"}
            onMouseLeave={e => e.currentTarget.style.background=C.highlight}
          >
            <Download style={{ width:15 }} />
            Download Statement
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", background:C.border }}>
        {[
          { label:"Total Income",  value:inc, accent:C.growth, soft:C.growthSoft, icon:<ArrowUpRight style={{ width:18 }} />,   sub:"Stipends & allowances" },
          { label:"Total Expenses",value:exp, accent:C.brand,  soft:C.brandSoft,  icon:<ArrowDownRight style={{ width:18 }} />, sub:"All campus spending"   },
          { label:"Net Margin",    value:bal, accent: bal>=0 ? C.growth : C.brand, soft: bal>=0 ? C.growthSoft : C.brandSoft, icon:<TrendingUp style={{ width:18 }} />, sub: bal>=0 ? "Surplus" : "Deficit", signed:true },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", padding:"22px 22px" }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:s.soft, color:s.accent, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
              {s.icon}
            </div>
            <div style={{ fontSize:"clamp(1.5rem,3vw,2rem)", fontWeight:900, color:s.accent, letterSpacing:"-0.03em", lineHeight:1, marginBottom:4 }}>
              {s.signed && bal>=0 ? "+" : ""} ${Math.abs(s.value).toFixed(2)}
            </div>
            <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 4px" }}>{s.label}</p>
            <p style={{ fontSize:12, color:C.muted, margin:0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── BENTO: PIE + TABLE ── */}
      <div style={{ display:"grid", gap:16, gridTemplateColumns:"1fr 1fr" }}>

        {/* Pie — white card */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, padding:"24px" }}>
          <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 6px" }}>Breakdown</p>
          <h3 style={{ fontSize:18, fontWeight:900, color:C.foreground, margin:"0 0 16px", letterSpacing:"-0.02em", paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>
            Spending by Category
          </h3>
          {pieData.length > 0 ? (
            <>
              <div style={{ height:220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3}>
                      {pieData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px", paddingTop:14, borderTop:`1px solid ${C.border}`, marginTop:8 }}>
                {categoryData.map((cat,i) => (
                  <div key={cat._id} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12 }}>
                    <span style={{ width:9, height:9, borderRadius:"50%", background:cat.color||CHART_COLORS[i%CHART_COLORS.length], flexShrink:0, display:"block" }} />
                    <span style={{ color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{cat.name}</span>
                    <span style={{ fontWeight:700, color:C.foreground, flexShrink:0 }}>${cat.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding:"48px 0", textAlign:"center", color:C.muted, fontSize:13 }}>No expense data up to this date.</div>
          )}
        </div>

        {/* Category table — brand blue panel (landing page feature block style) */}
        <div style={{ background:C.brand, borderRadius:8, padding:"24px", position:"relative", overflow:"hidden" }}>
          {/* grid overlay */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.1,
            backgroundImage:`linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)`,
            backgroundSize:"40px 40px" }} />
          <div style={{ position:"relative", zIndex:1 }}>
            <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:"rgba(255,255,255,0.55)", margin:"0 0 6px" }}>Rankings</p>
            <h3 style={{ fontSize:18, fontWeight:900, color:C.heroFg, margin:"0 0 16px", letterSpacing:"-0.02em", paddingBottom:16, borderBottom:"1px solid rgba(255,255,255,0.15)" }}>
              Category Frequency
            </h3>
            {categoryData.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {categoryData.map((cat,i) => {
                  const maxTotal = Math.max(...categoryData.map(c => c.total));
                  const pct = maxTotal > 0 ? (cat.total/maxTotal)*100 : 0;
                  return (
                    <div key={cat._id} style={{ padding:"10px 12px", borderRadius:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.12)" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:cat.color||CHART_COLORS[i%CHART_COLORS.length], display:"block" }} />
                          <span style={{ fontSize:13, fontWeight:700, color:C.heroFg }}>{cat.name}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:11, color:"rgba(255,255,255,0.55)", fontWeight:500 }}>{cat.count} txs</span>
                          <span style={{ fontSize:13, fontWeight:800, color:C.highlight }}>${cat.total.toFixed(2)}</span>
                        </div>
                      </div>
                      <div style={{ height:4, background:"rgba(255,255,255,0.15)", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:C.highlight, borderRadius:99, transition:"width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding:"48px 0", textAlign:"center", color:"rgba(255,255,255,0.4)", fontSize:13 }}>No category data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── 6-MONTH BAR CHART — white card ── */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, padding:"24px" }}>
        <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 6px" }}>Trajectory</p>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${C.border}`, flexWrap:"wrap" }}>
          <h3 style={{ fontSize:18, fontWeight:900, color:C.foreground, margin:0, letterSpacing:"-0.02em" }}>
            6-Month Comparison
          </h3>
          <div style={{ display:"flex", gap:16 }}>
            {[{ l:"Income", c:C.growth },{ l:"Expense", c:C.brand }].map(x => (
              <div key={x.l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.muted, fontWeight:600 }}>
                <span style={{ width:9, height:9, borderRadius:"50%", background:x.c, display:"block" }} />
                {x.l}
              </div>
            ))}
          </div>
        </div>
        <div style={{ height:280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sixMonths} margin={{ top:8, right:8, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="month" stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} fontFamily="Manrope" />
              <YAxis stroke={C.muted} fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} fontFamily="Manrope" />
              <Tooltip content={<ChartTip />} cursor={{ fill:`${C.brand}08` }} />
              <Bar dataKey="income"  name="Income"  fill={C.growth} radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expense" fill={C.brand}  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── DAILY AREA CHART — dark hero panel ── */}
      {formattedDaily.length > 0 && (
        <div style={{ background:C.hero, borderRadius:8, padding:"24px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.14,
            backgroundImage:`linear-gradient(${C.heroLine} 1px,transparent 1px),linear-gradient(90deg,${C.heroLine} 1px,transparent 1px)`,
            backgroundSize:"72px 72px",
            WebkitMaskImage:"linear-gradient(to bottom,black,transparent 90%)",
            maskImage:"linear-gradient(to bottom,black,transparent 90%)" }} />
          <div style={{ position:"relative", zIndex:1 }}>
            <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.highlight, margin:"0 0 6px" }}>Daily Pattern</p>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${C.heroLine}`, flexWrap:"wrap" }}>
              <h3 style={{ fontSize:18, fontWeight:900, color:C.heroFg, margin:0, letterSpacing:"-0.02em" }}>
                Daily Cash Flow — {new Date(endDate).toLocaleString("default",{month:"long",year:"numeric"})}
              </h3>
              <div style={{ display:"flex", gap:16 }}>
                {[{ l:"Income", c:C.highlight },{ l:"Expense", c:C.growth }].map(x => (
                  <div key={x.l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.heroMuted, fontWeight:600 }}>
                    <span style={{ width:9, height:9, borderRadius:"50%", background:x.c, display:"block" }} />
                    {x.l}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height:240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedDaily} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="dInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.highlight} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C.highlight} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.growth} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={C.growth} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.heroLine} vertical={false} />
                  <XAxis dataKey="day" stroke={C.heroMuted} fontSize={10} tickLine={false} axisLine={false} fontFamily="Manrope" />
                  <YAxis stroke={C.heroMuted} fontSize={10} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`} fontFamily="Manrope" />
                  <Tooltip content={<ChartTip />} cursor={{ stroke:`${C.highlight}30`, strokeWidth:1 }} />
                  <Area type="monotone" dataKey="income"  name="Income"  stroke={C.highlight} strokeWidth={2} fill="url(#dInc)" dot={false} />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke={C.growth}    strokeWidth={2} fill="url(#dExp)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <AdSenseAd slot="reports" />
    </div>
  );
}
