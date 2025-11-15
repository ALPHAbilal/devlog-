export default function DocumentCardSkeleton() {
  return (
    <div className="group relative bg-gradient-to-br from-[#1a2942]/40 to-[#0f1d32]/40 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden self-start animate-pulse">
      <div className="relative p-5 flex flex-col h-full min-h-[140px]">
        {/* Title skeleton - 3 lines */}
        <div className="space-y-2 mb-4 min-h-[4.5rem]">
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-4/5" />
          <div className="h-3 bg-white/5 rounded w-3/5" />
        </div>

        {/* Chart skeleton - subtle bars */}
        <div className="mt-auto h-16 flex items-end gap-1 px-1 pb-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-blue-500/10 rounded-t"
              style={{
                height: `${30 + Math.random() * 50}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
