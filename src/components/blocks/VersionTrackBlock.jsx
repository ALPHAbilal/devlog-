import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Save, GitBranch, Clock, User, Code2, ZoomIn, ZoomOut, Maximize2, 
         FileText, File, Folder, FolderOpen, ChevronRight, Plus, X, PanelLeftClose, PanelLeft,
         FilePlus, FolderPlus, Trash2, Edit3, Home } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

// Context Menu Component
function ContextMenu({ x, y, onClose, items }) {
  useEffect(() => {
    const handleClick = () => onClose();
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed bg-[#161b22] rounded-md shadow-lg border border-[#30363d] py-1 z-50"
      style={{ 
        left: `${x}px`, 
        top: `${y}px`,
        minWidth: '160px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        item.divider ? (
          <div key={index} className="border-t border-[#30363d] my-1" />
        ) : (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-[#8b949e] 
                       hover:bg-[#21262d] hover:text-[#f0f6fc] transition-colors duration-150
                       flex items-center gap-2"
            disabled={item.disabled}
          >
            {item.icon && <item.icon size={14} />}
            {item.label}
          </button>
        )
      ))}
    </div>,
    document.body
  );
}

// Professional branch colors - muted tones inspired by GitHub
const BRANCH_COLORS = {
  main: { primary: '#6B7280', secondary: '#4B5563' },      // Gray (default branch)
  feature: { primary: '#3B82F6', secondary: '#2563EB' },   // Blue (active development)
  develop: { primary: '#8B5CF6', secondary: '#7C3AED' },   // Purple (development)
  hotfix: { primary: '#EF4444', secondary: '#DC2626' },    // Red (urgent fixes)
  release: { primary: '#10B981', secondary: '#059669' },   // Green (stable releases)
};

// Generate a short ID for versions
const generateVersionId = () => {
  return 'v' + Date.now().toString(36);
};

// Get appropriate icon for file type
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs'];
  
  if (codeExtensions.includes(ext)) {
    return Code2;
  } else if (ext === 'md' || ext === 'txt') {
    return FileText;
  }
  return File;
};

// Enhanced node positioning with better branch handling
const calculateNodePositions = (repository) => {
  const positions = {};
  const branchLanes = { main: 0 };
  const LANE_HEIGHT = 80;
  const NODE_SPACING = 100;
  const START_X = 140;
  const START_Y = 60;
  
  // Build parent-child relationships
  const children = {};
  Object.values(repository.versions).forEach(version => {
    if (version.parent) {
      if (!children[version.parent]) {
        children[version.parent] = [];
      }
      children[version.parent].push(version.id);
    }
  });
  
  // Sort all versions by timestamp
  const timeline = Object.values(repository.versions)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Assign lanes dynamically
  let nextLane = 1;
  const timelineX = {};
  
  timeline.forEach((version, index) => {
    const branch = version.branch || 'main';
    
    // Assign lane if branch doesn't have one
    if (!(branch in branchLanes) && branch !== 'main') {
      branchLanes[branch] = nextLane++;
    }
    
    // Calculate X position based on timeline
    const x = START_X + (index * NODE_SPACING);
    timelineX[version.id] = x;
    
    // Calculate Y position based on branch lane
    let y = START_Y + (branchLanes[branch] * LANE_HEIGHT);
    
    // Adjust Y for merge commits to create smoother connections
    if (version.parent && children[version.parent]?.length > 1) {
      // This is a branch point - slightly offset
      y += 10;
    }
    
    positions[version.id] = {
      x: x,
      y: y,
      branch: branch,
      lane: branchLanes[branch],
      timestamp: version.timestamp
    };
  });
  
  return positions;
};

// Get language from filename for syntax highlighting
const getLanguageFromFilename = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
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
    'bash': 'bash'
  };
  return languageMap[ext] || 'javascript';
};

