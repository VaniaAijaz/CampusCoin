import React from "react";

const skeletonCardClass =
  "animate-pulse bg-[#111726] border border-slate-800 shadow-xl rounded-3xl";

/**
 * Top Header Skeleton
 */
export function TopHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-30 bg-[#0B0F19]/95 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between h-[69px]">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="h-6 w-24 bg-slate-800 rounded-full" />
        <div className="hidden sm:block h-6 w-32 bg-slate-800/80 rounded-full" />
      </div>

      <div className="flex items-center gap-3 animate-pulse">
        <div className="hidden sm:flex flex-col items-end gap-1.5 mr-2">
          <div className="h-3 w-28 bg-slate-800 rounded-full" />
          <div className="h-2.5 w-16 bg-slate-800/80 rounded-full" />
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
      </div>
    </header>
  );
}

/**
 * Sidebar / Bottom Nav Skeleton
 */
export function SidebarSkeleton() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-[#0E1322] border-r border-slate-800 z-40 p-5 justify-between">
        <div>
          {/* Brand header skeleton */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 bg-slate-700 rounded-full" />
              <div className="h-2.5 w-16 bg-slate-800 rounded-full" />
            </div>
          </div>

          {/* Menu items */}
          <div className="space-y-2 mt-4 animate-pulse">
            <div className="h-2.5 w-12 bg-slate-800 rounded-full mb-3 ml-2" />
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-800/30"
              >
                <div className="w-4 h-4 rounded-md bg-slate-700" />
                <div
                  className="h-3 bg-slate-800 rounded-full"
                  style={{ width: `${60 + (i % 3) * 20}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom logout skeleton */}
        <div className="pt-4 border-t border-slate-800 animate-pulse">
          <div className="w-full h-10 rounded-xl bg-slate-800 border border-slate-700" />
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0E1322] border-t border-slate-800 flex items-center justify-around px-4 z-40 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded-md bg-slate-700" />
            <div className="h-2 w-8 bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Exact Solid Dark Web Colors Dashboard Skeleton
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full" aria-label="Loading dashboard" role="status">
      {/* Top Banner Row (AI Advisor + IOU Tracker button) */}
      <div className="flex flex-col md:flex-row gap-4 items-center w-full">
        <div
          className={`${skeletonCardClass} p-5 flex items-center justify-between gap-4 w-full h-[76px]`}
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 shrink-0" />
            <div className="space-y-2 flex-1 max-w-md">
              <div className="h-2.5 w-28 bg-slate-700/60 rounded-full" />
              <div className="h-3.5 w-3/4 bg-slate-700 rounded-full" />
            </div>
          </div>
          <div className="hidden sm:block w-36 h-9 rounded-xl bg-slate-800 border border-slate-700 shrink-0" />
        </div>

        <div
          className={`${skeletonCardClass} p-5 flex items-center justify-center gap-2 w-full md:w-36 h-[76px] shrink-0`}
        >
          <div className="w-5 h-5 rounded-full bg-slate-700" />
          <div className="h-3.5 w-16 bg-slate-800 rounded-full" />
        </div>
      </div>

      {/* Top Row (Metrics): A grid of 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`${skeletonCardClass} p-5 flex flex-col justify-between h-[138px]`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="h-3 w-24 bg-slate-700 rounded-full" />
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700" />
            </div>

            <div>
              <div className="h-7 w-32 bg-slate-700 rounded-lg mb-2" />
              <div className="h-3 w-28 bg-slate-800 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Middle Row (Charts & Bills): 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Cash Flow chart skeleton */}
        <div className={`md:col-span-8 ${skeletonCardClass} p-6 flex flex-col h-[340px]`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-slate-700" />
              <div className="h-5 w-44 bg-slate-700 rounded-full" />
            </div>
            <div className="h-7 w-28 rounded-full bg-slate-800 border border-slate-700" />
          </div>

          <div className="flex-1 w-full flex flex-col justify-between pt-4 pb-2 border-b border-slate-800">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-full border-b border-dashed border-slate-800 h-0"
              />
            ))}
          </div>
          <div className="flex justify-between mt-3 px-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-2.5 w-8 bg-slate-800 rounded-full" />
            ))}
          </div>
        </div>

        {/* Right: Upcoming Bills skeleton */}
        <div className={`md:col-span-4 ${skeletonCardClass} p-6 flex flex-col h-[340px]`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 rounded-md bg-slate-700" />
            <div className="h-5 w-32 bg-slate-700 rounded-full" />
          </div>

          <div className="flex-1 flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 p-3 rounded-2xl bg-[#0B0F19] border border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-20 bg-slate-700 rounded-full" />
                      <div className="h-2.5 w-14 bg-slate-800 rounded-full" />
                    </div>
                  </div>
                  <div className="h-3.5 w-12 bg-slate-700 rounded-full" />
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1" />
              </div>
            ))}
          </div>

          <div className="mt-4 w-full h-10 rounded-xl bg-slate-800 border border-slate-700" />
        </div>
      </div>

      {/* Bottom Row (Transactions & Net Flow): 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Money Flow block */}
        <div className={`md:col-span-4 ${skeletonCardClass} p-6 flex flex-col h-[350px]`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 rounded-md bg-slate-700" />
            <div className="h-5 w-28 bg-slate-700 rounded-full" />
          </div>
          <div className="flex-1 w-full rounded-2xl bg-[#0B0F19] border border-slate-800 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
          </div>
        </div>

        {/* Right: Table data skeleton */}
        <div className={`md:col-span-8 ${skeletonCardClass} p-6 flex flex-col min-h-[350px]`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-slate-700" />
              <div className="h-5 w-44 bg-slate-700 rounded-full" />
            </div>
            <div className="h-8 w-44 rounded-full bg-slate-800 border border-slate-700" />
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2 px-2">
            <div className="h-2.5 w-12 bg-slate-800 rounded-full" />
            <div className="h-2.5 w-28 bg-slate-800 rounded-full" />
            <div className="h-2.5 w-16 bg-slate-800 rounded-full" />
            <div className="h-2.5 w-14 bg-slate-800 rounded-full" />
          </div>

          <div className="space-y-3 flex-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-2 rounded-xl bg-[#0B0F19]/60"
              >
                <div className="h-3 w-14 bg-slate-700 rounded-full" />
                <div className="h-3.5 w-32 bg-slate-700 rounded-full" />
                <div className="h-5 w-20 rounded-full bg-slate-800 border border-slate-700" />
                <div className="h-3.5 w-16 bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>

          <div className="mt-4 w-full h-10 rounded-xl bg-slate-800 border border-slate-700" />
        </div>
      </div>
    </div>
  );
}

/**
 * Full Page Dashboard Skeleton including Sidebar, Top Header, and Dashboard Grid
 */
export function FullDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col relative overflow-x-hidden">
      <SidebarSkeleton />
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-0">
        <TopHeaderSkeleton />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <DashboardSkeleton />
        </main>
      </div>
    </div>
  );
}
