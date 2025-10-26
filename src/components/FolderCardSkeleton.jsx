export default function FolderCardSkeleton() {
  return (
    <div className="group relative bg-gradient-to-br from-[#1a2942]/40 to-[#0f1d32]/40 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden self-start animate-pulse">
      <div className="relative p-5">
        <div className="flex items-start gap-3 mb-3">
          {/* Folder icon skeleton */}
          <div className="flex-shrink-0 mt-0.5 w-5 h-5 bg-blue-400/20 rounded" />

          <div className="flex-1 min-w-0">
            {/* Title skeleton */}
            <div className="space-y-2 mb-3">
              <div className="h-3 bg-white/5 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>

            {/* Count badge skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 bg-white/5 rounded-md" />
            </div>
          </div>

          {/* Chevron skeleton */}
          <div className="w-4 h-4 bg-white/5 rounded flex-shrink-0 mt-0.5" />
        </div>
      </div>
    </div>
  );
}
