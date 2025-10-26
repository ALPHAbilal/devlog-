import { ChevronDown, ChevronRight } from 'lucide-react';

export default function SidebarSectionHeader({
  title,
  isExpanded,
  onToggle,
  icon: Icon,
  count,
  actionButton
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 text-white/50 text-xs hover:text-white/80 transition-colors w-full group rounded-lg hover:bg-white/5 flex-shrink-0"
    >
      {isExpanded ? (
        <ChevronDown className="w-3.5 h-3.5 transition-transform" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 transition-transform" />
      )}
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span className="uppercase tracking-wider">{title}</span>
      <div className="ml-auto flex items-center gap-2">
        {count !== undefined && (
          <span className="text-xs text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
            {count}
          </span>
        )}
        {actionButton}
      </div>
    </button>
  );
}
