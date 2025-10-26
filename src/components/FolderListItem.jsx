import { Folder, ChevronRight } from 'lucide-react';

export default function FolderListItem({ title, onClick }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20
                 rounded-lg cursor-pointer transition-all group/folder border border-blue-500/20"
      onClick={onClick}
    >
      <Folder className="w-3.5 h-3.5 text-blue-400 group-hover/folder:text-blue-300
                        transition-colors flex-shrink-0" />
      <span className="text-sm text-blue-300 group-hover/folder:text-blue-200
                       transition-colors truncate flex-1">
        {title}
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-blue-400/60 group-hover/folder:text-blue-300
                              transition-all flex-shrink-0" />
    </div>
  );
}
