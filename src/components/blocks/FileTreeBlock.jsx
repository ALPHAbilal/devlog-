import { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Plus, X, Check, Grip, Code, FileText, Eye, Edit3 } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

// File content editor modal
function FileContentEditor({ file, onSave, onClose }) {
  const [content, setContent] = useState(file.content || '');
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);
  
  // Detect language from file extension
  const getLanguageFromFilename = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'kt': 'kotlin',
      'swift': 'swift',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'txt': 'text'
    };
    return languageMap[ext] || 'text';
  };

  const language = getLanguageFromFilename(file.name);
  const isCodeFile = language !== 'text' && language !== 'markdown';

  useEffect(() => {
    if (textareaRef.current && !isPreview) {
      textareaRef.current.focus();
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, isPreview]);

  const handleSave = () => {
    onSave(file.id, content);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
      }, 0);
    } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8" 
         style={{ 
           position: 'fixed', 
           zIndex: 9999,
           top: 0,
           left: 0,
           right: 0,
           bottom: 0
         }}>
      <div className="bg-dark-secondary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" 
           style={{ 
             position: 'relative',
             zIndex: 10000,
             maxHeight: '90vh'
           }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-primary/50">
          <div className="flex items-center gap-3">
            <File size={20} className="text-text-secondary" />
            <span className="text-text-primary font-medium">{file.name}</span>
            {isCodeFile && (
              <span className="text-xs bg-dark-primary/50 text-text-secondary px-2 py-1 rounded">
                {language}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCodeFile && (
              <button
                onClick={() => setIsPreview(!isPreview)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-primary/50 
                          rounded transition-colors"
                title={isPreview ? "Edit" : "Preview"}
              >
                {isPreview ? <Edit3 size={16} /> : <Eye size={16} />}
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-accent-green text-dark-primary font-medium rounded-lg
                        hover:bg-accent-green/90 transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              Save
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-primary/50 
                        rounded transition-colors"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isPreview && isCodeFile ? (
            <div className="bg-dark-primary/50 rounded-lg p-4">
              <Highlight theme={themes.nightOwl} code={content} language={language}>
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={`${className} text-sm font-mono overflow-x-auto`} style={style}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line, key: i })}>
                        <span className="inline-block w-12 text-text-secondary/50 text-right pr-4 select-none">
                          {i + 1}
                        </span>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token, key })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${isCodeFile ? 'code' : 'content'} here...`}
              className="w-full bg-dark-primary/50 text-text-primary p-4 rounded-lg
                        font-mono text-sm resize-none focus:outline-none 
                        focus:ring-2 focus:ring-accent-green/50 min-h-[300px]"
              style={{ minHeight: '300px' }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-primary/50 text-xs text-text-secondary">
          <span>Press Ctrl+S to save, Esc to close</span>
          {isCodeFile && (
            <span className="ml-4">Tab inserts 2 spaces</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Visual tree node component
function TreeNode({ node, level = 0, onUpdate, onDelete, onAddChild, onMove, onEditContent, allNodes, isNew = false, parentId = null, position = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(isNew);
  const [editName, setEditName] = useState(node.name);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverPosition, setDragOverPosition] = useState(null); // 'before', 'after', or 'inside'
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editName.trim()) {
      onUpdate(node.id, { name: editName.trim() });
      setIsEditing(false);
    }
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('nodeId', node.id);
    e.dataTransfer.setData('parentId', parentId || 'root');
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Determine drop position based on cursor position
    if (node.isFolder && y > height * 0.25 && y < height * 0.75) {
      setDragOverPosition('inside');
    } else if (y < height * 0.5) {
      setDragOverPosition('before');
    } else {
      setDragOverPosition('after');
    }
    
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the element
    if (e.relatedTarget && e.currentTarget && e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
      setDragOverPosition(null);
    } else if (!e.relatedTarget) {
      // If relatedTarget is null (mouse left the document), clear the state
      setDragOver(false);
      setDragOverPosition(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    setDragOverPosition(null);
    
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId === node.id) return; // Can't drop on itself
    
    onMove(draggedNodeId, {
      targetId: node.id,
      targetParentId: parentId,
      position: dragOverPosition,
      targetPosition: position
    });
  };

  const isFolder = node.isFolder || node.children;
  const hasContent = !isFolder && node.content;
  
  // Check for duplicate names at the same level
  const hasDuplicateName = allNodes && allNodes.some(n => 
    n.id !== node.id && n.name === node.name
  );

  return (
    <div className="relative">
      {/* Drop indicator line */}
      {dragOver && dragOverPosition === 'before' && (
        <div className="absolute left-0 right-0 top-0 h-0.5 bg-accent-green z-10" 
             style={{ marginLeft: `${level * 20 + 8}px` }} />
      )}
      
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-lg group
          transition-all duration-200 relative
          ${dragOver && dragOverPosition === 'inside' ? 'bg-accent-green/20 ring-2 ring-accent-green/40' : 'hover:bg-dark-secondary/30'}
          ${isDragging ? 'opacity-50' : ''}
        `}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag handle */}
        <Grip 
          size={14} 
          className="text-text-secondary/30 cursor-grab active:cursor-grabbing
                     opacity-0 group-hover:opacity-100 transition-opacity" 
        />

        {/* Expand/collapse for folders */}
        {isFolder && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-text-secondary/60 hover:text-text-secondary transition-colors"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}

        {/* Icon */}
        {isFolder ? (
          isExpanded ? 
            <FolderOpen size={16} className="text-accent-green/60" /> : 
            <Folder size={16} className="text-text-secondary/60" />
        ) : (
          <File size={16} className={hasContent ? 'text-accent-green' : 'text-text-secondary'} />
        )}

        {/* Name */}
        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditName(node.name);
                  setIsEditing(false);
                }
              }}
              className="flex-1 bg-dark-primary/50 text-text-primary px-2 py-1 
                         rounded border border-accent-green/30 focus:border-accent-green
                         focus:outline-none"
            />
            <button
              type="submit"
              className="text-accent-green hover:text-accent-green/80 transition-colors"
            >
              <Check size={14} />
            </button>
          </form>
        ) : (
          <span 
            onClick={() => setIsEditing(true)}
            className={`flex-1 cursor-text transition-colors
                       ${hasDuplicateName ? 'text-orange-400' : 'text-text-primary hover:text-accent-green'}`}
            title={hasDuplicateName ? 'Duplicate name detected' : ''}
          >
            {node.name}
            {hasDuplicateName && (
              <span className="ml-2 text-orange-400/70">●</span>
            )}
            {hasContent && (
              <span className="ml-2 text-accent-green/50 text-xs">{node.content.length} chars</span>
            )}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFolder && (
            <button
              onClick={() => onEditContent(node)}
              className="p-1 hover:bg-dark-primary/50 rounded text-text-secondary/60 
                         hover:text-accent-green transition-colors"
              title="Edit content"
            >
              <Code size={14} />
            </button>
          )}
          {isFolder && (
            <>
              <button
                onClick={() => onAddChild(node.id, true)}
                className="p-1 hover:bg-dark-primary/50 rounded text-text-secondary/60 
                           hover:text-accent-green transition-colors"
                title="Add folder"
              >
                <Folder size={14} />
              </button>
              <button
                onClick={() => onAddChild(node.id, false)}
                className="p-1 hover:bg-dark-primary/50 rounded text-text-secondary/60 
                           hover:text-text-primary transition-colors"
                title="Add file"
              >
                <File size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(node.id)}
            className="p-1 hover:bg-dark-primary/50 rounded text-text-secondary/60 
                       hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onMove={onMove}
              onEditContent={onEditContent}
              allNodes={node.children}
              parentId={node.id}
              position={index}
            />
          ))}
        </div>
      )}
      
      {/* Drop indicator line after */}
      {dragOver && dragOverPosition === 'after' && (
        <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-accent-green z-10" 
             style={{ marginLeft: `${level * 20 + 8}px` }} />
      )}
    </div>
  );
}

