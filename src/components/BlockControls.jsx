import { useState } from 'react';
import { Trash2, GripVertical, MoreVertical, Copy, ArrowUp, ArrowDown } from 'lucide-react';

export default function BlockControls({ 
  onDelete, 
  onDuplicate, 
  onMoveUp, 
  onMoveDown,
  isVisible,
  canMoveUp,
  canMoveDown 
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`
      absolute -left-16 top-0 flex items-start gap-1 
      transition-all duration-200 ease-out z-20
      opacity-0 group-hover:opacity-100
      -translate-x-2 group-hover:translate-x-0
    `}>
      {/* Drag Handle */}
      <div className="flex flex-col gap-1 py-2">
        <button 
          className="p-1.5 rounded-md cursor-move
                     text-text-secondary/40 hover:text-text-secondary
                     hover:bg-dark-secondary/50 transition-all duration-150
                     group"
          title="Drag to reorder"
        >
          <GripVertical size={14} className="group-hover:scale-110 transition-transform" />
        </button>

        {/* More Options */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-md
                       text-text-secondary/40 hover:text-text-secondary
                       hover:bg-dark-secondary/50 transition-all duration-150
                       group"
            title="More options"
          >
            <MoreVertical size={14} className="group-hover:scale-110 transition-transform" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Click outside to close */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              
              <div className="absolute left-0 top-full mt-1 z-50
                              bg-dark-secondary/95 backdrop-blur-sm rounded-lg 
                              border border-dark-secondary/50 shadow-xl
                              py-1 min-w-[140px]
                              animate-in fade-in slide-in-from-top-1 duration-200">
                
                {/* Move Up */}
                {canMoveUp && (
                  <button
                    onClick={() => {
                      onMoveUp?.();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm
                               text-text-secondary hover:text-text-primary
                               hover:bg-dark-primary/50 transition-colors
                               flex items-center gap-2"
                  >
                    <ArrowUp size={14} />
                    Move up
                  </button>
                )}

                {/* Move Down */}
                {canMoveDown && (
                  <button
                    onClick={() => {
                      onMoveDown?.();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm
                               text-text-secondary hover:text-text-primary
                               hover:bg-dark-primary/50 transition-colors
                               flex items-center gap-2"
                  >
                    <ArrowDown size={14} />
                    Move down
                  </button>
                )}

                {/* Divider */}
                {(canMoveUp || canMoveDown) && (
                  <div className="h-px bg-dark-secondary/50 my-1" />
                )}

                {/* Duplicate */}
                <button
                  onClick={() => {
                    onDuplicate?.();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm
                             text-text-secondary hover:text-text-primary
                             hover:bg-dark-primary/50 transition-colors
                             flex items-center gap-2"
                >
                  <Copy size={14} />
                  Duplicate
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm
                             text-red-400 hover:text-red-300
                             hover:bg-red-500/10 transition-colors
                             flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}