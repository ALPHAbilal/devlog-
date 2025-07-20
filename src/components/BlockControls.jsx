import { useState } from 'react';
import { Trash2, GripVertical, MoreVertical, Copy, ArrowUp, ArrowDown } from 'lucide-react';

export default function BlockControls({ 
  onDelete, 
  onDuplicate, 
  onMoveUp, 
  onMoveDown,
  isVisible,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragEnd,
  blockId
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div 
      className="absolute -left-2 top-1 flex items-start gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 scale-100 md:scale-95 md:group-hover:scale-100 focus-within:opacity-100 focus-within:scale-100 transition-all duration-200 ease-out"
      style={{ zIndex: 20 }}>
      {/* Drag Handle */}
      <div className="flex flex-col gap-1 py-2">
        <div
          className="drag-handle p-2 md:p-1.5 rounded-md cursor-grab active:cursor-grabbing
                     text-text-secondary/40 hover:text-text-secondary
                     hover:bg-dark-secondary/50 transition-all duration-150
                     group min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 
                     flex items-center justify-center"
          title="Drag to reorder"
          draggable={true}
          onDragStart={(e) => {
            // Stop propagation to prevent parent handlers
            e.stopPropagation();
            // Set the drag data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(blockId));
            // Set a drag image to prevent default ghost image issues
            const dragImage = new Image();
            dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
            e.dataTransfer.setDragImage(dragImage, 0, 0);
            if (onDragStart) onDragStart(e);
          }}
          onDragEnd={(e) => {
            e.stopPropagation();
            if (onDragEnd) onDragEnd(e);
          }}
        >
          <GripVertical size={16} className="md:hidden group-hover:scale-110 transition-transform pointer-events-none" />
          <GripVertical size={14} className="hidden md:block group-hover:scale-110 transition-transform pointer-events-none" />
        </div>

        {/* More Options */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 md:p-1.5 rounded-md
                       text-text-secondary/40 hover:text-text-secondary
                       hover:bg-dark-secondary/50 transition-all duration-150
                       group min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 
                       flex items-center justify-center"
            title="More options"
          >
            <MoreVertical size={16} className="md:hidden group-hover:scale-110 transition-transform" />
            <MoreVertical size={14} className="hidden md:block group-hover:scale-110 transition-transform" />
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
                    className="w-full px-3 py-2 md:py-1.5 text-left text-sm
                               text-text-secondary hover:text-text-primary
                               hover:bg-dark-primary/50 transition-colors
                               flex items-center gap-2 min-h-[44px] md:min-h-0"
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
                    className="w-full px-3 py-2 md:py-1.5 text-left text-sm
                               text-text-secondary hover:text-text-primary
                               hover:bg-dark-primary/50 transition-colors
                               flex items-center gap-2 min-h-[44px] md:min-h-0"
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
                  className="w-full px-3 py-2 md:py-1.5 text-left text-sm
                             text-text-secondary hover:text-text-primary
                             hover:bg-dark-primary/50 transition-colors
                             flex items-center gap-2 min-h-[44px] md:min-h-0"
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
                  className="w-full px-3 py-2 md:py-1.5 text-left text-sm
                             text-red-400 hover:text-red-300
                             hover:bg-red-500/10 transition-colors
                             flex items-center gap-2 min-h-[44px] md:min-h-0"
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