function FileTreeBlock({ block, onUpdate }) {
  // Performance monitoring
  useEffect(() => {
    console.log(`📁 FileTreeBlock ${block.id} rendered at ${new Date().toISOString()}`);
  }, [block.id]);
  
  const [treeData, setTreeData] = useState(block.treeData || [
    { id: '1', name: 'src', isFolder: true, children: [] }
  ]);
  const [editingFile, setEditingFile] = useState(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [rootDropPosition, setRootDropPosition] = useState(null);

  // Generate unique ID
  const generateId = () => crypto.randomUUID();

  // Update tree structure
  const updateNode = (nodeId, updates) => {
    const updateTree = (nodes) => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, ...updates };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };

    const newTree = updateTree(treeData);
    setTreeData(newTree);
    onUpdate(block.id, { treeData: newTree });
  };

  // Update file content
  const updateFileContent = (nodeId, content) => {
    updateNode(nodeId, { content });
  };

  // Check if nodeId is a descendant of ancestorId
  const isDescendant = (nodeId, ancestorId) => {
    const checkDescendant = (nodes) => {
      for (const node of nodes) {
        if (node.id === ancestorId) {
          return findNode(nodeId, node.children || []) !== null;
        }
        if (node.children && checkDescendant(node.children)) {
          return true;
        }
      }
      return false;
    };
    return checkDescendant(treeData);
  };

  // Move node (for drag and drop)
  const moveNode = (draggedNodeId, dropInfo) => {
    const { targetId, targetParentId, position, targetPosition } = dropInfo;
    
    // Prevent dropping a folder into itself or its descendants
    if (draggedNodeId === targetId || isDescendant(targetId, draggedNodeId)) {
      return;
    }

    // Find and store the dragged node
    const draggedNode = findNode(draggedNodeId, treeData);
    if (!draggedNode) return;

    // Remove the node from its current location
    let newTree = removeNodeFromTree(treeData, draggedNodeId);

    // Add the node to the new location based on position
    if (position === 'inside' && findNode(targetId, newTree)?.isFolder) {
      // Drop inside a folder
      const addToFolder = (nodes) => {
        return nodes.map(node => {
          if (node.id === targetId) {
            return {
              ...node,
              children: [...(node.children || []), draggedNode]
            };
          }
          if (node.children) {
            return { ...node, children: addToFolder(node.children) };
          }
          return node;
        });
      };
      newTree = addToFolder(newTree);
    } else {
      // Drop before or after a node
      const insertAtPosition = (nodes, parentId, position) => {
        if (parentId === null || parentId === 'root') {
          // Insert at root level
          const insertIndex = position === 'before' ? targetPosition : targetPosition + 1;
          return [
            ...nodes.slice(0, insertIndex),
            draggedNode,
            ...nodes.slice(insertIndex)
          ];
        }
        
        // Insert within a parent's children
        return nodes.map(node => {
          if (node.id === parentId && node.children) {
            const insertIndex = position === 'before' ? targetPosition : targetPosition + 1;
            return {
              ...node,
              children: [
                ...node.children.slice(0, insertIndex),
                draggedNode,
                ...node.children.slice(insertIndex)
              ]
            };
          }
          if (node.children) {
            return { ...node, children: insertAtPosition(node.children, parentId, position) };
          }
          return node;
        });
      };
      
      newTree = insertAtPosition(newTree, targetParentId, position);
    }

    setTreeData(newTree);
    onUpdate(block.id, { treeData: newTree });
  };

  // Remove node from tree (returns new tree without the node)
  const removeNodeFromTree = (nodes, nodeId) => {
    return nodes.reduce((acc, node) => {
      if (node.id === nodeId) {
        return acc; // Skip this node
      }
      if (node.children) {
        // Create a new node with filtered children
        return [...acc, {
          ...node,
          children: removeNodeFromTree(node.children, nodeId)
        }];
      }
      return [...acc, node];
    }, []);
  };

  // Find node by ID
  const findNode = (nodeId, nodes) => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      if (node.children) {
        const found = findNode(nodeId, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Remove node
  const removeNode = (nodeId) => {
    const newTree = removeNodeFromTree(treeData, nodeId);
    setTreeData(newTree);
    onUpdate(block.id, { treeData: newTree });
  };

  // Add child node
  const addChild = (parentId, isFolder) => {
    const newNode = {
      id: generateId(),
      name: isFolder ? 'New Folder' : 'new-file.js',
      isFolder,
      children: isFolder ? [] : undefined,
      content: isFolder ? undefined : ''
    };

    updateNode(parentId, {
      children: [...(findNode(parentId, treeData)?.children || []), newNode]
    });

    // Return the new node for immediate editing
    setTimeout(() => {
      const element = document.querySelector(`[data-node-id="${newNode.id}"]`);
      if (element) element.click();
    }, 50);
  };

  // Add root level item
  const addRootItem = (isFolder) => {
    const newNode = {
      id: generateId(),
      name: isFolder ? 'New Folder' : 'new-file.js',
      isFolder,
      children: isFolder ? [] : undefined,
      content: isFolder ? undefined : ''
    };

    const newTree = [...treeData, newNode];
    setTreeData(newTree);
    onUpdate(block.id, { treeData: newTree });
  };

  // Root level drag handlers
  const handleRootDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Find which position in the root we're hovering over
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Calculate position based on existing items
    let position = treeData.length;
    const items = e.currentTarget.querySelectorAll('[data-root-item]');
    
    for (let i = 0; i < items.length; i++) {
      const itemRect = items[i].getBoundingClientRect();
      if (y < itemRect.top + itemRect.height / 2 - rect.top) {
        position = i;
        break;
      }
    }
    
    setRootDragOver(true);
    setRootDropPosition(position);
  };

  const handleRootDragLeave = (e) => {
    if (e.relatedTarget && e.currentTarget && e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) {
      setRootDragOver(false);
      setRootDropPosition(null);
    } else if (!e.relatedTarget) {
      // If relatedTarget is null (mouse left the document), clear the state
      setRootDragOver(false);
      setRootDropPosition(null);
    }
  };

  const handleRootDrop = (e) => {
    e.preventDefault();
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    
    setRootDragOver(false);
    setRootDropPosition(null);
    
    moveNode(draggedNodeId, {
      targetId: null,
      targetParentId: 'root',
      position: 'before',
      targetPosition: rootDropPosition
    });
  };

  return (
    <div className="bg-dark-secondary/20 rounded-lg p-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Folder size={18} className="text-accent-green/60" />
          <span className="text-sm text-text-secondary">Project Structure</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => addRootItem(true)}
            className="p-1.5 hover:bg-dark-secondary/50 rounded text-text-secondary/60 
                       hover:text-accent-green transition-colors"
            title="Add folder"
          >
            <Folder size={16} />
          </button>
          <button
            onClick={() => addRootItem(false)}
            className="p-1.5 hover:bg-dark-secondary/50 rounded text-text-secondary/60 
                       hover:text-text-primary transition-colors"
            title="Add file"
          >
            <File size={16} />
          </button>
        </div>
      </div>

      {/* Tree view */}
      <div 
        className="space-y-1 min-h-[100px] relative"
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
      >
        {/* Root drop indicator */}
        {rootDragOver && rootDropPosition === 0 && (
          <div className="h-0.5 bg-accent-green mb-1" />
        )}
        
        {treeData.length > 0 ? (
          treeData.map((node, index) => (
            <div key={node.id} data-root-item>
              <TreeNode
                node={node}
                level={0}
                onUpdate={updateNode}
                onDelete={removeNode}
                onAddChild={addChild}
                onMove={moveNode}
                onEditContent={setEditingFile}
                allNodes={treeData}
                parentId={null}
                position={index}
              />
              {/* Drop indicator between root items */}
              {rootDragOver && rootDropPosition === index + 1 && (
                <div className="h-0.5 bg-accent-green mt-1 mb-1" />
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-text-secondary/50">
            <Folder size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Click + to add items</p>
          </div>
        )}
      </div>

      {/* File Content Editor Modal */}
      {editingFile && (
        <FileContentEditor
          file={editingFile}
          onSave={updateFileContent}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
}

// Memoize FileTreeBlock to prevent unnecessary re-renders
export default memo(FileTreeBlock, (prevProps, nextProps) => {
  const willPreventRerender = 
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.data === nextProps.block.data;
  
  console.log(`📁 FileTreeBlock ${prevProps.block.id} memo check:`, {
    idSame: prevProps.block.id === nextProps.block.id,
    dataSame: prevProps.block.data === nextProps.block.data,
    willPreventRerender
  });
  
  return willPreventRerender;
});