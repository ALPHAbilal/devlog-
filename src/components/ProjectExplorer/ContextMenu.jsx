import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Add slight delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEscape);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  
  // Adjust position to keep menu in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);
  
  return createPortal(
    <div
      ref={menuRef}
      className={`
        fixed z-50 min-w-[200px]
        bg-surface-2/95 backdrop-blur-lg
        border border-surface-3/50
        rounded-lg shadow-2xl
        py-1
        animate-in fade-in slide-in-from-top-1
        duration-200
      `}
      style={{ 
        left: adjustedX, 
        top: adjustedY,
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-surface-3/10 to-transparent pointer-events-none" />
      
      {items.map((item, index) => (
        item.divider ? (
          <div 
            key={index} 
            className="my-1 border-t border-surface-3/30" 
          />
        ) : (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            className={`
              relative w-full flex items-center gap-3 px-3 py-2
              text-sm text-left transition-all duration-150
              ${item.disabled 
                ? 'text-text-secondary/30 cursor-not-allowed' 
                : item.danger
                  ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                  : 'text-text-secondary hover:bg-surface-3/50 hover:text-text-primary'
              }
              ${!item.disabled && !item.danger ? 'hover:pl-4' : ''}
            `}
          >
            {/* Hover indicator */}
            {!item.disabled && (
              <div className={`
                absolute left-0 top-1/2 -translate-y-1/2 
                w-0.5 h-0 bg-accent-green
                transition-all duration-150
                ${item.danger ? 'bg-red-400' : ''}
                group-hover:h-4
              `} />
            )}
            
            {item.icon && (
              <item.icon 
                size={14} 
                className={`
                  flex-shrink-0 transition-transform duration-150
                  ${!item.disabled ? 'group-hover:scale-110' : ''}
                `}
              />
            )}
            
            <span className="flex-1">{item.label}</span>
            
            {item.shortcut && (
              <span className={`
                text-xs px-2 py-0.5 rounded
                ${item.disabled 
                  ? 'text-text-secondary/20 bg-surface-3/10' 
                  : 'text-text-secondary/60 bg-surface-3/30'
                }
              `}>
                {item.shortcut}
              </span>
            )}
          </button>
        )
      ))}
    </div>,
    document.body
  );
}