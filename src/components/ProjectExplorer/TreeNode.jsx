import React, { useState, useRef, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Code,
  MessageSquare,
  Table,
  Image,
  Hash,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Star,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// File type icon mapping
const getFileIcon = (node) => {
  if (node.type === 'folder') return node.isExpanded ? FolderOpen : Folder;
  
  // Check by document content type
  if (node.has_code) return Code;
  if (node.has_ai) return MessageSquare;
  
  // Check by title patterns
  const title = (node.title || node.name || '').toLowerCase();
  if (title.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|cs|go|rs|rb)$/)) return Code;
  if (title.match(/\.(md|txt|doc|docx)$/)) return FileText;
  if (title.match(/\.(json|yaml|yml|xml)$/)) return Hash;
  if (title.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return Image;
  if (title.match(/\.(csv|xlsx|xls)$/)) return Table;
  
  // Check by tags
  if (node.tags?.includes('code')) return Code;
  if (node.tags?.includes('task') || node.tags?.includes('todo')) return CheckSquare;
  
  return FileText;
};

export default function TreeNode({
  node,
  level = 0,
  isExpanded = false,
  isSelected = false,
  onToggle,
  onSelect,
  onContextMenu,
  onRename,
  searchTerm = '',
  isCompact = false
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameName, setRenameName] = useState(node.name || node.title);
  const [isHovered, setIsHovered] = useState(false);
  const renameInputRef = useRef(null);
  
  const isFolder = node.type === 'folder';
  const hasChildren = isFolder && node.children && node.children.length > 0;
  
  // Drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({
    id: node.id,
    data: { node }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  // Handle rename
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);
  
  const handleRename = () => {
    if (renameName.trim() && renameName !== (node.name || node.title)) {
      onRename(node.id, renameName.trim());
    }
    setIsRenaming(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setRenameName(node.name || node.title);
      setIsRenaming(false);
    }
  };
  
  // Get icon and color
  const Icon = getFileIcon(node);
  const folderColor = node.color || '#6B7280';
  
  // Highlight search term
  const highlightText = (text) => {
    if (!searchTerm || !node.highlighted) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <span key={i} className="bg-accent-green/30 rounded px-0.5">{part}</span>
        : part
    );
  };
  
  // Calculate indentation
  const indentWidth = level * 20;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      data-node-id={node.id}
      {...attributes}
    >
      <div
        className={`
          group relative flex items-center gap-2 px-2 py-1.5 rounded-lg
          transition-all duration-200 cursor-pointer
          ${isSelected 
            ? 'bg-accent-green/20 text-accent-green shadow-sm' 
            : isHovered
              ? 'bg-surface-2/80 text-text-primary'
              : 'hover:bg-surface-2/50 text-text-secondary hover:text-text-primary'
          }
          ${isOver && isFolder ? 'ring-2 ring-accent-green/50 bg-accent-green/10' : ''}
          ${isDragging ? 'opacity-50' : ''}
          ${isCompact ? 'py-1' : ''}
        `}
        style={{ paddingLeft: `${indentWidth + 8}px` }}
        onClick={() => onSelect(node)}
        onContextMenu={(e) => onContextMenu(e, node)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...listeners}
      >
        {/* Indent guide lines */}
        {level > 0 && (
          <div 
            className="absolute left-0 top-0 h-full pointer-events-none"
            style={{ left: `${indentWidth - 12}px` }}
          >
            <div className="w-px h-full bg-surface-3/30" />
          </div>
        )}
        
        {/* Expand/collapse chevron */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`
              p-0.5 -ml-1 hover:bg-surface-3/50 rounded transition-all duration-200
              ${isExpanded ? 'rotate-0' : '-rotate-90'}
            `}
          >
            <ChevronDown size={12} className="transform transition-transform duration-200" />
          </button>
        )}
        
        {/* Icon */}
        <div className="relative flex-shrink-0">
          <Icon 
            size={16} 
            className={`
              transition-all duration-200
              ${isFolder 
                ? isSelected || isHovered ? 'text-accent-green' : ''
                : 'text-text-secondary'
              }
              ${isExpanded ? 'rotate-15' : ''}
            `}
            style={{ 
              color: isFolder && !isSelected && !isHovered ? folderColor : undefined,
              transform: isFolder && isExpanded ? 'rotate(15deg)' : undefined
            }}
          />
          {node.is_favorite && (
            <Star size={8} className="absolute -top-1 -right-1 text-yellow-400 fill-yellow-400" />
          )}
        </div>
        
        {/* Name */}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={`
              flex-1 bg-surface-3/50 px-2 py-0.5 rounded text-sm
              border border-accent-green/50 focus:border-accent-green
              focus:outline-none focus:ring-1 focus:ring-accent-green/30
              ${isCompact ? 'text-xs' : ''}
            `}
          />
        ) : (
          <span className={`flex-1 truncate ${isCompact ? 'text-xs' : 'text-sm'} font-medium`}>
            {highlightText(node.name || node.title)}
          </span>
        )}
        
        {/* Document count or file size */}
        {node.document_count !== undefined && (
          <span className={`
            text-xs bg-surface-0 px-1.5 py-0.5 rounded ml-2 flex-shrink-0
            transition-all duration-200
            ${isSelected || isHovered ? 'bg-surface-2' : ''}
          `}>
            {node.document_count}
          </span>
        )}
        
        {/* Hover actions */}
        <div className={`
          absolute right-2 flex items-center gap-1
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
        `}>
          {isFolder && node.is_favorite && (
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
            data-rename-trigger
            className="p-1 hover:bg-surface-3/50 rounded transition-colors"
            title="Rename (F2)"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, node);
            }}
            className="p-1 hover:bg-surface-3/50 rounded transition-colors"
            title="More options"
          >
            <MoreVertical size={12} />
          </button>
        </div>
      </div>
      
      {/* Children with smooth height animation */}
      {hasChildren && isExpanded && (
        <div className="relative animate-in slide-in-from-top-1 duration-200">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isExpanded={child.isExpanded}
              isSelected={child.id === isSelected}
              onToggle={() => onToggle(child.id)}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onRename={onRename}
              searchTerm={searchTerm}
              isCompact={isCompact}
            />
          ))}
        </div>
      )}
    </div>
  );
}