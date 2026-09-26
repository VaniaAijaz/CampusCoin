/**
 * Frosted Glass Skeleton — Exact Apple visionOS Standard
 * Formula: animate-pulse bg-white/5 backdrop-blur-3xl border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]
 * Continuous Squircle Curves: rounded-[32px] for major cards, rounded-[16px] for inner elements, rounded-full for pills.
 * Perfectly mirrors dashboard CSS grid for zero Cumulative Layout Shift (CLS).
 */

const SkeletonCard = ({ className = "", children }) => (
  <div
    className={`glass-skeleton animate-pulse bg-white/5 backdrop-blur-3xl border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)] rounded-[32px] ${className}`}
  >
    {children}
  </div>
);

const SkeletonInner = ({ className = "" }) => (
  <div className={`animate-pulse bg-white/10 rounded-[16px] ${className}`} />
);

const SkeletonPill = ({ className = "" }) => (
  <div className={`animate-pulse bg-white/15 rounded-full ${className}`} />
);

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full" aria-label="Loading dashboard" role="status">
      {/* Top Banner Row (AI Advisor + IOU Tracker button) */}
      <div className="flex flex-col md:flex-row gap-4 items-center w-full">
        <SkeletonCard className="p-5 flex items-center justify-between gap-4 w-full h-[76px]">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 shrink-0" />
            <div className="space-y-2 flex-1 max-w-md">
              <SkeletonInner className="h-2.5 w-24" />
              <SkeletonInner className="h-3.5 w-3/4" />
            </div>
          </div>
          <SkeletonPill className="hidden sm:block w-28 h-9" />
        </SkeletonCard>

        <SkeletonCard className="p-5 flex items-center justify-center gap-2.5 w-full md:w-36 h-[76px] shrink-0 !rounded-full">
          <div className="w-5 h-5 rounded-full bg-white/20" />
          <SkeletonInner className="h-3 w-16" />
        </SkeletonCard>
      </div>

      {/* Top Metric Grid: 4 Glass Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} className="p-6 h-[148px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <SkeletonInner className="h-3 w-20" />
              <div className="w-8 h-8 rounded-full bg-white/15" />
            </div>
            <div className="space-y-2.5">
              <SkeletonInner className="h-7 w-28" />
              <SkeletonPill className="h-5 w-32" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Middle Row (Cash Flow + Upcoming Bills): 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Cash Flow Chart Skeleton */}
        <SkeletonCard className="md:col-span-8 p-6 sm:p-7 flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/15" />
              <SkeletonInner className="h-4 w-40" />
            </div>
            <SkeletonPill className="h-7 w-28" />
          </div>
          <div className="flex-1 w-full rounded-[24px] bg-white/[0.03] border border-white/10 flex items-center justify-center p-6">
            <div className="w-full h-full flex flex-col justify-between">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full border-b border-white/10 h-0" />
              ))}
            </div>
          </div>
        </SkeletonCard>

        {/* Right: Upcoming Bills Skeleton */}
        <SkeletonCard className="md:col-span-4 p-6 sm:p-7 flex flex-col justify-between h-[350px]">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-7 h-7 rounded-full bg-white/15" />
              <SkeletonInner className="h-4 w-32" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3.5 rounded-[20px] bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/15" />
                      <SkeletonInner className="h-3 w-16" />
                    </div>
                    <SkeletonInner className="h-3 w-12" />
                  </div>
                  <SkeletonPill className="w-full h-1.5" />
                </div>
              ))}
            </div>
          </div>
          <SkeletonPill className="mt-4 w-full h-9" />
        </SkeletonCard>
      </div>

      {/* Bottom Row (Money Flow + Transactions Table): 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Money Flow Ring/Area Skeleton */}
        <SkeletonCard className="md:col-span-4 p-6 sm:p-7 flex flex-col h-[350px]">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-full bg-white/15" />
            <SkeletonInner className="h-4 w-28" />
          </div>
          <div className="flex-1 w-full rounded-[24px] bg-white/[0.03] border border-white/10 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          </div>
        </SkeletonCard>

        {/* Right: Transactions Table Skeleton */}
        <SkeletonCard className="md:col-span-8 p-6 sm:p-7 flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/15" />
              <SkeletonInner className="h-4 w-40" />
            </div>
            <SkeletonPill className="h-8 w-24" />
          </div>
          <div className="space-y-2.5 flex-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-[16px] bg-white/[0.03]">
                <SkeletonInner className="h-3 w-16" />
                <SkeletonInner className="h-3 w-36" />
                <SkeletonPill className="h-6 w-20" />
                <SkeletonInner className="h-3 w-14" />
              </div>
            ))}
          </div>
          <SkeletonPill className="mt-4 w-full h-9" />
        </SkeletonCard>
      </div>
    </div>
  );
}
