import { FileText } from 'lucide-react';

export default function DocumentListItem({ title, onClick }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 bg-white/5 hover:bg-white/10
                 rounded-lg cursor-pointer transition-all group/doc"
      onClick={onClick}
    >
      <FileText className="w-3.5 h-3.5 text-white/40 group-hover/doc:text-emerald-400
                          transition-colors flex-shrink-0" />
      <span className="text-sm text-white/60 group-hover/doc:text-white/90
                       transition-colors truncate">
        {title}
      </span>
    </div>
  );
}
