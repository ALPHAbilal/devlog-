import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Folder, FolderOpen, FileText, MoreHorizontal, FolderPlus, FilePlus, Trash2 } from 'lucide-react';

export default function SidebarTreeItemEnhanced({
  item,
  isExpanded,
  onToggle,
  expandedFolders,
  depth = 0,
  isFavorite = false,
  isLast = false,
  onItemClick,
  onContextMenu,
  isSelected = false,
  viewMode = 'tree' // 'tree' | 'table' | 'compact'
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isFile = item.type === 'file' || item.type === 'document';
  const itemCount = item.count || (item.children ? item.children.length : 0);

  // State for dropdown menu
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Click-outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // View mode specific styles
  const getViewModeStyles = () => {
    switch (viewMode) {
      case 'compact':
        return {
          padding: 'py-0.5',
          iconSize: 'w-3 h-3',
          fontSize: 'text-xs',
          spacing: 'gap-1.5',
        };
      case 'table':
        return {
          padding: 'py-2',
          iconSize: 'w-4 h-4',
          fontSize: 'text-sm',
          spacing: 'gap-2',
        };
      case 'tree':
      default:
        return {
          padding: 'py-1.5',
          iconSize: 'w-3.5 h-3.5',
          fontSize: 'text-[13px]',
          spacing: 'gap-2',
        };
    }
  };

  const styles = getViewModeStyles();

  const handleClick = () => {
    if (isFile) {
      onItemClick?.(item);
    } else {
      onToggle?.(item.id);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, left: rect.left });
    }
    setShowMenu(!showMenu);
  };

  // Context Menu Portal - shared between all views
  const contextMenuPortal = showMenu && createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 9999 }}
      className="bg-[#1a2942]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl w-48 py-1 animate-in fade-in slide-in-from-top-1 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {!isFile && (
        <>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 w-full text-left transition-colors"
            onClick={(e) => { e.stopPropagation(); setShowMenu(false); onContextMenu?.({}, { ...item, action: 'newFolder' }); }}>
            <FolderPlus className="w-4 h-4 text-blue-400" /><span>New Folder</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 w-full text-left transition-colors"
            onClick={(e) => { e.stopPropagation(); setShowMenu(false); onContextMenu?.({}, { ...item, action: 'newFile' }); }}>
            <FilePlus className="w-4 h-4 text-emerald-400" /><span>New Document</span>
          </button>
          <div className="h-px bg-white/10 my-1" />
        </>
      )}
      <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 w-full text-left transition-colors"
        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onContextMenu?.({}, { ...item, action: 'delete' }); }}>
        <Trash2 className="w-4 h-4" /><span>Delete</span>
      </button>
    </div>,
    document.body
  );

  // Table view renders as a flat row with columns
  if (viewMode === 'table') {
    return (
      <div className="w-full min-w-0 overflow-hidden group">
        <div
          className={`
            w-full min-w-0 overflow-hidden flex items-center ${styles.spacing} ${styles.padding} ${styles.fontSize} transition-all duration-200 relative
            ${isSelected
              ? 'bg-emerald-500/15 text-emerald-300'
              : isFile
                ? 'text-white/60 hover:text-white/90 cursor-pointer hover:bg-white/[0.03]'
                : 'text-white/70 hover:text-white/95 cursor-pointer hover:bg-white/[0.03]'
            }
            rounded-lg pl-2 pr-2
          `}
          onClick={handleClick}
        >
          {/* Icon + Name Column */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {isFile ? (
              <FileText className={`${styles.iconSize} text-white/30 group-hover:text-emerald-400/90 transition-all duration-200 flex-shrink-0`} />
            ) : (
              <Folder className={`
                ${styles.iconSize} flex-shrink-0 transition-all duration-200
                ${isFavorite
                  ? 'text-amber-400/90 group-hover:text-amber-300'
                  : 'text-blue-400/80 group-hover:text-blue-300'
                }
              `} />
            )}
            <span className="flex-1 min-w-0 truncate transition-all duration-200">
              {item.name || item.title}
            </span>
          </div>

          {/* Modified Column */}
          <div className="w-20 text-[11px] text-white/40 flex-shrink-0">
            {item.lastModified || '-'}
          </div>

          {/* Type Column */}
          <div className="w-14 text-[11px] text-white/40 capitalize flex-shrink-0">
            {item.type === 'document' ? 'file' : item.type}
          </div>

          {/* Three-dots button - IN the flex flow, appears on hover */}
          <button
            ref={buttonRef}
            onClick={handleMenuClick}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-1 transition-all duration-200"
          >
            <MoreHorizontal className={`${styles.iconSize} text-white/50 hover:text-white`} />
          </button>

          {/* Hover indicator line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full group-hover:h-4 transition-all duration-200 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        </div>

        {contextMenuPortal}
      </div>
    );
  }

  // Tree and Compact view (hierarchical with children)
  return (
    <div className="w-full min-w-0 overflow-hidden group">
      {/* Tree guide lines - only in tree/compact mode */}
      {viewMode !== 'table' && depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"
          style={{ left: `${(depth - 1) * 16 + 20}px` }}
        />
      )}

      <div
        className={`
          w-full min-w-0 overflow-hidden flex items-center ${styles.spacing} ${styles.padding} ${styles.fontSize} transition-all duration-200 relative rounded-lg
          ${isSelected
            ? 'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400'
            : isFile
              ? 'text-white/60 hover:text-white/90 cursor-pointer hover:bg-white/[0.03]'
              : 'text-white/70 hover:text-white/95 cursor-pointer hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent'
          }
        `}
        style={{ paddingLeft: `${depth * 16 + 12}px`, paddingRight: '2px' }}
        onClick={handleClick}
        title={item.name || item.title}
      >
        {/* Chevron for folders with children */}
        {!isFile && hasChildren && (
          <ChevronRight
            className={`
              ${styles.iconSize} text-white/40 transition-all duration-300 flex-shrink-0
              ${isExpanded ? 'rotate-90 text-emerald-400/80' : 'group-hover:text-white/60'}
            `}
          />
        )}

        {/* Spacer for folders without children */}
        {!isFile && !hasChildren && (
          <div className={`${styles.iconSize} flex-shrink-0`} />
        )}

        {/* Icon */}
        {isFile ? (
          <FileText className={`${styles.iconSize} transition-all duration-200 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-white/30 group-hover:text-emerald-400/90'}`} />
        ) : isExpanded ? (
          <FolderOpen className={`${viewMode === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-emerald-400 group-hover:text-emerald-300 transition-all duration-200 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]`} />
        ) : (
          <Folder className={`
            ${viewMode === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} flex-shrink-0 transition-all duration-200
            ${isFavorite
              ? 'text-amber-400/90 group-hover:text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]'
              : 'text-blue-400/80 group-hover:text-blue-300 group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.2)]'
            }
          `} />
        )}

        {/* Name - truncates naturally, takes remaining space */}
        <span className={`flex-1 min-w-0 truncate transition-all duration-200 ${isFile ? 'group-hover:translate-x-0.5' : ''}`}>
          {item.name || item.title}
        </span>

        {/* Count badge - always visible in tree mode */}
        {itemCount > 0 && viewMode !== 'compact' && (
          <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded group-hover:bg-emerald-500/10 group-hover:text-emerald-400/90 transition-all duration-200 flex-shrink-0">
            {itemCount}
          </span>
        )}

        {/* Compact count - just number */}
        {itemCount > 0 && viewMode === 'compact' && (
          <span className="text-[10px] text-white/30 flex-shrink-0">
            {itemCount}
          </span>
        )}

        {/* Three-dots button - IN the flex flow, appears on hover */}
        <button
          ref={buttonRef}
          onClick={handleMenuClick}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-1 transition-all duration-200"
        >
          <MoreHorizontal className="w-3.5 h-3.5 text-white/50 hover:text-white" />
        </button>

        {/* Hover indicator line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full group-hover:h-4 transition-all duration-200 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
      </div>

      {contextMenuPortal}

      {/* Render children recursively - not in table view */}
      {!isFile && isExpanded && hasChildren && viewMode !== 'table' && (
        <div className="overflow-hidden animate-in slide-in-from-top-1 duration-200">
          <div className={`w-full min-w-0 ${viewMode === 'compact' ? 'space-y-0' : 'space-y-0.5 py-0.5'}`}>
            {item.children.map((child, index) => (
              <SidebarTreeItemEnhanced
                key={child.id}
                item={child}
                isExpanded={expandedFolders?.has(child.id)}
                onToggle={onToggle}
                expandedFolders={expandedFolders}
                depth={depth + 1}
                isFavorite={child.favorite || child.isFavorite}
                isLast={index === item.children.length - 1}
                onItemClick={onItemClick}
                onContextMenu={onContextMenu}
                isSelected={isSelected}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
