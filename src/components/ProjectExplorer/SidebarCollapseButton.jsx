import { PanelLeftClose } from 'lucide-react';

export default function SidebarCollapseButton({ onToggle }) {
  return (
    <div className="px-4 pt-3 pb-2 flex-shrink-0">
      <button
        onClick={onToggle}
        className="w-full h-10 px-3 text-white/40 hover:text-white/90 hover:bg-white/10 transition-all rounded-lg flex items-center justify-center gap-2"
      >
        <PanelLeftClose className="w-4 h-4" />
        <span className="text-xs">Collapse</span>
      </button>
    </div>
  );
}
