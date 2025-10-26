export default function SidebarSkeleton() {
  return (
    <div className="w-72 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden flex flex-col relative animate-pulse">
      {/* Collapse Button Skeleton */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="w-full h-10 bg-white/5 rounded-lg" />
      </div>

      {/* Separator */}
      <div className="h-px bg-white/10 mx-4 mb-3" />

      {/* Favorites Section Skeleton */}
      <div className="px-4 flex-shrink-0">
        <div className="pb-4">
          {/* Favorites Header */}
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-3.5 h-3.5 bg-white/5 rounded" />
            <div className="w-3.5 h-3.5 bg-white/5 rounded" />
            <div className="w-20 h-3 bg-white/5 rounded" />
          </div>

          {/* Favorite Folder Items */}
          <div className="space-y-1">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                <div className="w-3 h-3 bg-white/5 rounded flex-shrink-0" />
                <div className="w-4 h-4 bg-blue-400/10 rounded flex-shrink-0" />
                <div className="flex-1 h-3 bg-white/5 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
                <div className="w-8 h-5 bg-white/5 rounded-md flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/5 my-4" />
      </div>

      {/* Explorer Section Skeleton */}
      <div className="flex-1 px-4 min-h-0 flex flex-col pb-4">
        {/* Explorer Header */}
        <div className="flex items-center gap-2 px-3 py-2 mb-2 flex-shrink-0">
          <div className="w-3.5 h-3.5 bg-white/5 rounded" />
          <div className="w-24 h-3 bg-white/5 rounded" />
        </div>

        {/* Folder Items */}
        <div className="space-y-1 pr-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="w-3 h-3 bg-white/5 rounded flex-shrink-0" />
              <div className="w-4 h-4 bg-blue-400/10 rounded flex-shrink-0" />
              <div className="flex-1 h-3 bg-white/5 rounded" style={{ width: `${50 + Math.random() * 40}%` }} />
              <div className="w-8 h-5 bg-white/5 rounded-md flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-4 flex-shrink-0" />
    </div>
  );
}
