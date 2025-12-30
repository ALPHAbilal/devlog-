import { Plus, FileText } from 'lucide-react';

export default function EmptyState({ onCreateNew }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-white/30" />
      </div>

      <h2 className="text-xl font-semibold text-white/90 mb-2">
        No document open
      </h2>

      <p className="text-white/50 mb-6 max-w-md">
        Select a document from the sidebar or create a new one to get started.
      </p>

      <button
        onClick={() => {
          console.log('[DEBUG-CREATE-7] EmptyState "New Document" button clicked');
          onCreateNew?.();
        }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   bg-emerald-500/20 text-emerald-400
                   hover:bg-emerald-500/30 transition-all duration-200
                   border border-emerald-500/30"
      >
        <Plus size={18} />
        <span>New Document</span>
      </button>

      <p className="text-white/30 text-sm mt-4">
        or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">Cmd+T</kbd>
      </p>
    </div>
  );
}