export default function VersionTrackBlock({ block, updateBlock, isActive }) {
  // Initialize with proper version control structure
  const [repository, setRepository] = useState(() => {
    if (block.data?.repository) {
      return block.data.repository;
    }
    
    // Create initial empty repository
    const initialVersion = {
      id: 'v1',
      message: 'Initial commit',
      timestamp: new Date().toISOString(),
      author: 'user',
      parent: null,
      branch: 'main',
      files: {},
      fileTree: {}
    };

    return {
      versions: { v1: initialVersion },
      branches: {
        main: { name: 'main', head: 'v1', color: BRANCH_COLORS.main }
      },
      HEAD: 'v1',
      fileTree: {},
      activeFile: ''
    };
  });

  const [currentVersion, setCurrentVersion] = useState(repository.HEAD);
  const [editingCode, setEditingCode] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [modifiedFiles, setModifiedFiles] = useState({}); // Track all modified files
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodePositions, setNodePositions] = useState({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeFile, setActiveFile] = useState(repository.activeFile || '');
  const [showFileTree, setShowFileTree] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [inlineCreateState, setInlineCreateState] = useState(null); // { type: 'file'|'folder', parentPath: string }
  const [inlineCreateValue, setInlineCreateValue] = useState('');
  const [renamingPath, setRenamingPath] = useState(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const codeContainerRef = useRef(null);

  // Update node positions when repository changes
  useEffect(() => {
    setNodePositions(calculateNodePositions(repository));
  }, [repository]);

  // Load current version's active file content when HEAD or active file changes
  useEffect(() => {
    const version = repository.versions[currentVersion];
    if (version && version.files && version.files[activeFile]) {
      setEditingCode(version.files[activeFile].content || '');
      setSelectedBranch(version.branch || 'main');
    } else if (version && version.content) {
      // Fallback for old single-file format
      setEditingCode(version.content);
      setSelectedBranch(version.branch || 'main');
    }
  }, [currentVersion, activeFile, repository]);

  // Save repository changes
  useEffect(() => {
    if (updateBlock && block.data?.repository !== repository) {
      updateBlock(block.id, { ...block, data: { ...block.data, repository } });
    }
  }, [repository, block.id, updateBlock]);

  // Draw metro map visualization with enhanced graphics
  const drawMetroMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas with professional dark background
    ctx.fillStyle = '#0d1117'; // GitHub dark theme background
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Enable better rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Apply zoom and pan transforms
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw connections with refined styling
    Object.values(repository.versions).forEach(version => {
      if (version.parent) {
        const parentPos = nodePositions[version.parent];
        const childPos = nodePositions[version.id];
        
        if (parentPos && childPos) {
          const branch = repository.branches[version.branch] || repository.branches.main;
          const isCurrentBranch = version.branch === selectedBranch;
          
          // Muted colors for inactive branches
          ctx.strokeStyle = isCurrentBranch ? branch.color.primary : branch.color.primary + '60';
          ctx.lineWidth = 2; // Thinner, more professional
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(parentPos.x, parentPos.y);
          
          // Enhanced bezier curves for smoother connections
          if (parentPos.y !== childPos.y) {
            const dx = childPos.x - parentPos.x;
            const dy = childPos.y - parentPos.y;
            const tension = 0.4;
            
            // Create smoother curves with better control points
            const cp1x = parentPos.x + dx * tension;
            const cp1y = parentPos.y;
            const cp2x = childPos.x - dx * tension;
            const cp2y = childPos.y;
            
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, childPos.x, childPos.y);
          } else {
            // Even straight lines get slight curves for visual appeal
            const midX = (parentPos.x + childPos.x) / 2;
            ctx.quadraticCurveTo(midX, parentPos.y - 2, childPos.x, childPos.y);
          }
          
          ctx.stroke();
        }
      }
    });
    
    // Draw nodes with enhanced effects
    Object.entries(repository.versions).forEach(([versionId, version]) => {
      const pos = nodePositions[versionId];
      if (!pos) return;
      
      const branch = repository.branches[version.branch] || repository.branches.main;
      const isCurrentVersion = versionId === currentVersion;
      const isHovered = hoveredNode === versionId;
      const isMergeCommit = version.message?.toLowerCase().includes('merge');
      
      // Count changed files
      const fileCount = version.files ? Object.keys(version.files).length : 0;
      const hasMultipleFiles = fileCount > 1;
      
      // Professional node design - simple and clean
      const nodeRadius = hasMultipleFiles ? 8 : 6;
      const activeRadius = hasMultipleFiles ? 9 : 7;
      
      // Node background
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isCurrentVersion ? activeRadius : nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#0d1117'; // Match canvas background
      ctx.fill();
      
      // Node border
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isCurrentVersion ? activeRadius : nodeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isCurrentVersion ? branch.color.primary : 
                       isHovered ? branch.color.primary + 'CC' : branch.color.primary + '80';
      ctx.lineWidth = isCurrentVersion ? 2 : 1;
      ctx.stroke();
      
      // Inner dot for current version
      if (isCurrentVersion) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = branch.color.primary;
        ctx.fill();
      }
      
      // Simple selection indicator
      if (isCurrentVersion) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = branch.color.primary + '40';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Removed file count indicator - keeping nodes clean
    });
    
    // Restore transform
    ctx.restore();
    
    // Draw branch labels with professional styling (outside transform to keep them fixed)
    let yOffset = 20;
    Object.entries(repository.branches).forEach(([branchName, branch]) => {
      const isActive = branchName === selectedBranch;
      
      // Branch indicator line
      ctx.strokeStyle = isActive ? branch.color.primary : branch.color.primary + '60';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(16, yOffset);
      ctx.lineTo(32, yOffset);
      ctx.stroke();
      
      // Branch name with system font
      ctx.fillStyle = isActive ? '#f0f6fc' : '#8b949e'; // GitHub's text colors
      ctx.font = `${isActive ? '600' : '400'} 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(branchName, 40, yOffset + 4);
      
      yOffset += 20;
    });
  }, [repository, nodePositions, currentVersion, hoveredNode, selectedBranch, zoom, pan]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      drawMetroMap();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawMetroMap]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setPan(prev => ({ ...prev, x: prev.x + 50 }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPan(prev => ({ ...prev, x: prev.x - 50 }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setPan(prev => ({ ...prev, y: prev.y + 50 }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setPan(prev => ({ ...prev, y: prev.y - 50 }));
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoom(prev => Math.min(prev * 1.2, 3));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setZoom(prev => Math.max(prev / 1.2, 0.5));
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          setPan({ x: 0, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle canvas interactions with visual feedback
  const handleCanvasClick = (e) => {
    if (isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    // Find clicked node
    let clickedVersion = null;
    Object.entries(nodePositions).forEach(([versionId, pos]) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 12) {
        clickedVersion = versionId;
      }
    });
    
    if (clickedVersion && clickedVersion !== currentVersion) {
      // Checkout this version with smooth transition
      const versionData = repository.versions[clickedVersion];
      
      // Restore the complete directory state from this version
      if (versionData.fileTree) {
        setRepository(prev => ({ 
          ...prev, 
          HEAD: clickedVersion,
          fileTree: JSON.parse(JSON.stringify(versionData.fileTree)) // Deep copy to avoid mutations
        }));
      }
      
      setCurrentVersion(clickedVersion);
      
      // Reset editing state
      setMode('view');
      if (activeFile && versionData.files?.[activeFile]) {
        setEditingCode(versionData.files[activeFile].content);
      } else {
        setEditingCode('');
      }
      
      // Subtle visual feedback
      const canvas = canvasRef.current;
      canvas.style.transform = 'scale(0.99)';
      setTimeout(() => {
        canvas.style.transform = 'scale(1)';
      }, 150);
    }
  };

  const handleCanvasMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan(prevPan => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
      canvasRef.current.style.cursor = 'grabbing';
      return;
    }
    
    let foundNode = null;
    Object.entries(nodePositions).forEach(([versionId, pos]) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 12) {
        foundNode = versionId;
      }
    });
    
    setHoveredNode(foundNode);
    canvasRef.current.style.cursor = foundNode ? 'pointer' : isDragging ? 'grabbing' : 'grab';
  };

  // Create new version (commit)
  const handleCommit = () => {
    if (!commitMessage.trim()) {
      return;
    }

    const newVersionId = generateVersionId();
    const currentVersionData = repository.versions[currentVersion];
    
    // Save current file if being edited
    const allModifiedFiles = { ...modifiedFiles };
    if (mode === 'edit' && activeFile && editingCode !== undefined) {
      allModifiedFiles[activeFile] = editingCode;
    }
    
    // Build complete file snapshot from current state
    const fileSnapshot = {};
    
    // Helper to traverse file tree and collect all file contents
    const collectFiles = (tree, path = '') => {
      Object.entries(tree).forEach(([name, item]) => {
        const fullPath = path ? `${path}/${name}` : name;
        
        if (item.type === 'file') {
          // Get content from modified files or current version
          let content = '';
          if (allModifiedFiles[fullPath] !== undefined) {
            content = allModifiedFiles[fullPath];
          } else if (currentVersionData?.files?.[fullPath]) {
            content = currentVersionData.files[fullPath].content;
          }
          
          fileSnapshot[fullPath] = {
            content,
            type: 'file'
          };
        } else if (item.type === 'folder' && item.children) {
          collectFiles(item.children, fullPath);
        }
      });
    };
    
    // Collect all files from the file tree
    collectFiles(repository.fileTree);
    
    // Create new version with complete directory snapshot
    const newVersion = {
      id: newVersionId,
      message: commitMessage,
      timestamp: new Date().toISOString(),
      author: 'user',
      parent: currentVersion,
      branch: selectedBranch,
      files: fileSnapshot,
      fileTree: JSON.parse(JSON.stringify(repository.fileTree)) // Deep copy of file tree structure
    };

    setRepository(prev => ({
      ...prev,
      versions: {
        ...prev.versions,
        [newVersionId]: newVersion
      },
      branches: {
        ...prev.branches,
        [selectedBranch]: {
          ...prev.branches[selectedBranch],
          head: newVersionId
        }
      },
      HEAD: newVersionId,
      fileTree: {
        ...prev.fileTree,
        [activeFile]: { 
          type: 'file', 
          lastModified: newVersionId 
        }
      }
    }));

    setCurrentVersion(newVersionId);
    setCommitMessage('');
    setMode('view');
    setModifiedFiles({}); // Clear all modified files after commit
  };

  // Create new branch
  const handleCreateBranch = (branchName) => {
    const colorKeys = Object.keys(BRANCH_COLORS);
    const usedColorKeys = Object.values(repository.branches).map(b => 
      Object.entries(BRANCH_COLORS).find(([k, v]) => v.primary === b.color.primary)?.[0]
    ).filter(Boolean);
    
    const availableColorKey = colorKeys.find(k => !usedColorKeys.includes(k)) || colorKeys[0];
    const color = BRANCH_COLORS[availableColorKey];

    setRepository(prev => ({
      ...prev,
      branches: {
        ...prev.branches,
        [branchName]: {
          name: branchName,
          head: currentVersion,
          color: color
        }
      }
    }));

    setSelectedBranch(branchName);
  };
  
  // Helper function to update file tree structure
  const updateFileTree = (tree, path, item) => {
    const parts = path.split('/');
    const fileName = parts.pop();
    let current = tree;
    
    // Navigate to the correct folder
    for (const part of parts) {
      if (!current[part]) {
        current[part] = { type: 'folder', expanded: true, children: {} };
      }
      current = current[part].children || {};
    }
    
    // Add the file/folder
    current[fileName] = item;
    return tree;
  };
  
  // Create new file or folder
  const handleCreateFile = (isFolder = false, parentPath = '') => {
    setInlineCreateState({ type: isFolder ? 'folder' : 'file', parentPath });
    setInlineCreateValue('');
  };

  // Handle inline creation submission
  const handleInlineCreateSubmit = () => {
    if (!inlineCreateValue.trim()) {
      setInlineCreateState(null);
      return;
    }

    const { type, parentPath } = inlineCreateState;
    const itemName = inlineCreateValue.trim();
    const fullPath = parentPath ? `${parentPath}/${itemName}` : itemName;
    
    // Check if item already exists
    const checkExists = (tree, path) => {
      const parts = path.split('/');
      let current = tree;
      for (const part of parts) {
        if (!current[part]) return false;
        if (current[part].type === 'folder') {
          current = current[part].children || {};
        }
      }
      return true;
    };
    
    if (checkExists(repository.fileTree, fullPath)) {
      // Could show an error state here instead of alert
      return;
    }
    
    if (type === 'folder') {
      // Create folder without creating a new version
      const newTree = JSON.parse(JSON.stringify(repository.fileTree));
      updateFileTree(newTree, fullPath, {
        type: 'folder',
        expanded: true,
        children: {}
      });
      
      setRepository(prev => ({
        ...prev,
        fileTree: newTree
      }));
      
      // Expand parent folders
      if (parentPath) {
        const parts = parentPath.split('/');
        let path = '';
        for (const part of parts) {
          path = path ? `${path}/${part}` : part;
          setExpandedDirs(prev => new Set([...prev, path]));
        }
      }
    } else {
      // Determine file content based on extension
      const ext = itemName.split('.').pop().toLowerCase();
      let defaultContent = '// New file\n';
      
      if (ext === 'md') {
        defaultContent = '# New Document\n\nStart writing here...';
      } else if (ext === 'json') {
        defaultContent = '{\n  \n}';
      } else if (ext === 'html') {
        defaultContent = '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  \n</body>\n</html>';
      } else if (ext === 'css') {
        defaultContent = '/* New stylesheet */\n';
      }
      
      // Create a new version with the new file
      const newVersionId = generateVersionId();
      const currentVersionData = repository.versions[currentVersion];
      
      const newVersion = {
        id: newVersionId,
        message: `Created ${fullPath}`,
        timestamp: new Date().toISOString(),
        author: 'user',
        parent: currentVersion,
        branch: selectedBranch,
        files: {
          ...(currentVersionData?.files || {}),
          [fullPath]: {
            content: defaultContent,
            action: 'created',
            stats: { additions: defaultContent.split('\n').length, deletions: 0 }
          }
        }
      };
      
      const newTree = JSON.parse(JSON.stringify(repository.fileTree));
      updateFileTree(newTree, fullPath, { type: 'file', lastModified: newVersionId });
      
      setRepository(prev => ({
        ...prev,
        versions: {
          ...prev.versions,
          [newVersionId]: newVersion
        },
        branches: {
          ...prev.branches,
          [selectedBranch]: {
            ...prev.branches[selectedBranch],
            head: newVersionId
          }
        },
        HEAD: newVersionId,
        fileTree: newTree,
        activeFile: fullPath
      }));
      
      setCurrentVersion(newVersionId);
      setActiveFile(fullPath);
      setEditingCode(defaultContent);
      setMode('edit');
    }
    
    // Clear inline create state
    setInlineCreateState(null);
    setInlineCreateValue('');
  };

  const currentVersionData = repository.versions[currentVersion];
  
  // Toggle folder expansion
  const toggleFolder = (path) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  // Handle context menu for files/folders
  const handleContextMenu = (e, fullPath, isFolder, parentPath) => {
    e.preventDefault();
    e.stopPropagation();
    
    const items = [];
    
    if (isFolder) {
      items.push(
        { label: 'New File', icon: FilePlus, onClick: () => handleCreateFile(false, fullPath) },
        { label: 'New Folder', icon: FolderPlus, onClick: () => handleCreateFile(true, fullPath) },
        { divider: true },
        { label: 'Rename', icon: Edit3, onClick: () => handleRename(fullPath) },
        { label: 'Delete', icon: Trash2, onClick: () => handleDelete(fullPath) }
      );
    } else {
      items.push(
        { label: 'Rename', icon: Edit3, onClick: () => handleRename(fullPath) },
        { label: 'Delete', icon: Trash2, onClick: () => handleDelete(fullPath) }
      );
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items
    });
  };

  // Handle rename operation
  const handleRename = (fullPath) => {
    const parts = fullPath.split('/');
    const oldName = parts.pop();
    setRenamingPath(fullPath);
    setRenamingValue(oldName);
  };

  // Handle rename submission
  const handleRenameSubmit = () => {
    if (!renamingValue.trim() || !renamingPath) {
      setRenamingPath(null);
      setRenamingValue('');
      return;
    }

    const parts = renamingPath.split('/');
    const oldName = parts.pop();
    const parentPath = parts.join('/');
    const newName = renamingValue.trim();
    
    if (newName && newName !== oldName) {
      const newFullPath = parentPath ? `${parentPath}/${newName}` : newName;
      
      // Update file tree
      const newTree = JSON.parse(JSON.stringify(repository.fileTree));
      const parent = parentPath ? getNodeAtPath(newTree, parentPath) : newTree;
      
      if (parent) {
        const node = parent.children ? parent.children[oldName] : parent[oldName];
        if (node) {
          if (parent.children) {
            parent.children[newName] = node;
            delete parent.children[oldName];
          } else {
            parent[newName] = node;
            delete parent[oldName];
          }
        }
      }
      
      // Update active file if needed
      if (activeFile === renamingPath) {
        setActiveFile(newFullPath);
      }
      
      setRepository({
        ...repository,
        fileTree: newTree
      });
      updateBlock(block.id, { ...block, data: { ...block.data, repository: { ...repository, fileTree: newTree } } });
    }
    
    // Clear rename state
    setRenamingPath(null);
    setRenamingValue('');
  };

  // Handle delete operation
  const handleDelete = (fullPath) => {
    if (confirm(`Are you sure you want to delete "${fullPath}"?`)) {
      const newTree = JSON.parse(JSON.stringify(repository.fileTree));
      const parts = fullPath.split('/');
      const name = parts.pop();
      
      if (parts.length === 0) {
        // Root level item
        delete newTree[name];
      } else {
        // Nested item
        const parent = getNodeAtPath(newTree, parts.join('/'));
        if (parent && parent.children) {
          delete parent.children[name];
        }
      }
      
      // Reset active file if deleted
      if (activeFile === fullPath) {
        setActiveFile('');
      }
      
      setRepository({
        ...repository,
        fileTree: newTree
      });
      updateBlock(block.id, { ...block, data: { ...block.data, repository: { ...repository, fileTree: newTree } } });
    }
  };

  // Get node at path helper
  const getNodeAtPath = (tree, path) => {
    const parts = path.split('/');
    let current = tree;
    
    for (const part of parts) {
      if (!current[part]) return null;
      if (current[part].type === 'folder') {
        current = current[part].children || {};
      } else {
        return current[part];
      }
    }
    
    return current;
  };

  // Render file tree recursively
  const renderFileTree = (items, path = '', depth = 0) => {
    const entries = Object.entries(items);
    const result = entries.map(([name, item]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isFolder = item.type === 'folder';
      const isExpanded = isFolder && (item.expanded || expandedDirs.has(fullPath));
      const paddingLeft = 12 + (depth * 16);
      const isBeingRenamed = renamingPath === fullPath;
      
      if (isFolder) {
        return (
          <div key={fullPath}>
            <div
              className={`flex items-center gap-1 px-2 py-1 text-sm cursor-pointer
                         hover:bg-[#21262d] transition-colors duration-150 text-[#8b949e]`}
              style={{ paddingLeft: `${paddingLeft}px` }}
              onClick={() => !isBeingRenamed && toggleFolder(fullPath)}
              onContextMenu={(e) => handleContextMenu(e, fullPath, true, path)}
            >
              <ChevronRight 
                size={16} 
                className={`transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
              />
              {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
              {isBeingRenamed ? (
                <input
                  type="text"
                  value={renamingValue}
                  onChange={(e) => setRenamingValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') {
                      setRenamingPath(null);
                      setRenamingValue('');
                    }
                  }}
                  className="flex-1 bg-[#1c2128] border border-[#30363d] rounded px-1 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 truncate">{name}</span>
              )}
            </div>
            {isExpanded && item.children && (
              <div>
                {renderFileTree(item.children, fullPath, depth + 1)}
                {/* Inline create for folders */}
                {inlineCreateState && inlineCreateState.parentPath === fullPath && (
                  <div
                    className="flex items-center gap-2 px-2 py-1"
                    style={{ paddingLeft: `${paddingLeft + 36}px` }}
                  >
                    {inlineCreateState.type === 'folder' ? <Folder size={16} /> : <File size={16} />}
                    <input
                      type="text"
                      value={inlineCreateValue}
                      onChange={(e) => setInlineCreateValue(e.target.value)}
                      onBlur={handleInlineCreateSubmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineCreateSubmit();
                        if (e.key === 'Escape') {
                          setInlineCreateState(null);
                          setInlineCreateValue('');
                        }
                      }}
                      placeholder={`New ${inlineCreateState.type} name...`}
                      className="flex-1 bg-[#1c2128] border border-[#30363d] rounded px-1 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff] placeholder-[#7d8590]"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      } else {
        const isActive = fullPath === activeFile;
        const FileIcon = getFileIcon(name);
        
        return (
          <div
            key={fullPath}
            className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer
                       hover:bg-[#21262d] transition-colors duration-150
                       ${isActive ? 'bg-[#21262d] text-[#f0f6fc]' : 'text-[#8b949e]'}`}
            style={{ paddingLeft: `${paddingLeft + 20}px` }}
            onClick={() => {
              if (isBeingRenamed) return;
              // Save current file changes if in edit mode
              if (mode === 'edit' && activeFile && editingCode !== undefined) {
                setModifiedFiles(prev => ({
                  ...prev,
                  [activeFile]: editingCode
                }));
              }
              
              setActiveFile(fullPath);
              
              // Load content from modified files or current version
              if (modifiedFiles[fullPath] !== undefined) {
                setEditingCode(modifiedFiles[fullPath]);
              } else {
                const version = repository.versions[currentVersion];
                if (version?.files?.[fullPath]) {
                  setEditingCode(version.files[fullPath].content);
                } else {
                  setEditingCode('');
                }
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, fullPath, false, path)}
          >
            <FileIcon size={16} className={isActive ? 'text-[#58a6ff]' : ''} />
            {isBeingRenamed ? (
              <input
                type="text"
                value={renamingValue}
                onChange={(e) => setRenamingValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') {
                    setRenamingPath(null);
                    setRenamingValue('');
                  }
                }}
                className="flex-1 bg-[#1c2128] border border-[#30363d] rounded px-1 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff]"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="flex-1 truncate">{name}</span>
                {/* Show modified indicator */}
                {(modifiedFiles[fullPath] !== undefined || (isActive && mode === 'edit')) && (
                  <span className="text-[10px] text-[#f0ad4e] ml-2">●</span>
                )}
                {item.lastModified && !modifiedFiles[fullPath] && (
                  <span className="text-[10px] text-[#7d8590] ml-2">{item.lastModified}</span>
                )}
              </>
            )}
          </div>
        );
      }
    });
    
    // Add inline create at root level if needed
    if (path === '' && inlineCreateState && inlineCreateState.parentPath === '') {
      result.push(
        <div
          key="inline-create-root"
          className="flex items-center gap-2 px-2 py-1"
          style={{ paddingLeft: `${12}px` }}
        >
          {inlineCreateState.type === 'folder' ? <Folder size={16} /> : <File size={16} />}
          <input
            type="text"
            value={inlineCreateValue}
            onChange={(e) => setInlineCreateValue(e.target.value)}
            onBlur={handleInlineCreateSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInlineCreateSubmit();
              if (e.key === 'Escape') {
                setInlineCreateState(null);
                setInlineCreateValue('');
              }
            }}
            placeholder={`New ${inlineCreateState.type} name...`}
            className="flex-1 bg-[#1c2128] border border-[#30363d] rounded px-1 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff] placeholder-[#7d8590]"
            autoFocus
          />
        </div>
      );
    }
    
    return result;
  };

  return (
    <>
    <div className="bg-[#0d1117] rounded-lg overflow-hidden border border-[#30363d] flex h-[600px]">
      {/* File Tree Sidebar */}
      {showFileTree && (
        <div className="w-64 bg-[#010409] border-r border-[#30363d] flex flex-col">
          <div className="px-3 py-2 border-b border-[#30363d] flex items-center justify-between">
            <span className="text-xs font-medium text-[#8b949e]">FILES</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateFile}
                className="p-1 hover:bg-[#21262d] rounded transition-colors duration-150"
                title="New file"
              >
                <Plus size={14} className="text-[#7d8590] hover:text-[#f0f6fc]" />
              </button>
              <button
                onClick={() => setShowFileTree(false)}
                className="p-1 hover:bg-[#21262d] rounded transition-colors duration-150"
                title="Hide file tree"
              >
                <PanelLeftClose size={14} className="text-[#7d8590]" />
              </button>
            </div>
          </div>
          <div 
            className="flex-1 overflow-y-auto py-2"
            onContextMenu={(e) => {
              // Only trigger if clicking on empty space, not on items
              if (e.target === e.currentTarget || e.target.classList.contains('overflow-y-auto')) {
                e.preventDefault();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  items: [
                    { label: 'New File', icon: FilePlus, onClick: () => handleCreateFile(false, '') },
                    { label: 'New Folder', icon: FolderPlus, onClick: () => handleCreateFile(true, '') }
                  ]
                });
              }
            }}
          >
            {Object.keys(repository.fileTree || {}).length === 0 && !inlineCreateState ? (
              <div className="text-center py-8 px-4">
                <Folder size={32} className="mx-auto mb-2 text-[#30363d]" />
                <p className="text-[#7d8590] text-xs mb-2">No files yet</p>
                <p className="text-[#7d8590] text-[11px]">
                  Click + or right-click to create files
                </p>
              </div>
            ) : (
              renderFileTree(repository.fileTree || {})
            )}
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#30363d] bg-[#010409]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* File tree toggle */}
              {!showFileTree && (
                <button
                  onClick={() => setShowFileTree(true)}
                  className="p-1 hover:bg-[#21262d] rounded transition-colors duration-150"
                  title="Show file tree"
                >
                  <PanelLeft size={18} className="text-[#7d8590]" />
                </button>
              )}
              
              {/* Breadcrumb navigation */}
              <div className="flex items-center gap-1 text-sm">
                {(() => {
                  if (!activeFile) {
                    return <span className="text-[#7d8590]">No file selected</span>;
                  }
                  
                  const parts = activeFile.split('/');
                  const fileName = parts.pop();
                  const FileIcon = getFileIcon(fileName);
                  
                  return (
                    <>
                      {/* Root/Home */}
                      <button
                        onClick={() => setActiveFile('')}
                        className="p-1 hover:bg-[#21262d] rounded transition-colors duration-150"
                        title="Root"
                      >
                        <Home size={14} className="text-[#7d8590]" />
                      </button>
                      
                      {/* Folder path */}
                      {parts.map((part, index) => {
                        const path = parts.slice(0, index + 1).join('/');
                        return (
                          <React.Fragment key={path}>
                            <ChevronRight size={14} className="text-[#30363d]" />
                            <button
                              onClick={() => {
                                // Expand the folder in tree
                                const newExpandedDirs = new Set(expandedDirs);
                                newExpandedDirs.add(path);
                                setExpandedDirs(newExpandedDirs);
                              }}
                              className="px-2 py-1 hover:bg-[#21262d] rounded transition-colors duration-150 
                                         text-[#8b949e] hover:text-[#f0f6fc]"
                            >
                              {part}
                            </button>
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Current file */}
                      {parts.length > 0 && <ChevronRight size={14} className="text-[#30363d]" />}
                      <div className="flex items-center gap-2 px-2 py-1 bg-[#21262d] rounded">
                        <FileIcon size={16} className="text-[#58a6ff]" />
                        <span className="text-[#f0f6fc] font-medium">{fileName}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Branch selector */}
              <div className="relative">
              <button 
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="flex items-center gap-2 px-3 py-1 bg-[#21262d] rounded-md
                           text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d] 
                           transition-all duration-150 text-sm border border-[#30363d]
                           font-normal focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:ring-offset-2 
                           focus:ring-offset-[#0d1117]"
                aria-label="Branch selector"
                aria-expanded={showBranchDropdown}>
                <GitBranch size={14} />
                <span>{selectedBranch}</span>
                <ChevronDown size={14} className={`transition-transform duration-150 ${showBranchDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showBranchDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#161b22] rounded-md 
                                shadow-lg border border-[#30363d] py-1 z-50">
                  {Object.keys(repository.branches).map((branchName) => {
                    const isActive = branchName === selectedBranch;
                    return (
                      <button
                        key={branchName}
                        onClick={() => {
                          setSelectedBranch(branchName);
                          setShowBranchDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm
                                   hover:bg-[#21262d] transition-colors duration-150
                                   flex items-center gap-2 ${
                                     isActive ? 'text-[#f0f6fc] bg-[#21262d]' : 'text-[#8b949e]'
                                   }`}
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ 
                            backgroundColor: repository.branches[branchName].color.primary,
                            opacity: isActive ? 1 : 0.6 
                          }}
                        />
                        {branchName}
                        {isActive && (
                          <span className="ml-auto text-[10px] text-[#7d8590]">current</span>
                        )}
                      </button>
                    );
                  })}
                  <div className="border-t border-[#30363d] mt-1 pt-1">
                    {creatingBranch ? (
                      <div className="px-3 py-1.5">
                        <input
                          type="text"
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                          onBlur={() => {
                            if (newBranchName.trim() && !repository.branches[newBranchName.trim()]) {
                              handleCreateBranch(newBranchName.trim());
                              setShowBranchDropdown(false);
                            }
                            setCreatingBranch(false);
                            setNewBranchName('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (newBranchName.trim() && !repository.branches[newBranchName.trim()]) {
                                handleCreateBranch(newBranchName.trim());
                                setShowBranchDropdown(false);
                              }
                              setCreatingBranch(false);
                              setNewBranchName('');
                            }
                            if (e.key === 'Escape') {
                              setCreatingBranch(false);
                              setNewBranchName('');
                            }
                          }}
                          placeholder="Branch name..."
                          className="w-full bg-[#1c2128] border border-[#30363d] rounded px-2 py-1 text-sm text-[#f0f6fc] outline-none focus:border-[#58a6ff] placeholder-[#7d8590]"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setCreatingBranch(true);
                          setNewBranchName('');
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-[#58a6ff]
                                   hover:bg-[#21262d] transition-colors duration-150"
                      >
                        + Create new branch
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current version info - minimal */}
            {currentVersionData && (
              <div className="text-xs">
                <span className="text-[#7d8590] font-mono">{currentVersion}</span>
              </div>
            )}
          </div>
          
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            {mode === 'edit' ? (
              <>
                <button
                  onClick={() => {
                    // Save current changes before switching mode
                    if (activeFile && editingCode !== undefined) {
                      setModifiedFiles(prev => ({
                        ...prev,
                        [activeFile]: editingCode
                      }));
                    }
                    setMode('view');
                  }}
                  className="px-3 py-1 text-sm text-[#8b949e] hover:text-[#f0f6fc] 
                             transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  disabled={!commitMessage.trim()}
                  className="px-3 py-1 bg-[#238636] text-white rounded-md text-sm
                             hover:bg-[#2ea043] transition-colors duration-150 
                             flex items-center gap-1.5 font-medium
                             disabled:opacity-60 disabled:cursor-not-allowed
                             focus:outline-none focus:ring-2 focus:ring-[#238636] focus:ring-offset-2 
                             focus:ring-offset-[#0d1117]"
                >
                  <Save size={14} />
                  Commit changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('edit')}
                className="px-3 py-1 text-sm text-[#8b949e] hover:text-[#f0f6fc] 
                           hover:bg-[#21262d] rounded-md border border-[#30363d]
                           transition-all duration-150 focus:outline-none focus:ring-2 
                           focus:ring-[#58a6ff] focus:ring-offset-2 focus:ring-offset-[#0d1117]"
              >
                Edit code
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metro Map Visualization */}
      <div className="relative bg-[#0d1117] h-48 overflow-hidden flex-shrink-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full transition-transform duration-150"
          style={{ imageRendering: 'auto' }}
          onClick={handleCanvasClick}
          onMouseDown={(e) => {
            if (!hoveredNode) {
              setIsDragging(true);
              setDragStart({ x: e.clientX, y: e.clientY });
              canvasRef.current.style.cursor = 'grabbing';
            }
          }}
          onMouseUp={() => {
            setIsDragging(false);
            canvasRef.current.style.cursor = hoveredNode ? 'pointer' : 'grab';
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => {
            setHoveredNode(null);
            setIsDragging(false);
          }}
        />
        
        {/* Zoom controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <button
            onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
            className="p-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] 
                       rounded-md transition-colors duration-150 text-[#8b949e] hover:text-[#f0f6fc]"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))}
            className="p-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] 
                       rounded-md transition-colors duration-150 text-[#8b949e] hover:text-[#f0f6fc]"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] 
                       rounded-md transition-colors duration-150 text-[#8b949e] hover:text-[#f0f6fc]"
            title="Reset view"
          >
            <Maximize2 size={14} />
          </button>
        </div>
        
        {/* Professional version tooltip */}
        {hoveredNode && repository.versions[hoveredNode] && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 
                          bg-[#161b22] rounded-md text-xs
                          border border-[#30363d] shadow-md
                          transform transition-all duration-150 pointer-events-none">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[#7d8590]">{hoveredNode}</span>
              <span className="text-[#7d8590]">·</span>
              <span className="text-[#8b949e]">
                {(() => {
                  const date = new Date(repository.versions[hoveredNode].timestamp);
                  const now = new Date();
                  const diff = now - date;
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  const hours = Math.floor(diff / (1000 * 60 * 60));
                  const minutes = Math.floor(diff / (1000 * 60));
                  
                  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                  return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                })()}
              </span>
            </div>
            <div className="text-[#f0f6fc] font-medium">{repository.versions[hoveredNode].message}</div>
            <div className="text-[#7d8590] text-[11px] mt-1">
              by {repository.versions[hoveredNode].author}
              {repository.versions[hoveredNode].files && (
                <span className="ml-2">
                  · {Object.keys(repository.versions[hoveredNode].files).length} file{Object.keys(repository.versions[hoveredNode].files).length > 1 ? 's' : ''} changed
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="border-t border-[#30363d] flex-1 flex flex-col overflow-hidden">
        {!activeFile ? (
          <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-3 text-[#30363d]" />
              <p className="text-[#7d8590] text-sm mb-2">No file selected</p>
              <p className="text-[#7d8590] text-xs">
                Create or select a file to start editing
              </p>
            </div>
          </div>
        ) : mode === 'edit' ? (
          <div className="bg-[#0d1117] flex flex-col h-full">
            <div className="px-4 py-3 border-b border-[#30363d] flex-shrink-0">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message"
                className="w-full px-3 py-1.5 bg-[#0d1117] text-[#f0f6fc] text-sm
                           rounded-md border border-[#30363d] focus:border-[#58a6ff]
                           focus:outline-none focus:ring-1 focus:ring-[#58a6ff]/20 
                           placeholder-[#7d8590] font-normal"
              />
            </div>
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#161b22] 
                              border-r border-[#30363d] overflow-y-auto">
                <div className="text-[#7d8590] text-xs font-mono leading-6 py-3 text-right pr-3 select-none">
                  {editingCode.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </div>
              <textarea
                value={editingCode}
                onChange={(e) => setEditingCode(e.target.value)}
                className="w-full h-full pl-14 pr-4 py-3 bg-[#0d1117] text-[#f0f6fc] 
                           font-mono text-sm focus:outline-none resize-none leading-6 overflow-y-auto"
                placeholder="// Enter your code..."
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="relative bg-[#0d1117] h-full flex flex-col" ref={codeContainerRef}>
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#161b22] 
                              border-r border-[#30363d] overflow-y-auto">
                <div className="text-[#7d8590] text-xs font-mono leading-6 py-3 text-right pr-3 select-none">
                  {(currentVersionData?.files?.[activeFile]?.content || '').split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </div>
              <div className="pl-14 pr-4 py-3 h-full overflow-y-auto custom-scrollbar">
                <Highlight
                  theme={themes.nightOwl}
                  code={currentVersionData?.files?.[activeFile]?.content || '// No code yet'}
                  language={getLanguageFromFilename(activeFile)}
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={`${className} font-mono text-sm leading-6`} style={{ ...style, background: 'transparent' }}>
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line, key: i })}>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token, key })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </div>
            </div>
            {currentVersionData && (
              <div className="px-4 py-2 bg-[#010409] border-t border-[#30363d]
                              flex items-center gap-4 text-xs flex-shrink-0">
                <span className="flex items-center gap-1.5 text-[#7d8590]">
                  <User size={12} />
                  <span className="text-[#8b949e]">{currentVersionData.author}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#7d8590]">
                  <Clock size={12} />
                  <span className="text-[#8b949e]">
                    {new Date(currentVersionData.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-[#7d8590]">
                  <GitBranch size={12} />
                  <span className="text-[#8b949e]">{currentVersionData.branch || 'main'}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
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
    </>
  );
}