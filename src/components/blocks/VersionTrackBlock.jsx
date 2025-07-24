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
      className="fixed bg-dark-secondary rounded-md shadow-lg border border-dark-secondary/50 py-1 z-50"
      style={{ 
        left: `${x}px`, 
        top: `${y}px`,
        minWidth: '160px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        item.divider ? (
          <div key={index} className="border-t border-dark-secondary/50 my-1" />
        ) : (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-text-secondary 
                       hover:bg-dark-primary/50 hover:text-text-primary transition-colors duration-150
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

// Platform branch colors - matches the platform's design system
const BRANCH_COLORS = {
  main: { primary: '#4ade80', secondary: '#22c55e' },      // accent-green (default branch)
  feature: { primary: '#60a5fa', secondary: '#3b82f6' },   // blue-400/500 (active development)
  develop: { primary: '#a78bfa', secondary: '#8b5cf6' },   // purple-400/500 (development)
  hotfix: { primary: '#f87171', secondary: '#ef4444' },    // red-400/500 (urgent fixes)
  release: { primary: '#34d399', secondary: '#10b981' },   // emerald-400/500 (stable releases)
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
  const branchLanes = {};
  const activeLanes = new Set();
  const LANE_HEIGHT = 50; // Reduced for better fit
  const NODE_SPACING = 100; // Base spacing
  const START_X = 180; // More space from branch labels
  const START_Y = 40;
  
  // Build parent-child relationships and branch info
  const children = {};
  const branchHeads = {};
  Object.values(repository.versions).forEach(version => {
    if (version.parent) {
      if (!children[version.parent]) {
        children[version.parent] = [];
      }
      children[version.parent].push(version.id);
    }
    // Track branch heads
    const branch = version.branch || 'main';
    if (!branchHeads[branch] || new Date(version.timestamp) > new Date(branchHeads[branch].timestamp)) {
      branchHeads[branch] = version;
    }
  });
  
  // Sort all versions by timestamp
  const timeline = Object.values(repository.versions)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Always assign main to lane 0
  branchLanes['main'] = 0;
  activeLanes.add(0);
  
  // Track merge information
  const mergeInfo = {};
  
  // First pass: assign lanes to branches
  let maxLane = 0;
  timeline.forEach(version => {
    const branch = version.branch || 'main';
    
    if (!(branch in branchLanes)) {
      // Find the first available lane
      let lane = 1;
      while (activeLanes.has(lane)) {
        lane++;
      }
      branchLanes[branch] = lane;
      activeLanes.add(lane);
      maxLane = Math.max(maxLane, lane);
    }
    
    // Check if this is a merge (has multiple children or merges back to parent branch)
    if (version.parent) {
      const parentVersion = repository.versions[version.parent];
      if (parentVersion && parentVersion.branch !== version.branch) {
        // This could be a merge point
        const childrenOfParent = children[version.parent] || [];
        if (childrenOfParent.length > 1) {
          mergeInfo[version.id] = {
            fromLane: branchLanes[parentVersion.branch],
            toLane: branchLanes[version.branch]
          };
        }
      }
    }
  });
  
  // Calculate X positions with better spacing
  const xPositions = {};
  let currentX = START_X;
  
  // Group versions by timestamp proximity
  let lastTimestamp = null;
  timeline.forEach((version, index) => {
    if (lastTimestamp) {
      const timeDiff = new Date(version.timestamp) - new Date(lastTimestamp);
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Adjust spacing based on time difference
      if (hoursDiff < 1) {
        currentX += NODE_SPACING * 0.8; // Closer for rapid commits
      } else if (hoursDiff > 24) {
        currentX += NODE_SPACING * 1.2; // Further for distant commits
      } else {
        currentX += NODE_SPACING;
      }
    }
    
    xPositions[version.id] = currentX;
    lastTimestamp = version.timestamp;
  });
  
  // Second pass: calculate positions
  timeline.forEach(version => {
    const branch = version.branch || 'main';
    const lane = branchLanes[branch];
    
    positions[version.id] = {
      x: xPositions[version.id],
      y: START_Y + (lane * LANE_HEIGHT),
      branch: branch,
      lane: lane,
      timestamp: version.timestamp,
      isMerge: !!mergeInfo[version.id]
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

export default function VersionTrackBlock({ block, onUpdate, isActive }) {
  // Debug flag - set to true to enable comprehensive logging
  const DEBUG = false;
  const DEBUG_GRID = false; // Set to true to debug grid alignment
  const LOG_PREFIX = '🔵 VersionTrack:';
  
  // Log initial props
  if (DEBUG) {
    console.group(`${LOG_PREFIX} Component Initialization`);
    console.log('Block ID:', block?.id);
    console.log('Block Type:', block?.type);
    console.log('Block Data:', block?.data);
    console.log('Has Repository:', !!block?.data?.repository);
    console.log('OnUpdate Function:', typeof onUpdate);
    console.log('IsActive:', isActive);
    console.groupEnd();
  }
  
  // Initialize with proper version control structure
  const [repository, setRepositoryBase] = useState(() => {
    const initialRepo = (() => {
      if (block.data?.repository) {
        if (DEBUG) {
          console.log(`${LOG_PREFIX} Using existing repository from block.data`);
        }
        return block.data.repository;
      }
      
      if (DEBUG) {
        console.log(`${LOG_PREFIX} Creating new repository`);
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
    })();
    
    if (DEBUG) {
      console.log(`${LOG_PREFIX} Initial repository state:`, initialRepo);
    }
    
    return initialRepo;
  });

  // Wrapper function for setRepository with logging
  const setRepository = useCallback((updater) => {
    if (DEBUG) {
      console.group(`${LOG_PREFIX} Repository State Change`);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Update type:', typeof updater === 'function' ? 'Function updater' : 'Direct value');
    }
    
    setRepositoryBase((prev) => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      
      if (DEBUG) {
        console.log('Previous state:', prev);
        console.log('New state:', newState);
        console.log('State changed:', prev !== newState);
        
        // Log specific changes
        if (prev && newState) {
          if (prev.HEAD !== newState.HEAD) {
            console.log('HEAD changed:', prev.HEAD, '->', newState.HEAD);
          }
          if (Object.keys(prev.versions || {}).length !== Object.keys(newState.versions || {}).length) {
            console.log('Versions count changed:', Object.keys(prev.versions || {}).length, '->', Object.keys(newState.versions || {}).length);
          }
          if (prev.activeFile !== newState.activeFile) {
            console.log('Active file changed:', prev.activeFile, '->', newState.activeFile);
          }
        }
        
        console.groupEnd();
      }
      
      return newState;
    });
  }, [DEBUG]);
  
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
  const [stagedChanges, setStagedChanges] = useState({
    created: [], // { path, type: 'file'|'folder', content }
    modified: [], // { path }
    deleted: []  // { path }
  });
  const [hoveredNodeDetails, setHoveredNodeDetails] = useState(null);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const codeContainerRef = useRef(null);

  // Validation and diagnostics effect
  useEffect(() => {
    if (DEBUG) {
      console.group(`${LOG_PREFIX} Validation Check`);
      console.log('Timestamp:', new Date().toISOString());
      
      // Check critical props
      if (!onUpdate) {
        console.error('❌ CRITICAL: onUpdate prop is missing or undefined!');
      } else {
        console.log('✅ onUpdate prop is available');
      }
      
      if (!block) {
        console.error('❌ CRITICAL: block prop is missing!');
      } else {
        console.log('✅ block prop is available');
        console.log('Block structure:', {
          id: block.id,
          type: block.type,
          hasData: !!block.data,
          dataKeys: block.data ? Object.keys(block.data) : []
        });
      }
      
      // Check repository structure
      if (repository) {
        const repoStats = {
          versionsCount: Object.keys(repository.versions || {}).length,
          branchesCount: Object.keys(repository.branches || {}).length,
          hasHEAD: !!repository.HEAD,
          hasFileTree: !!repository.fileTree,
          fileTreeSize: JSON.stringify(repository.fileTree || {}).length
        };
        console.log('Repository stats:', repoStats);
        
        // Warn about potential issues
        if (repoStats.fileTreeSize > 100000) {
          console.warn('⚠️ Large file tree detected, might cause performance issues');
        }
      }
      
      console.groupEnd();
    }
  }, [onUpdate, block, repository, DEBUG]);
  
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
    if (DEBUG) {
      console.group(`${LOG_PREFIX} Save Effect Triggered`);
      console.log('Timestamp:', new Date().toISOString());
      console.log('OnUpdate exists:', !!onUpdate);
      console.log('Block ID:', block.id);
      console.log('Current block.data?.repository:', block.data?.repository);
      console.log('Current repository state:', repository);
      console.log('Are they different?:', block.data?.repository !== repository);
      
      // Deep comparison for debugging
      if (block.data?.repository && repository) {
        console.log('Repository versions count:', Object.keys(repository.versions || {}).length);
        console.log('Block data versions count:', Object.keys(block.data.repository.versions || {}).length);
        console.log('Repository HEAD:', repository.HEAD);
        console.log('Block data HEAD:', block.data.repository.HEAD);
      }
    }
    
    if (onUpdate && block.data?.repository !== repository) {
      const blockToSave = { ...block, data: { ...block.data, repository } };
      
      if (DEBUG) {
        console.log('🚀 Calling onUpdate with:', {
          blockId: block.id,
          blockType: block.type,
          dataStructure: blockToSave,
          repositorySize: JSON.stringify(repository).length,
          versionsCount: Object.keys(repository.versions || {}).length
        });
      }
      
      try {
        onUpdate(block.id, blockToSave);
        
        if (DEBUG) {
          console.log('✅ onUpdate called successfully');
        }
      } catch (error) {
        if (DEBUG) {
          console.error('❌ Error calling onUpdate:', error);
          console.error('Error stack:', error.stack);
        }
      }
    } else {
      if (DEBUG) {
        console.log('⏭️ Skipping update:', {
          hasOnUpdate: !!onUpdate,
          isRepositorySame: block.data?.repository === repository
        });
      }
    }
    
    if (DEBUG) {
      console.groupEnd();
    }
  }, [repository, block.id, onUpdate, block.data]);

  // Draw metro map visualization with enhanced graphics
  const drawMetroMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas with platform dark background
    ctx.fillStyle = '#0a1628'; // Darker background for better contrast
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Add subtle noise texture
    ctx.save();
    for (let i = 0; i < rect.width * rect.height * 0.03; i++) {
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      const opacity = Math.random() * 0.02 + 0.01;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
    
    // Enable better rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Apply zoom and pan transforms for everything
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw dynamic grid in world space (same coordinate system as nodes)
    ctx.save();
    
    // Calculate visible bounds in world coordinates
    const worldLeft = -pan.x / zoom;
    const worldTop = -pan.y / zoom;
    const worldRight = (rect.width - pan.x) / zoom;
    const worldBottom = (rect.height - pan.y) / zoom;
    
    // Draw vertical lines at each node's X position
    const nodeXPositions = [...new Set(Object.values(nodePositions).map(pos => pos.x))].sort((a, b) => a - b);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 0.5 / zoom; // Adjust line width for zoom
    ctx.globalAlpha = 0.15;
    
    nodeXPositions.forEach(x => {
      // Only draw if line is within or near visible bounds
      if (x >= worldLeft - 50 && x <= worldRight + 50) {
        ctx.beginPath();
        ctx.setLineDash([2 / zoom, 4 / zoom]); // Adjust dash for zoom
        ctx.moveTo(x, worldTop - 100);
        ctx.lineTo(x, worldBottom + 100);
        ctx.stroke();
      }
    });
    
    // Draw horizontal lane guides for each branch
    const laneLevels = [...new Set(Object.values(nodePositions).map(pos => pos.y))].sort((a, b) => a - b);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 0.3 / zoom; // Adjust line width for zoom
    ctx.globalAlpha = 0.2;
    
    laneLevels.forEach(y => {
      // Only draw if line is within or near visible bounds
      if (y >= worldTop - 50 && y <= worldBottom + 50) {
        ctx.beginPath();
        ctx.setLineDash([1 / zoom, 8 / zoom]); // Adjust dash for zoom
        ctx.moveTo(worldLeft - 100, y);
        ctx.lineTo(worldRight + 100, y);
        ctx.stroke();
      }
    });
    
    ctx.setLineDash([]);
    ctx.restore();
    
    // Draw branch lane backgrounds
    const laneBgData = {};
    Object.values(repository.versions).forEach(version => {
      const pos = nodePositions[version.id];
      if (pos) {
        if (!laneBgData[pos.lane]) {
          laneBgData[pos.lane] = {
            y: pos.y,
            branch: version.branch || 'main',
            color: repository.branches[version.branch || 'main']?.color || BRANCH_COLORS.main
          };
        }
      }
    });
    
    // Draw subtle lane backgrounds
    ctx.save();
    Object.values(laneBgData).forEach(lane => {
      const isActiveBranch = lane.branch === selectedBranch;
      ctx.fillStyle = isActiveBranch ? `${lane.color.primary}08` : `${lane.color.primary}04`;
      ctx.fillRect(-1000, lane.y - 25, rect.width / zoom + 2000, 50);
    });
    ctx.restore();
    
    // Build path from current version to root for highlighting
    const pathToRoot = new Set();
    if (currentVersion) {
      let current = currentVersion;
      while (current) {
        pathToRoot.add(current);
        const version = repository.versions[current];
        current = version ? version.parent : null;
      }
    }
    
    // Draw connections with enhanced styling
    Object.values(repository.versions).forEach(version => {
      if (version.parent) {
        const parentPos = nodePositions[version.parent];
        const childPos = nodePositions[version.id];
        
        if (parentPos && childPos) {
          const branch = repository.branches[version.branch] || repository.branches.main;
          const isCurrentBranch = version.branch === selectedBranch;
          const isHovered = hoveredNode === version.id || hoveredNode === version.parent;
          const isInPath = pathToRoot.has(version.id) && pathToRoot.has(version.parent);
          
          // Create gradient for the connection
          const gradient = ctx.createLinearGradient(parentPos.x, parentPos.y, childPos.x, childPos.y);
          if (isInPath) {
            // Highlighted path with brighter colors
            gradient.addColorStop(0, branch.color.primary);
            gradient.addColorStop(1, `${branch.color.primary}EE`);
          } else if (isCurrentBranch) {
            gradient.addColorStop(0, `${branch.color.primary}CC`);
            gradient.addColorStop(1, branch.color.primary);
          } else {
            gradient.addColorStop(0, `${branch.color.primary}40`);
            gradient.addColorStop(1, `${branch.color.primary}60`);
          }
          
          ctx.save();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = isInPath ? 5 : (isCurrentBranch ? 4 : 3);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Add glow effect for active branch or path
          if (isInPath || isCurrentBranch || isHovered) {
            ctx.shadowColor = branch.color.primary;
            ctx.shadowBlur = isInPath ? 10 : (isHovered ? 8 : 4);
          }
          
          ctx.beginPath();
          ctx.moveTo(parentPos.x, parentPos.y);
          
          // 90-degree connections like traditional Git graphs
          if (parentPos.y !== childPos.y) {
            // Draw a right-angle connection
            const midX = parentPos.x + (childPos.x - parentPos.x) * 0.5;
            
            // Horizontal line to mid-point
            ctx.lineTo(midX, parentPos.y);
            // Vertical line to child's Y position
            ctx.lineTo(midX, childPos.y);
            // Horizontal line to child
            ctx.lineTo(childPos.x, childPos.y);
          } else {
            // Straight horizontal line for same lane
            ctx.lineTo(childPos.x, childPos.y);
          }
          
          ctx.stroke();
          ctx.restore();
        }
      }
    });
    
    // Draw nodes with modern enhanced design
    Object.entries(repository.versions).forEach(([versionId, version]) => {
      const pos = nodePositions[versionId];
      if (!pos) return;
      
      const branch = repository.branches[version.branch] || repository.branches.main;
      const isCurrentVersion = versionId === currentVersion;
      const isHEAD = versionId === repository.HEAD;
      const isHovered = hoveredNode === versionId;
      const isMergeCommit = pos.isMerge || version.message?.toLowerCase().includes('merge');
      const isInPath = pathToRoot.has(versionId);
      
      ctx.save();
      
      // Drop shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // Base node - larger size for important nodes
      const nodeRadius = (isHEAD || isInPath) ? 8 : 7;
      
      // Draw node border/background
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#0a1628'; // Dark background
      ctx.fill();
      ctx.strokeStyle = isInPath ? branch.color.primary : `${branch.color.primary}CC`;
      ctx.lineWidth = isInPath ? 3 : 2;
      ctx.stroke();
      
      // Inner fill with branch color
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius - 2, 0, Math.PI * 2);
      ctx.fillStyle = isCurrentVersion || isInPath ? branch.color.primary : `${branch.color.primary}40`;
      ctx.fill();
      
      // Reset shadow for cleaner rings
      ctx.shadowColor = 'transparent';
      
      // HEAD double-ring indicator
      if (isHEAD) {
        // Outer ring
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = branch.color.primary;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Optional: Add a subtle glow
        ctx.save();
        ctx.shadowColor = branch.color.primary;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = `${branch.color.primary}60`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
      
      // Current version highlight (if different from HEAD)
      if (isCurrentVersion && !isHEAD) {
        ctx.strokeStyle = `${branch.color.primary}80`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Hover effect - scale animation suggestion
      if (isHovered) {
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = branch.color.primary;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      // Merge commit indicator - special symbol
      if (isMergeCommit) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⬡', pos.x, pos.y);
      }
      
      ctx.restore();
    });
    
    // Restore transform
    ctx.restore();
    
    // Draw branch labels aligned with their lanes
    const branchLanes = {};
    Object.values(repository.versions).forEach(version => {
      const branch = version.branch || 'main';
      if (nodePositions[version.id]) {
        branchLanes[branch] = nodePositions[version.id].lane;
      }
    });
    
    Object.entries(repository.branches).forEach(([branchName, branch]) => {
      const isActive = branchName === selectedBranch;
      const lane = branchLanes[branchName] || 0;
      const worldYPos = 40 + (lane * 50); // Y position in world coordinates
      const screenYPos = (worldYPos * zoom) + pan.y; // Transform to screen coordinates
      
      // Only draw if visible
      if (screenYPos >= -50 && screenYPos <= rect.height + 50) {
        // Branch indicator line
        ctx.strokeStyle = isActive ? branch.color.primary : branch.color.primary + '60';
        ctx.lineWidth = 3;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(16, screenYPos);
        ctx.lineTo(40, screenYPos);
        ctx.stroke();
        
        // Branch name with system font
        ctx.fillStyle = isActive ? '#e5e7eb' : '#9ca3af'; // text-text-primary/secondary equivalents
        ctx.font = `${isActive ? '600' : '400'} 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(branchName, 48, screenYPos + 4);
        
        // Draw lane guide line
        ctx.strokeStyle = branch.color.primary + '20';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(150, screenYPos);
        ctx.lineTo(rect.width - 20, screenYPos);
        ctx.stroke();
        ctx.setLineDash([]);
      }
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
      
      // Subtle visual feedback with smooth transition
      const canvas = canvasRef.current;
      canvas.style.transition = 'transform 0.15s ease';
      canvas.style.transform = 'scale(0.98)';
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
    let foundNodePos = null;
    Object.entries(nodePositions).forEach(([versionId, pos]) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 12) {
        foundNode = versionId;
        foundNodePos = pos;
      }
    });
    
    setHoveredNode(foundNode);
    
    // Set hover details for tooltip
    if (foundNode && foundNodePos) {
      const version = repository.versions[foundNode];
      if (version) {
        // Calculate screen position for tooltip
        const screenX = (foundNodePos.x * zoom + pan.x) + rect.left;
        const screenY = (foundNodePos.y * zoom + pan.y) + rect.top;
        
        // Count files changed
        let filesChanged = 0;
        if (version.files) {
          filesChanged = Object.keys(version.files).length;
        }
        
        // Calculate time ago
        const timeAgo = (timestamp) => {
          const now = new Date();
          const date = new Date(timestamp);
          const seconds = Math.floor((now - date) / 1000);
          
          if (seconds < 60) return 'just now';
          if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
          if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
          if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
          return date.toLocaleDateString();
        };
        
        setHoveredNodeDetails({
          x: screenX,
          y: screenY,
          version: foundNode,
          message: version.message || 'No message',
          author: version.author || 'Unknown',
          time: timeAgo(version.timestamp),
          filesChanged,
          branch: version.branch || 'main'
        });
      }
    } else {
      setHoveredNodeDetails(null);
    }
    
    canvasRef.current.style.cursor = foundNode ? 'pointer' : isDragging ? 'grabbing' : 'grab';
  };

  // Create new version (commit)
  const handleCommit = () => {
    if (DEBUG) {
      console.group(`${LOG_PREFIX} Commit Operation`);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Commit message:', commitMessage);
      console.log('Current version:', currentVersion);
      console.log('Selected branch:', selectedBranch);
      console.log('Modified files:', modifiedFiles);
      console.log('Staged changes:', stagedChanges);
      console.log('Active file:', activeFile);
      console.log('Mode:', mode);
    }
    
    if (!commitMessage.trim()) {
      if (DEBUG) {
        console.log('❌ Commit aborted: No commit message');
        console.groupEnd();
      }
      return;
    }

    const newVersionId = generateVersionId();
    const currentVersionData = repository.versions[currentVersion];
    
    if (DEBUG) {
      console.log('Generated new version ID:', newVersionId);
      console.log('Current version data:', currentVersionData);
    }
    
    // Save current file if being edited
    const allModifiedFiles = { ...modifiedFiles };
    if (mode === 'edit' && activeFile && editingCode !== undefined) {
      allModifiedFiles[activeFile] = editingCode;
      if (DEBUG) {
        console.log('Added current file to modified files:', activeFile);
      }
    }
    
    // Check if there are any changes to commit
    const hasChanges = stagedChanges.created.length > 0 || 
                      stagedChanges.deleted.length > 0 || 
                      Object.keys(allModifiedFiles).length > 0;
    
    if (!hasChanges) {
      if (DEBUG) {
        console.log('❌ Commit aborted: No changes to commit');
        console.groupEnd();
      }
      return; // Nothing to commit
    }
    
    if (DEBUG) {
      console.log('Changes detected:', {
        created: stagedChanges.created.length,
        deleted: stagedChanges.deleted.length,
        modified: Object.keys(allModifiedFiles).length
      });
    }
    
    // Build complete file snapshot from current state
    const fileSnapshot = {};
    
    // Helper to traverse file tree and collect all file contents
    const collectFiles = (tree, path = '') => {
      Object.entries(tree).forEach(([name, item]) => {
        const fullPath = path ? `${path}/${name}` : name;
        
        if (item.type === 'file') {
          // Skip deleted files
          if (stagedChanges.deleted.some(d => d === fullPath)) {
            return;
          }
          
          // Get content from modified files, staged files, or current version
          let content = '';
          const stagedFile = stagedChanges.created.find(f => f.path === fullPath);
          
          if (allModifiedFiles[fullPath] !== undefined) {
            content = allModifiedFiles[fullPath];
          } else if (stagedFile) {
            content = stagedFile.content;
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
      HEAD: newVersionId
    }));

    setCurrentVersion(newVersionId);
    setCommitMessage('');
    setMode('view');
    setModifiedFiles({}); // Clear all modified files after commit
    setStagedChanges({ created: [], modified: [], deleted: [] }); // Clear staged changes
    
    // Clean up staged indicators from file tree
    const cleanTree = JSON.parse(JSON.stringify(repository.fileTree));
    const cleanStaged = (tree) => {
      Object.entries(tree).forEach(([name, item]) => {
        if (item.staged) {
          delete item.staged;
        }
        if (item.type === 'folder' && item.children) {
          cleanStaged(item.children);
        }
      });
    };
    cleanStaged(cleanTree);
    
    setRepository(prev => ({
      ...prev,
      fileTree: cleanTree
    }));
    
    if (DEBUG) {
      console.log('✅ Commit successful:', {
        versionId: newVersionId,
        filesCount: Object.keys(fileSnapshot).length,
        fileSnapshot: fileSnapshot,
        newVersion: newVersion
      });
      console.log('Repository state after commit:', repository);
      console.groupEnd();
    }
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
        children: {}
      });
      
      setRepository(prev => ({
        ...prev,
        fileTree: newTree
      }));
      
      // Expand parent folders to show the new folder
      if (parentPath) {
        setExpandedDirs(prev => {
          const newSet = new Set(prev);
          const parts = parentPath.split('/');
          let path = '';
          for (const part of parts) {
            path = path ? `${path}/${part}` : part;
            newSet.add(path);
          }
          return newSet;
        });
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
      
      // Stage the new file instead of creating a version
      const newTree = JSON.parse(JSON.stringify(repository.fileTree));
      updateFileTree(newTree, fullPath, { type: 'file', staged: 'created' });
      
      setRepository(prev => ({
        ...prev,
        fileTree: newTree,
        activeFile: fullPath
      }));
      
      // Add to staged changes
      setStagedChanges(prev => ({
        ...prev,
        created: [...prev.created, { path: fullPath, type: 'file', content: defaultContent }]
      }));
      
      // Add to modified files so content is available
      setModifiedFiles(prev => ({
        ...prev,
        [fullPath]: defaultContent
      }));
      
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
      onUpdate(block.id, { ...block, data: { ...block.data, repository: { ...repository, fileTree: newTree } } });
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
      onUpdate(block.id, { ...block, data: { ...block.data, repository: { ...repository, fileTree: newTree } } });
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
      const isExpanded = isFolder && expandedDirs.has(fullPath);
      const paddingLeft = 12 + (depth * 16);
      const isBeingRenamed = renamingPath === fullPath;
      
      if (isFolder) {
        return (
          <div key={fullPath}>
            <div
              className={`flex items-center gap-1 px-2 py-1 text-sm cursor-pointer
                         hover:bg-dark-primary/50 transition-colors duration-150 text-text-secondary`}
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
                  className="flex-1 bg-dark-secondary border border-dark-secondary/50 rounded px-1 text-sm text-text-primary outline-none focus:border-accent-green"
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
                      className="flex-1 bg-dark-secondary border border-dark-secondary/50 rounded px-1 text-sm text-text-primary outline-none focus:border-accent-green placeholder-text-secondary/50"
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
        const isStaged = item.staged === 'created' || stagedChanges.created.some(f => f.path === fullPath);
        const isModified = modifiedFiles[fullPath] !== undefined || (isActive && mode === 'edit');
        
        return (
          <div
            key={fullPath}
            className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer
                       hover:bg-dark-primary/50 transition-colors duration-150
                       ${isActive ? 'bg-dark-primary/50 text-text-primary' : 'text-text-secondary'}`}
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
            <FileIcon size={16} className={isActive ? 'text-accent-green' : ''} />
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
                className="flex-1 bg-dark-secondary border border-dark-secondary/50 rounded px-1 text-sm text-text-primary outline-none focus:border-accent-green"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="flex-1 truncate">{name}</span>
                {/* Show staged/modified indicators */}
                <div className="flex items-center gap-1">
                  {isStaged && (
                    <span className="text-[10px] text-accent-green" title="Staged">●</span>
                  )}
                  {isModified && !isStaged && (
                    <span className="text-[10px] text-yellow-500" title="Modified">●</span>
                  )}
                </div>
                {item.lastModified && !modifiedFiles[fullPath] && !isStaged && (
                  <span className="text-[10px] text-text-secondary/70 ml-2">{item.lastModified}</span>
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
            className="flex-1 bg-dark-secondary border border-dark-secondary/50 rounded px-1 text-sm text-text-primary outline-none focus:border-accent-green placeholder-text-secondary/50"
            autoFocus
          />
        </div>
      );
    }
    
    return result;
  };

  return (
    <>
    <div className="bg-dark-primary rounded-lg overflow-hidden border-2 border-dark-secondary flex h-[600px]">
      {/* File Tree Sidebar */}
      {showFileTree && (
        <div className="w-64 bg-dark-secondary border-r-2 border-dark-secondary flex flex-col">
          <div className="px-3 py-2 border-b border-dark-secondary/50 flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">FILES</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateFile}
                className="p-1 hover:bg-dark-primary/50 rounded transition-colors duration-150"
                title="New file"
              >
                <Plus size={14} className="text-text-secondary hover:text-text-primary" />
              </button>
              <button
                onClick={() => setShowFileTree(false)}
                className="p-1 hover:bg-dark-primary/50 rounded transition-colors duration-150"
                title="Hide file tree"
              >
                <PanelLeftClose size={14} className="text-text-secondary" />
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
                <Folder size={32} className="mx-auto mb-2 text-dark-secondary/50" />
                <p className="text-text-secondary text-xs mb-2">No files yet</p>
                <p className="text-text-secondary text-[11px]">
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
        <div className="px-4 py-3 border-b border-dark-secondary/50 bg-dark-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* File tree toggle */}
              {!showFileTree && (
                <button
                  onClick={() => setShowFileTree(true)}
                  className="p-1 hover:bg-dark-primary/50 rounded transition-colors duration-150"
                  title="Show file tree"
                >
                  <PanelLeft size={18} className="text-text-secondary" />
                </button>
              )}
              
              {/* Breadcrumb navigation */}
              <div className="flex items-center gap-1 text-sm">
                {(() => {
                  if (!activeFile) {
                    return <span className="text-text-secondary">No file selected</span>;
                  }
                  
                  const parts = activeFile.split('/');
                  const fileName = parts.pop();
                  const FileIcon = getFileIcon(fileName);
                  
                  return (
                    <>
                      {/* Root/Home */}
                      <button
                        onClick={() => setActiveFile('')}
                        className="p-1 hover:bg-dark-primary/50 rounded transition-colors duration-150"
                        title="Root"
                      >
                        <Home size={14} className="text-text-secondary" />
                      </button>
                      
                      {/* Folder path */}
                      {parts.map((part, index) => {
                        const path = parts.slice(0, index + 1).join('/');
                        return (
                          <React.Fragment key={path}>
                            <ChevronRight size={14} className="text-dark-secondary" />
                            <button
                              onClick={() => {
                                // Expand the folder in tree
                                const newExpandedDirs = new Set(expandedDirs);
                                newExpandedDirs.add(path);
                                setExpandedDirs(newExpandedDirs);
                              }}
                              className="px-2 py-1 hover:bg-dark-primary/50 rounded transition-colors duration-150 
                                         text-text-secondary hover:text-text-primary"
                            >
                              {part}
                            </button>
                          </React.Fragment>
                        );
                      })}
                      
                      {/* Current file */}
                      {parts.length > 0 && <ChevronRight size={14} className="text-dark-secondary" />}
                      <div className="flex items-center gap-2 px-2 py-1 bg-dark-primary/50 rounded">
                        <FileIcon size={16} className="text-accent-green" />
                        <span className="text-text-primary font-medium">{fileName}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* Branch selector */}
              <div className="relative">
              <button 
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="flex items-center gap-2 px-3 py-1 bg-dark-primary/50 rounded-md
                           text-text-secondary hover:text-text-primary hover:bg-dark-secondary 
                           transition-all duration-150 text-sm border border-dark-secondary/50
                           font-normal focus:outline-none focus:ring-2 focus:ring-accent-green focus:ring-offset-2 
                           focus:ring-offset-dark-primary"
                aria-label="Branch selector"
                aria-expanded={showBranchDropdown}>
                <GitBranch size={14} />
                <span>{selectedBranch}</span>
                <ChevronDown size={14} className={`transition-transform duration-150 ${showBranchDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showBranchDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-dark-secondary rounded-md 
                                shadow-lg border border-dark-secondary/50 py-1 z-50">
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
                                   hover:bg-dark-primary/50 transition-colors duration-150
                                   flex items-center gap-2 ${
                                     isActive ? 'text-text-primary bg-dark-primary/50' : 'text-text-secondary'
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
                          <span className="ml-auto text-[10px] text-text-secondary/70">current</span>
                        )}
                      </button>
                    );
                  })}
                  <div className="border-t border-dark-secondary/50 mt-1 pt-1">
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
                          className="w-full bg-dark-secondary border border-dark-secondary/50 rounded px-2 py-1 text-sm text-text-primary outline-none focus:border-accent-green placeholder-text-secondary/50"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setCreatingBranch(true);
                          setNewBranchName('');
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-accent-green
                                   hover:bg-dark-primary/50 transition-colors duration-150"
                      >
                        + Create new branch
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Branch info only */}
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
                  className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary 
                             transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  disabled={!commitMessage.trim()}
                  className="px-3 py-1 bg-accent-green text-dark-primary rounded-md text-sm
                             hover:bg-accent-green/80 transition-colors duration-150 
                             flex items-center gap-1.5 font-medium
                             disabled:opacity-60 disabled:cursor-not-allowed
                             focus:outline-none focus:ring-2 focus:ring-accent-green focus:ring-offset-2 
                             focus:ring-offset-dark-primary"
                >
                  <Save size={14} />
                  Commit changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('edit')}
                className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary 
                           hover:bg-dark-primary/50 rounded-md border border-dark-secondary/50
                           transition-all duration-150 focus:outline-none focus:ring-2 
                           focus:ring-accent-green focus:ring-offset-2 focus:ring-offset-dark-primary"
              >
                Edit code
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metro Map Visualization */}
      <div className="relative bg-dark-primary h-48 overflow-hidden flex-shrink-0 border-b-2 border-dark-secondary">
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
            setHoveredNodeDetails(null);
            setIsDragging(false);
          }}
        />
        
        {/* Zoom controls - enhanced visibility */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 bg-dark-secondary rounded-lg p-1 border border-dark-secondary/50 shadow-lg">
          <button
            onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
            className="p-1.5 bg-dark-primary/50 hover:bg-dark-secondary border border-dark-secondary/50 
                       rounded transition-all duration-150 text-text-secondary hover:text-text-primary
                       hover:scale-110"
            title="Zoom in (+)"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))}
            className="p-1.5 bg-dark-primary/50 hover:bg-dark-secondary border border-dark-secondary/50 
                       rounded transition-all duration-150 text-text-secondary hover:text-text-primary
                       hover:scale-110"
            title="Zoom out (-)"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 bg-dark-primary/50 hover:bg-dark-secondary border border-dark-secondary/50 
                       rounded transition-all duration-150 text-text-secondary hover:text-text-primary
                       hover:scale-110"
            title="Reset view (0)"
          >
            <Maximize2 size={16} />
          </button>
          <div className="text-[10px] text-center text-text-secondary/70 mt-1">
            {Math.round(zoom * 100)}%
          </div>
        </div>
        
        {/* Enhanced commit preview tooltip */}
        {hoveredNodeDetails && createPortal(
          <div 
            className="fixed px-4 py-3 bg-dark-secondary/95 backdrop-blur-sm rounded-lg text-sm
                       border border-dark-secondary/50 shadow-xl pointer-events-none z-50
                       transform -translate-x-1/2 -translate-y-full -mt-3"
            style={{
              left: `${hoveredNodeDetails.x}px`,
              top: `${hoveredNodeDetails.y - 10}px`,
            }}
          >
            {/* Arrow pointing down */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-px">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent 
                              border-r-[6px] border-r-transparent 
                              border-t-[6px] border-t-dark-secondary/95"></div>
            </div>
            
            {/* Content */}
            <div className="space-y-2">
              {/* Header with branch and version */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: `${repository.branches[hoveredNodeDetails.branch]?.color.primary || BRANCH_COLORS.main.primary}20`,
                        color: repository.branches[hoveredNodeDetails.branch]?.color.primary || BRANCH_COLORS.main.primary
                      }}>
                  {hoveredNodeDetails.branch}
                </span>
                <span className="font-mono text-xs text-text-secondary">
                  {hoveredNodeDetails.version}
                </span>
              </div>
              
              {/* Commit message */}
              <div className="font-medium text-text-primary leading-relaxed">
                {hoveredNodeDetails.message}
              </div>
              
              {/* Meta info */}
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{hoveredNodeDetails.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{hoveredNodeDetails.time}</span>
                </div>
                {hoveredNodeDetails.filesChanged > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText size={12} />
                    <span>{hoveredNodeDetails.filesChanged} {hoveredNodeDetails.filesChanged === 1 ? 'file' : 'files'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeFile ? (
          <div className="flex-1 flex items-center justify-center bg-dark-primary">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-3 text-dark-secondary" />
              <p className="text-text-secondary/70 text-sm mb-2">No file selected</p>
              <p className="text-text-secondary/70 text-xs">
                Create or select a file to start editing
              </p>
            </div>
          </div>
        ) : mode === 'edit' ? (
          <div className="bg-dark-primary flex flex-col h-full">
            <div className="px-4 py-3 border-b border-dark-secondary/50 flex-shrink-0">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message"
                className="w-full px-3 py-1.5 bg-dark-primary text-text-primary text-sm
                           rounded-md border border-dark-secondary/50 focus:border-accent-green
                           focus:outline-none focus:ring-1 focus:ring-accent-green/20 
                           placeholder-text-secondary/50 font-normal"
              />
            </div>
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-dark-secondary 
                              border-r border-dark-secondary/50 overflow-y-auto">
                <div className="text-text-secondary/70 text-xs font-mono leading-6 py-3 text-right pr-3 select-none">
                  {editingCode.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </div>
              <textarea
                value={editingCode}
                onChange={(e) => setEditingCode(e.target.value)}
                className="w-full h-full pl-14 pr-4 py-3 bg-dark-primary text-text-primary 
                           font-mono text-sm focus:outline-none resize-none leading-6 overflow-y-auto"
                placeholder="// Enter your code..."
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="relative bg-dark-primary h-full flex flex-col" ref={codeContainerRef}>
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-dark-secondary 
                              border-r border-dark-secondary/50 overflow-y-auto">
                <div className="text-text-secondary/70 text-xs font-mono leading-6 py-3 text-right pr-3 select-none">
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
              <div className="px-4 py-2 bg-dark-primary border-t border-dark-secondary/50
                              flex items-center gap-4 text-xs flex-shrink-0">
                <span className="flex items-center gap-1.5 text-text-secondary/70">
                  <User size={12} />
                  <span className="text-text-secondary">{currentVersionData.author}</span>
                </span>
                <span className="flex items-center gap-1.5 text-text-secondary/70">
                  <Clock size={12} />
                  <span className="text-text-secondary">
                    {new Date(currentVersionData.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-text-secondary/70">
                  <GitBranch size={12} />
                  <span className="text-text-secondary">{currentVersionData.branch || 'main'}</span>
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