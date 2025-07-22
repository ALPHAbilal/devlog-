import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Save, GitBranch, Clock, User, Code2, ZoomIn, ZoomOut, Maximize2, 
         FileText, File, Folder, FolderOpen, ChevronRight, Plus, X, PanelLeftClose, PanelLeft } from 'lucide-react';

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

// Enhanced syntax highlighting with better regex patterns
const highlightCode = (code, language = 'javascript') => {
  // Escape HTML first
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // GitHub-style syntax highlighting
  const patterns = [
    // Comments (single and multi-line)
    { regex: /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)/g, class: 'text-[#8b949e]' },
    // Strings (including template literals)
    { regex: /(["'])(?:(?!\1)[^\\\n]|\\[\s\S])*\1/g, class: 'text-[#a5d6ff]' },
    { regex: /`(?:[^`\\]|\\[\s\S])*`/g, class: 'text-[#a5d6ff]' },
    // Keywords
    { regex: /\b(function|const|let|var|if|else|return|for|while|do|switch|case|break|continue|class|extends|import|export|from|default|new|async|await|try|catch|finally|throw|typeof|instanceof|in|of|this|super)\b/g, class: 'text-[#ff7b72]' },
    // Numbers
    { regex: /\b\d+(\.\d+)?([eE][+-]?\d+)?\b/g, class: 'text-[#79c0ff]' },
    // Boolean and null
    { regex: /\b(true|false|null|undefined)\b/g, class: 'text-[#79c0ff]' },
    // Function calls
    { regex: /\b([a-zA-Z_$][\w$]*)(?=\s*\()/g, class: 'text-[#d2a8ff]' },
  ];

  // Apply patterns in order
  patterns.forEach(({ regex, class: className }) => {
    highlighted = highlighted.replace(regex, `<span class="${className}">$&</span>`);
  });

  return highlighted;
};

export default function VersionTrackBlock({ block, onUpdate }) {
  // Initialize with proper version control structure
  const [repository, setRepository] = useState(() => {
    if (block.repository) {
      return block.repository;
    }
    
    // Create initial repository structure with file tree support
    const initialVersion = {
      id: 'v1',
      message: 'Initial commit',
      timestamp: new Date().toISOString(),
      author: 'user',
      parent: null,
      branch: 'main',
      files: {
        'index.js': {
          content: '// Main entry point\nfunction main() {\n  console.log("Hello, World!");\n}\n\nmain();',
          action: 'created',
          stats: { additions: 5, deletions: 0 }
        },
        'README.md': {
          content: '# My Project\n\nWelcome to my project!',
          action: 'created',
          stats: { additions: 3, deletions: 0 }
        }
      }
    };

    return {
      versions: { v1: initialVersion },
      branches: {
        main: { name: 'main', head: 'v1', color: BRANCH_COLORS.main }
      },
      HEAD: 'v1',
      fileTree: {
        'index.js': { type: 'file', lastModified: 'v1' },
        'README.md': { type: 'file', lastModified: 'v1' }
      },
      activeFile: 'index.js'
    };
  });

  const [currentVersion, setCurrentVersion] = useState(repository.HEAD);
  const [editingCode, setEditingCode] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodePositions, setNodePositions] = useState({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeFile, setActiveFile] = useState(repository.activeFile || 'index.js');
  const [showFileTree, setShowFileTree] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState(new Set());

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
    if (onUpdate && block.repository !== repository) {
      onUpdate(block.id, { repository });
    }
  }, [repository, block.id, onUpdate]);

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
      
      // File count indicator
      if (hasMultipleFiles && (isHovered || isCurrentVersion)) {
        ctx.fillStyle = '#161b22';
        ctx.fillRect(pos.x + 8, pos.y - 10, 16, 14);
        ctx.fillStyle = isCurrentVersion ? '#f0f6fc' : '#8b949e';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fileCount.toString(), pos.x + 16, pos.y - 1);
      }
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
      setCurrentVersion(clickedVersion);
      setRepository(prev => ({ ...prev, HEAD: clickedVersion }));
      
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
      setPan({ x: pan.x + dx, y: pan.y + dy });
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
    if (!editingCode.trim() || !commitMessage.trim()) {
      return;
    }

    const newVersionId = generateVersionId();
    const currentVersionData = repository.versions[currentVersion];
    
    // Calculate stats for the active file
    const oldContent = currentVersionData?.files?.[activeFile]?.content || '';
    const oldLines = oldContent.split('\n').length;
    const newLines = editingCode.split('\n').length;
    const additions = Math.max(0, newLines - oldLines);
    const deletions = Math.max(0, oldLines - newLines);
    
    // Create new version with updated file
    const newVersion = {
      id: newVersionId,
      message: commitMessage,
      timestamp: new Date().toISOString(),
      author: 'user',
      parent: currentVersion,
      branch: selectedBranch,
      files: {
        // Copy all existing files from parent version
        ...(currentVersionData?.files || {}),
        // Update the active file
        [activeFile]: {
          content: editingCode,
          action: currentVersionData?.files?.[activeFile] ? 'modified' : 'created',
          stats: { additions, deletions }
        }
      }
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
  
  // Create new file
  const handleCreateFile = () => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;
    
    // Check if file already exists
    if (repository.fileTree[fileName]) {
      alert('File already exists!');
      return;
    }
    
    // Determine file content based on extension
    const ext = fileName.split('.').pop().toLowerCase();
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
      message: `Created ${fileName}`,
      timestamp: new Date().toISOString(),
      author: 'user',
      parent: currentVersion,
      branch: selectedBranch,
      files: {
        ...(currentVersionData?.files || {}),
        [fileName]: {
          content: defaultContent,
          action: 'created',
          stats: { additions: defaultContent.split('\n').length, deletions: 0 }
        }
      }
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
        [fileName]: { type: 'file', lastModified: newVersionId }
      },
      activeFile: fileName
    }));
    
    setCurrentVersion(newVersionId);
    setActiveFile(fileName);
    setEditingCode(defaultContent);
    setMode('edit');
  };

  const currentVersionData = repository.versions[currentVersion];
  
  // Render file tree item
  const renderFileTreeItem = (name, item, path = '') => {
    const fullPath = path ? `${path}/${name}` : name;
    const isActive = fullPath === activeFile;
    const FileIcon = getFileIcon(name);
    
    return (
      <div
        key={fullPath}
        className={`flex items-center gap-2 px-3 py-1 text-sm cursor-pointer
                   hover:bg-[#21262d] transition-colors duration-150
                   ${isActive ? 'bg-[#21262d] text-[#f0f6fc]' : 'text-[#8b949e]'}`}
        onClick={() => {
          setActiveFile(fullPath);
          // Load the file content for the current version
          const version = repository.versions[currentVersion];
          if (version?.files?.[fullPath]) {
            setEditingCode(version.files[fullPath].content);
          }
        }}
      >
        <FileIcon size={16} className={isActive ? 'text-[#58a6ff]' : ''} />
        <span className="flex-1 truncate">{name}</span>
        {item.lastModified && (
          <span className="text-[10px] text-[#7d8590]">{item.lastModified}</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#0d1117] rounded-lg overflow-hidden border border-[#30363d] flex">
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
          <div className="flex-1 overflow-y-auto py-2">
            {Object.entries(repository.fileTree || {}).map(([name, item]) => 
              renderFileTreeItem(name, item)
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
              
              {/* Current file indicator */}
              <div className="flex items-center gap-2 text-sm">
                {(() => {
                  const FileIcon = getFileIcon(activeFile);
                  return (
                    <>
                      <FileIcon size={16} className="text-[#58a6ff]" />
                      <span className="text-[#f0f6fc] font-medium">{activeFile}</span>
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
                    <button
                      onClick={() => {
                        const name = prompt('New branch name:');
                        if (name && !repository.branches[name]) {
                          handleCreateBranch(name);
                          setShowBranchDropdown(false);
                        }
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm text-[#58a6ff]
                                 hover:bg-[#21262d] transition-colors duration-150"
                    >
                      + Create new branch
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Current version info */}
            {currentVersionData && (
              <div className="flex items-center gap-2 text-xs">
                <Code2 size={12} className="text-[#7d8590]" />
                <span className="text-[#7d8590] font-mono">{currentVersion}</span>
                <span className="text-[#7d8590]">·</span>
                <span className="text-[#8b949e]">{currentVersionData.message}</span>
              </div>
            )}
          </div>
          
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            {mode === 'edit' ? (
              <>
                <button
                  onClick={() => setMode('view')}
                  className="px-3 py-1 text-sm text-[#8b949e] hover:text-[#f0f6fc] 
                             transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  disabled={!editingCode.trim() || !commitMessage.trim()}
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
      <div className="relative bg-[#0d1117] h-64 overflow-hidden">
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
      <div className="border-t border-[#30363d] overflow-hidden">
        {mode === 'edit' ? (
          <div className="bg-[#0d1117]">
            <div className="px-4 py-3 border-b border-[#30363d]">
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
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#161b22] 
                              border-r border-[#30363d]">
                <div className="text-[#7d8590] text-xs font-mono leading-6 py-3 text-right pr-3 select-none">
                  {editingCode.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </div>
              <textarea
                value={editingCode}
                onChange={(e) => setEditingCode(e.target.value)}
                className="w-full h-64 pl-14 pr-4 py-3 bg-[#0d1117] text-[#f0f6fc] 
                           font-mono text-sm focus:outline-none resize-none leading-6"
                placeholder="// Enter your code..."
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="relative bg-[#0d1117]" ref={codeContainerRef}>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#161b22] 
                            border-r border-[#30363d]">
              <div className="text-[#7d8590] text-xs font-mono leading-6 py-3 text-right pr-3 select-none">
                {(currentVersionData?.files?.[activeFile]?.content || '').split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            </div>
            <div className="pl-14 pr-4 py-3 max-h-64 overflow-y-auto custom-scrollbar">
              <pre className="text-[#f0f6fc] font-mono text-sm leading-6 whitespace-pre-wrap break-words">
                <code 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightCode(currentVersionData?.files?.[activeFile]?.content || '// No code yet') 
                  }} 
                />
              </pre>
            </div>
            {currentVersionData && (
              <div className="px-4 py-2 bg-[#010409] border-t border-[#30363d]
                              flex items-center gap-4 text-xs">
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
  );
}