import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Search,
  X,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  FolderPlus,
  FilePlus,
  Star,
  StarOff,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { useDroppable, useDraggable, DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { storageWrapper } from '@/shared/lib';
import { useToast } from '@/shared/hooks';

// File type icon mapping
const getFileIcon = (document) => {
  if (!document) return FileText;
  
  // Check block types in the document
  if (document.has_code) return Code;
  if (document.has_ai) return MessageSquare;
  
  // Check by document title patterns
  const title = document.title?.toLowerCase() || '';
  if (title.includes('.js') || title.includes('.jsx') || title.includes('.ts') || title.includes('.tsx')) return Code;
  if (title.includes('.md') || title.includes('readme')) return FileText;
  if (title.includes('.json') || title.includes('.yaml')) return Hash;
  
  // Check by tags
  if (document.tags?.includes('code')) return Code;
  if (document.tags?.includes('task') || document.tags?.includes('todo')) return CheckSquare;
  
  return FileText;
};

// Context Menu Component
function ContextMenu({ x, y, onClose, items }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
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
      className="fixed bg-surface-2 border border-surface-3 rounded-lg shadow-xl py-1 z-50 min-w-[180px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, index) => (
        item.divider ? (
          <div key={index} className="border-t border-surface-3 my-1" />
        ) : (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-sm text-left
              ${item.disabled ? 'text-text-secondary/50 cursor-not-allowed' : 'text-text-primary hover:bg-surface-3'}
              ${item.danger ? 'hover:text-red-400' : ''}
            `}
          >
            {item.icon && <item.icon size={14} />}
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-auto text-xs text-text-secondary">{item.shortcut}</span>
            )}
          </button>
        )
      ))}
    </div>,
    typeof document !== 'undefined' && document.body ? document.body : document.createElement('div')
  );
}

// Tree Node Component
function TreeNode({ 
  node, 
  level = 0, 
  onToggle, 
  onSelect, 
  selectedId,
  onContextMenu,
  onDrop,
  onRename,
  onDelete,
  searchTerm,
  expandedFolders
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameName, setRenameName] = useState(node.name || node.title);
  const renameInputRef = useRef(null);
  
  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedId === node.id;
  
  // Drag and drop setup
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: node.id,
    data: { type: node.type, node }
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: node.id,
    data: { type: node.type, node },
    disabled: !isFolder
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Combine drag and drop refs
  const setRefs = useCallback((element) => {
    setDragRef(element);
    setDropRef(element);
  }, [setDragRef, setDropRef]);

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

  // Get icon
  const Icon = isFolder ? (isExpanded ? FolderOpen : Folder) : getFileIcon(node);
  
  // Highlight search term
  const highlightText = (text) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <span key={i} className="bg-accent-green/30">{part}</span>
        : part
    );
  };

  return (
    <div>
      <div
        ref={setRefs}
        style={style}
        className={`
          group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
          transition-all duration-150
          ${isSelected ? 'bg-accent-green/20 text-accent-green' : 'hover:bg-surface-2 text-text-primary'}
          ${isOver && isFolder ? 'bg-accent-green/10 ring-1 ring-accent-green/50' : ''}
        `}
        onClick={() => onSelect(node)}
        onContextMenu={(e) => onContextMenu(e, node)}
        {...attributes}
        {...listeners}
        data-node-id={node.id}
      >
        {/* Indent based on level */}
        <div style={{ width: `${level * 20}px` }} />
        
        {/* Expand/collapse chevron for folders */}
        {isFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 hover:bg-surface-3 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
        
        {/* Icon */}
        <Icon 
          size={16} 
          className={`
            flex-shrink-0
            ${isFolder ? 'text-accent-green/60' : 'text-text-secondary'}
          `}
        />
        
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
            className="flex-1 bg-surface-3 px-1 py-0.5 rounded text-sm border border-accent-green/50 
                     focus:outline-none focus:border-accent-green"
          />
        ) : (
          <span className="flex-1 text-sm truncate">
            {highlightText(node.name || node.title)}
          </span>
        )}
        
        {/* Hover actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.is_favorite && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
            className="p-1 hover:bg-surface-3 rounded transition-colors"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, node);
            }}
            className="p-1 hover:bg-surface-3 rounded transition-colors"
          >
            <MoreVertical size={12} />
          </button>
        </div>
      </div>
      
      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              onContextMenu={onContextMenu}
              onDrop={onDrop}
              onRename={onRename}
              onDelete={onDelete}
              searchTerm={searchTerm}
              expandedFolders={expandedFolders}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main VSCode Explorer Component
export default function VSCodeExplorer({ 
  onDocumentSelect,
  selectedDocumentId,
  className = '',
  height = 'h-full'
}) {
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedId, setSelectedId] = useState(selectedDocumentId);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboardItem, setClipboardItem] = useState(null);
  const [clipboardAction, setClipboardAction] = useState(null); // 'cut' or 'copy'
  
  const { showToast } = useToast();
  
  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load folders and documents
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load folders
      const foldersData = await storageWrapper.getFolderTree();
      setFolders(foldersData || []);
      
      // Load documents
      const documentsData = await storageWrapper.getDocuments();
      setDocuments(documentsData || []);
      
      // Restore expanded state from localStorage
      const savedExpanded = localStorage.getItem('vscode-explorer-expanded');
      if (savedExpanded) {
        setExpandedFolders(new Set(JSON.parse(savedExpanded)));
      }
    } catch (error) {
      console.error('Failed to load explorer data:', error);
      showToast('Failed to load folders', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('vscode-explorer-expanded', JSON.stringify([...expandedFolders]));
  }, [expandedFolders]);

  // Build tree structure
  const treeData = useMemo(() => {
    const folderMap = new Map();
    const rootItems = [];
    
    // First pass: create all folder nodes
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        type: 'folder',
        children: []
      });
    });
    
    // Second pass: build hierarchy
    folders.forEach(folder => {
      const node = folderMap.get(folder.id);
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootItems.push(node);
      }
    });
    
    // Third pass: add documents to folders
    documents.forEach(doc => {
      const docNode = {
        ...doc,
        type: 'document',
        name: doc.title
      };
      
      if (doc.folder_id) {
        const folder = folderMap.get(doc.folder_id);
        if (folder) {
          folder.children.push(docNode);
        }
      } else {
        rootItems.push(docNode);
      }
    });
    
    // Sort items
    const sortItems = (items) => {
      return items.sort((a, b) => {
        // Folders first
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        
        // Then by position
        if (a.position !== b.position) {
          return (a.position || 0) - (b.position || 0);
        }
        
        // Then by name
        return (a.name || a.title).localeCompare(b.name || b.title);
      });
    };
    
    // Recursively sort all levels
    const sortTree = (items) => {
      const sorted = sortItems(items);
      sorted.forEach(item => {
        if (item.children) {
          item.children = sortTree(item.children);
        }
      });
      return sorted;
    };
    
    return sortTree(rootItems);
  }, [folders, documents]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchTerm) return treeData;
    
    const filterTree = (items) => {
      return items.reduce((acc, item) => {
        const matches = (item.name || item.title).toLowerCase().includes(searchTerm.toLowerCase());
        
        if (item.type === 'folder') {
          const filteredChildren = filterTree(item.children || []);
          if (matches || filteredChildren.length > 0) {
            acc.push({
              ...item,
              children: filteredChildren
            });
          }
        } else if (matches) {
          acc.push(item);
        }
        
        return acc;
      }, []);
    };
    
    return filterTree(treeData);
  }, [treeData, searchTerm]);

  // Toggle folder expansion
  const toggleFolder = useCallback((folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Handle selection
  const handleSelect = useCallback((node) => {
    setSelectedId(node.id);
    
    if (node.type === 'document' && onDocumentSelect) {
      onDocumentSelect(node.id);
    } else if (node.type === 'folder') {
      toggleFolder(node.id);
    }
  }, [onDocumentSelect, toggleFolder]);

  // Handle context menu
  const handleContextMenu = useCallback((e, node) => {
    e.preventDefault();
    e.stopPropagation();
    
    const items = [];
    
    if (node.type === 'folder') {
      items.push(
        { label: 'New File', icon: FilePlus, onClick: () => createNewFile(node.id) },
        { label: 'New Folder', icon: FolderPlus, onClick: () => createNewFolder(node.id) },
        { divider: true },
        { label: 'Rename', icon: Edit2, shortcut: 'F2', onClick: () => handleRename(node.id) },
        { label: 'Delete', icon: Trash2, shortcut: 'Del', onClick: () => handleDelete(node.id), danger: true },
        { divider: true },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', onClick: () => handleCut(node) },
        { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', onClick: () => handleCopy(node) },
        { label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+V', onClick: () => handlePaste(node.id), disabled: !clipboardItem },
        { divider: true },
        { label: node.is_favorite ? 'Remove from Favorites' : 'Add to Favorites', 
          icon: node.is_favorite ? StarOff : Star, 
          onClick: () => toggleFavorite(node.id) 
        }
      );
    } else {
      items.push(
        { label: 'Open', icon: FileText, onClick: () => handleSelect(node) },
        { label: 'Rename', icon: Edit2, shortcut: 'F2', onClick: () => handleRename(node.id) },
        { label: 'Delete', icon: Trash2, shortcut: 'Del', onClick: () => handleDelete(node.id), danger: true },
        { divider: true },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', onClick: () => handleCut(node) },
        { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', onClick: () => handleCopy(node) },
        { divider: true },
        { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(node.id) },
        { label: 'Export', icon: Download, onClick: () => handleExport(node.id) }
      );
    }
    
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  }, [clipboardItem]);

  // Handle drag and drop
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const draggedNode = active.data.current.node;
    const targetNode = over.data.current.node;
    
    try {
      if (draggedNode.type === 'document') {
        // Moving a document
        const newFolderId = targetNode.type === 'folder' ? targetNode.id : targetNode.folder_id;
        await storageWrapper.updateDocument(draggedNode.id, { folder_id: newFolderId });
      } else {
        // Moving a folder
        const newParentId = targetNode.type === 'folder' ? targetNode.id : targetNode.parent_id;
        await storageWrapper.moveFolder(draggedNode.id, newParentId);
      }
      
      showToast('Item moved successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to move item:', error);
      showToast('Failed to move item', 'error');
    }
  }, [loadData, showToast]);

  // Create new file
  const createNewFile = async (folderId) => {
    try {
      const newDoc = await storageWrapper.createDocument({
        title: 'Untitled',
        folder_id: folderId
      });
      
      showToast('File created', 'success');
      loadData();
      handleSelect(newDoc);
    } catch (error) {
      console.error('Failed to create file:', error);
      showToast('Failed to create file', 'error');
    }
  };

  // Create new folder
  const createNewFolder = async (parentId) => {
    try {
      await storageWrapper.createFolder({
        name: 'New Folder',
        parent_id: parentId
      });
      
      showToast('Folder created', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to create folder:', error);
      showToast('Failed to create folder', 'error');
    }
  };

  // Handle rename
  const handleRename = useCallback(async (nodeId, newName) => {
    try {
      const node = findNodeById(nodeId, treeData);
      if (!node) return;
      
      if (node.type === 'folder') {
        await storageWrapper.updateFolder(nodeId, { name: newName });
      } else {
        await storageWrapper.updateDocument(nodeId, { title: newName });
      }
      
      showToast('Renamed successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to rename:', error);
      showToast('Failed to rename', 'error');
    }
  }, [treeData, loadData, showToast]);

  // Handle delete
  const handleDelete = useCallback(async (nodeId) => {
    const node = findNodeById(nodeId, treeData);
    if (!node) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${node.name || node.title}"?${
        node.type === 'folder' ? ' This will also delete all contents.' : ''
      }`
    );
    
    if (!confirmDelete) return;
    
    try {
      if (node.type === 'folder') {
        await storageWrapper.deleteFolder(nodeId);
      } else {
        await storageWrapper.deleteDocument(nodeId);
      }
      
      showToast('Deleted successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
      showToast('Failed to delete', 'error');
    }
  }, [treeData, loadData, showToast]);

  // Clipboard operations
  const handleCut = (node) => {
    setClipboardItem(node);
    setClipboardAction('cut');
    showToast('Item cut to clipboard', 'info');
  };

  const handleCopy = (node) => {
    setClipboardItem(node);
    setClipboardAction('copy');
    showToast('Item copied to clipboard', 'info');
  };

  const handlePaste = async (targetFolderId) => {
    if (!clipboardItem) return;
    
    try {
      if (clipboardAction === 'cut') {
        if (clipboardItem.type === 'document') {
          await storageWrapper.updateDocument(clipboardItem.id, { folder_id: targetFolderId });
        } else {
          await storageWrapper.moveFolder(clipboardItem.id, targetFolderId);
        }
      } else {
        // Copy operation - create duplicate
        if (clipboardItem.type === 'document') {
          await storageWrapper.duplicateDocument(clipboardItem.id, targetFolderId);
        } else {
          await storageWrapper.duplicateFolder(clipboardItem.id, targetFolderId);
        }
      }
      
      showToast('Item pasted successfully', 'success');
      setClipboardItem(null);
      setClipboardAction(null);
      loadData();
    } catch (error) {
      console.error('Failed to paste:', error);
      showToast('Failed to paste item', 'error');
    }
  };

  // Toggle favorite
  const toggleFavorite = async (folderId) => {
    try {
      const folder = findNodeById(folderId, treeData);
      if (!folder || folder.type !== 'folder') return;
      
      await storageWrapper.updateFolder(folderId, { is_favorite: !folder.is_favorite });
      showToast(folder.is_favorite ? 'Removed from favorites' : 'Added to favorites', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showToast('Failed to update favorite', 'error');
    }
  };

  // Handle duplicate
  const handleDuplicate = async (documentId) => {
    try {
      await storageWrapper.duplicateDocument(documentId);
      showToast('Document duplicated', 'success');
      loadData();
    } catch (error) {
      console.error('Failed to duplicate:', error);
      showToast('Failed to duplicate document', 'error');
    }
  };

  // Handle export
  const handleExport = async (documentId) => {
    try {
      const doc = await storageWrapper.getDocument(documentId);
      const blocks = await storageWrapper.getBlocks(documentId);
      
      const exportData = {
        document: doc,
        blocks: blocks,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast('Document exported', 'success');
    } catch (error) {
      console.error('Failed to export:', error);
      showToast('Failed to export document', 'error');
    }
  };

  // Find node by ID
  const findNodeById = (id, items) => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findNodeById(id, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const selectedNode = findNodeById(selectedId, treeData);
      if (!selectedNode) return;
      
      if (e.key === 'F2') {
        e.preventDefault();
        // Trigger rename for selected node
        const nodeElement = document.querySelector(`[data-node-id="${selectedId}"]`);
        if (nodeElement) {
          const editButton = nodeElement.querySelector('button[title="Edit"]');
          if (editButton) editButton.click();
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        handleDelete(selectedId);
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'x') {
          e.preventDefault();
          handleCut(selectedNode);
        } else if (e.key === 'c') {
          e.preventDefault();
          handleCopy(selectedNode);
        } else if (e.key === 'v' && selectedNode.type === 'folder') {
          e.preventDefault();
          handlePaste(selectedId);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, treeData, handleDelete]);

  if (loading) {
    return (
      <div className={`bg-surface-1 rounded-lg p-4 ${height} ${className} flex items-center justify-center`}>
        <RefreshCw size={20} className="animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className={`bg-surface-1 rounded-lg flex flex-col ${height} ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
          <h3 className="font-semibold text-sm text-text-primary">Explorer</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => createNewFile(null)}
              className="p-1.5 hover:bg-surface-2 rounded transition-colors"
              title="New File"
            >
              <FilePlus size={14} className="text-text-secondary" />
            </button>
            <button
              onClick={() => createNewFolder(null)}
              className="p-1.5 hover:bg-surface-2 rounded transition-colors"
              title="New Folder"
            >
              <FolderPlus size={14} className="text-text-secondary" />
            </button>
            <button
              onClick={loadData}
              className="p-1.5 hover:bg-surface-2 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className="text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-surface-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-8 pr-8 py-1.5 bg-surface-2 rounded text-sm
                       text-text-primary placeholder-text-secondary/50
                       focus:outline-none focus:ring-1 focus:ring-accent-green/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1
                         hover:bg-surface-3 rounded transition-colors"
              >
                <X size={12} className="text-text-secondary" />
              </button>
            )}
          </div>
        </div>

        {/* Tree View */}
        <div className="flex-1 overflow-y-auto p-2">
          <SortableContext items={filteredTree.map(item => item.id)} strategy={verticalListSortingStrategy}>
            {filteredTree.length > 0 ? (
              filteredTree.map(node => (
                <TreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  onToggle={toggleFolder}
                  onSelect={handleSelect}
                  selectedId={selectedId}
                  onContextMenu={handleContextMenu}
                  onDrop={handleDragEnd}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  searchTerm={searchTerm}
                  expandedFolders={expandedFolders}
                />
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary/50">
                <Folder size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {searchTerm ? 'No files found' : 'No files yet'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => createNewFile(null)}
                    className="mt-2 text-accent-green hover:text-accent-green/80 text-sm"
                  >
                    Create your first file
                  </button>
                )}
              </div>
            )}
          </SortableContext>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </DndContext>
  );
}