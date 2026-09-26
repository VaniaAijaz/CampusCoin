/** Frosted glass skeleton — mirrors dashboard CSS grid exactly, zero CLS */
const S = ({ className = "" }) => (
  <div className={`animate-pulse bg-white/5 backdrop-blur-md border border-white/10 rounded-[32px] ${className}`} />
);

const SInner = ({ className = "" }) => (
  <div className={`animate-pulse bg-white/10 rounded-[16px] ${className}`} />
);

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Banner row */}
      <div className="flex flex-col md:flex-row gap-4">
        <S className="flex-1 h-[76px]" />
        <S className="w-full md:w-20 h-[76px] rounded-full" />
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <S key={i} className="p-6 h-36 flex flex-col justify-between">
            <div className="flex justify-between">
              <SInner className="h-3 w-24" />
              <SInner className="h-9 w-9 rounded-full" />
            </div>
            <div className="space-y-2">
              <SInner className="h-8 w-32" />
              <SInner className="h-5 w-28 rounded-full" />
            </div>
          </S>
        ))}
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        <S className="md:col-span-8 h-[340px]" />
        <S className="md:col-span-4 h-[340px]" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        <S className="md:col-span-4 h-[300px]" />
        <S className="md:col-span-8 h-[300px]" />
      </div>
    </div>
  );
}
