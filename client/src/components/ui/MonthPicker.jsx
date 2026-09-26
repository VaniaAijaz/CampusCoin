/**
 * MonthPicker — Production-level month/year picker
 * Matches the glass design system. No external deps.
 * Usage: <MonthPicker value="2026-09" onChange={(v) => setMonth(v)} />
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function MonthPicker({ value, onChange, minYear = 2020, maxYear = 2030 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Parse value "YYYY-MM"
  const [selYear, selMonth] = value
    ? [parseInt(value.split("-")[0]), parseInt(value.split("-")[1]) - 1]
    : [new Date().getFullYear(), new Date().getMonth()];

  const [viewYear, setViewYear] = useState(selYear);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (monthIdx) => {
    const mm = String(monthIdx + 1).padStart(2, "0");
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
  };

  const isSelected = (monthIdx) => monthIdx === selMonth && viewYear === selYear;
  const isCurrentMonth = (monthIdx) => {
    const now = new Date();
    return monthIdx === now.getMonth() && viewYear === now.getFullYear();
  };

  const displayLabel = value
    ? `${MONTH_FULL[selMonth]} ${selYear}`
    : "Select Month";

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen((o) => !o); setViewYear(selYear); }}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-[14px]
                   bg-white/15 hover:bg-white/22 backdrop-blur-[20px]
                   border border-white/25 hover:border-white/40
                   text-white text-sm font-semibold
                   shadow-[0_4px_16px_rgba(0,0,0,0.2)]
                   transition-all duration-200 cursor-pointer active:scale-[0.98] min-w-[180px]"
      >
        <Calendar className="w-4 h-4 text-white/70 shrink-0" />
        <span className="flex-1 text-left">{displayLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.96, y: -6  }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-[280px]
                       rounded-[20px] bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%]
                       border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.4)]
                       overflow-hidden"
          >
            {/* Year navigation */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10">
              <button
                onClick={() => setViewYear((y) => Math.max(y - 1, minYear))}
                disabled={viewYear <= minYear}
                className="w-7 h-7 rounded-full flex items-center justify-center
                           text-white/60 hover:text-white hover:bg-white/15
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center">
                <span className="text-base font-black text-white tracking-tight">{viewYear}</span>
                <span className="text-[10px] text-white/45 font-medium">Select a month</span>
              </div>

              <button
                onClick={() => setViewYear((y) => Math.min(y + 1, maxYear))}
                disabled={viewYear >= maxYear}
                className="w-7 h-7 rounded-full flex items-center justify-center
                           text-white/60 hover:text-white hover:bg-white/15
                           disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-4 gap-1.5 p-3.5">
              {MONTHS.map((m, idx) => {
                const selected = isSelected(idx);
                const current  = isCurrentMonth(idx);
                return (
                  <button
                    key={m}
                    onClick={() => select(idx)}
                    className={`relative py-2.5 rounded-[12px] text-xs font-bold
                                transition-all duration-150 cursor-pointer active:scale-95
                                ${selected
                                  ? "bg-white text-slate-900 shadow-[0_4px_12px_rgba(255,255,255,0.25)]"
                                  : current
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "text-white/70 hover:text-white hover:bg-white/15"
                                }`}
                  >
                    {m}
                    {/* Current month dot */}
                    {current && !selected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/70" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick jump — current month */}
            <div className="px-3.5 pb-3">
              <button
                onClick={() => {
                  const now = new Date();
                  const mm = String(now.getMonth() + 1).padStart(2, "0");
                  onChange(`${now.getFullYear()}-${mm}`);
                  setOpen(false);
                }}
                className="w-full py-2 rounded-[12px] bg-white/10 hover:bg-white/18
                           border border-white/15 text-[11px] text-white/70 hover:text-white
                           font-semibold transition-all cursor-pointer"
              >
                Jump to Current Month
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
