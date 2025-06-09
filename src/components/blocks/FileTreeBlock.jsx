import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Plus, X, Check, Grip } from 'lucide-react';

// Visual tree node component
function TreeNode({ node, level = 0, onUpdate, onDelete, onAddChild, onMove, allNodes, isNew = false }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(isNew);
  const [editName, setEditName] = useState(node.name);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const draggedNodeId = e.dataTransfer.getData('nodeId');
    if (draggedNodeId !== node.id && node.isFolder) {
      onMove(draggedNodeId, node.id);
    }
  };

  const isFolder = node.isFolder || node.children;
  
  // Check for duplicate names at the same level
  const hasDuplicateName = allNodes && allNodes.some(n => 
    n.id !== node.id && n.name === node.name
  );

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-lg group
          transition-all duration-200
          ${dragOver ? 'bg-accent-green/20' : 'hover:bg-dark-secondary/30'}
          ${isDragging ? 'opacity-50' : ''}
        `}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={isFolder ? handleDragOver : undefined}
        onDragLeave={isFolder ? handleDragLeave : undefined}
        onDrop={isFolder ? handleDrop : undefined}
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
          <File size={16} className="text-text-secondary" />
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
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onMove={onMove}
              allNodes={node.children}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTreeBlock({ block, onUpdate }) {
  const [treeData, setTreeData] = useState(block.treeData || [
    { id: '1', name: 'src', isFolder: true, children: [] }
  ]);

  // Generate unique ID
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

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
    onUpdate({ treeData: newTree });
  };

  // Move node (for drag and drop)
  const moveNode = (draggedNodeId, targetNodeId) => {
    // First, find and store the dragged node
    const draggedNode = findNode(draggedNodeId, treeData);
    if (!draggedNode) return;

    // Remove the node from its current location
    let newTree = removeNodeFromTree(treeData, draggedNodeId);

    // Add the node to the target location
    const addToTarget = (nodes) => {
      return nodes.map(node => {
        if (node.id === targetNodeId && node.isFolder) {
          return {
            ...node,
            children: [...(node.children || []), draggedNode]
          };
        }
        if (node.children) {
          return { ...node, children: addToTarget(node.children) };
        }
        return node;
      });
    };

    newTree = addToTarget(newTree);
    setTreeData(newTree);
    onUpdate({ treeData: newTree });
  };

  // Remove node from tree (returns new tree without the node)
  const removeNodeFromTree = (nodes, nodeId) => {
    return nodes.filter(node => {
      if (node.id === nodeId) return false;
      if (node.children) {
        node.children = removeNodeFromTree(node.children, nodeId);
      }
      return true;
    });
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
    onUpdate({ treeData: newTree });
  };

  // Add child node
  const addChild = (parentId, isFolder) => {
    const newNode = {
      id: generateId(),
      name: isFolder ? 'New Folder' : 'new-file.js',
      isFolder,
      children: isFolder ? [] : undefined
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
      children: isFolder ? [] : undefined
    };

    const newTree = [...treeData, newNode];
    setTreeData(newTree);
    onUpdate({ treeData: newTree });
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
      <div className="space-y-1">
        {treeData.length > 0 ? (
          treeData.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              onUpdate={updateNode}
              onDelete={removeNode}
              onAddChild={addChild}
              onMove={moveNode}
              allNodes={treeData}
              data-node-id={node.id}
            />
          ))
        ) : (
          <div className="text-center py-12 text-text-secondary/50">
            <Folder size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Click + to add items</p>
          </div>
        )}
      </div>
    </div>
  );
}