import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Save, GitBranch, Clock, User, Code2 } from 'lucide-react';

// Branch colors with gradients
const BRANCH_COLORS = {
  main: { primary: '#F59E0B', secondary: '#D97706' },      // Yellow/Amber
  feature: { primary: '#3B82F6', secondary: '#2563EB' },   // Blue
  develop: { primary: '#8B5CF6', secondary: '#7C3AED' },   // Purple
  hotfix: { primary: '#EC4899', secondary: '#DB2777' },    // Pink
  release: { primary: '#10B981', secondary: '#059669' },   // Green
};

// Generate a short ID for versions
const generateVersionId = () => {
  return 'v' + Date.now().toString(36);
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

  // More robust patterns
  const patterns = [
    // Comments (single and multi-line)
    { regex: /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)/g, class: 'text-gray-500' },
    // Strings (including template literals)
    { regex: /(["'])(?:(?!\1)[^\\\n]|\\[\s\S])*\1/g, class: 'text-green-400' },
    { regex: /`(?:[^`\\]|\\[\s\S])*`/g, class: 'text-green-400' },
    // Keywords
    { regex: /\b(function|const|let|var|if|else|return|for|while|do|switch|case|break|continue|class|extends|import|export|from|default|new|async|await|try|catch|finally|throw|typeof|instanceof|in|of|this|super)\b/g, class: 'text-purple-400' },
    // Numbers
    { regex: /\b\d+(\.\d+)?([eE][+-]?\d+)?\b/g, class: 'text-orange-400' },
    // Boolean and null
    { regex: /\b(true|false|null|undefined)\b/g, class: 'text-orange-400' },
    // Function calls
    { regex: /\b([a-zA-Z_$][\w$]*)(?=\s*\()/g, class: 'text-blue-400' },
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
    
    // Create initial repository structure
    const initialVersion = {
      id: 'v1',
      content: '// Initial version\nfunction hello() {\n  return "Hello, World!";\n}',
      message: 'Initial commit',
      timestamp: new Date().toISOString(),
      author: 'user',
      parent: null,
      branch: 'main'
    };

    return {
      versions: { v1: initialVersion },
      branches: {
        main: { name: 'main', head: 'v1', color: BRANCH_COLORS.main }
      },
      HEAD: 'v1'
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

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const codeContainerRef = useRef(null);

  // Update node positions when repository changes
  useEffect(() => {
    setNodePositions(calculateNodePositions(repository));
  }, [repository]);

  // Load current version's code when HEAD changes
  useEffect(() => {
    const version = repository.versions[currentVersion];
    if (version) {
      setEditingCode(version.content);
      setSelectedBranch(version.branch || 'main');
    }
  }, [currentVersion, repository]);

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
    
    // Clear canvas with anti-aliasing
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Enable better rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw connections with gradients
    Object.values(repository.versions).forEach(version => {
      if (version.parent) {
        const parentPos = nodePositions[version.parent];
        const childPos = nodePositions[version.id];
        
        if (parentPos && childPos) {
          const branch = repository.branches[version.branch] || repository.branches.main;
          ctx.strokeStyle = branch.color.primary;
          ctx.lineWidth = 3;
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
      
      
      // Add subtle shadow for depth
      if (isHovered || isCurrentVersion) {
        ctx.save();
        ctx.shadowColor = branch.color.primary;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      // Outer ring with smooth edges
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isHovered ? 11 : 10, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      
      ctx.strokeStyle = branch.color.primary;
      ctx.lineWidth = isCurrentVersion ? 4 : 3;
      ctx.stroke();
      
      // Inner circle with better visual hierarchy
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = isCurrentVersion ? branch.color.primary : '#000000';
      ctx.fill();
      
      if (!isCurrentVersion) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? branch.color.primary : branch.color.primary + '99';
        ctx.fill();
      }
      
      
      // Selection ring
      if (isCurrentVersion) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
        ctx.strokeStyle = branch.color.primary;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    
    // Draw branch labels
    let yOffset = 30;
    Object.entries(repository.branches).forEach(([branchName, branch]) => {
      // Branch line preview with rounded caps
      ctx.save();
      ctx.strokeStyle = branch.color.primary;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(20, yOffset);
      ctx.lineTo(45, yOffset);
      ctx.stroke();
      ctx.restore();
      
      // Branch name with better typography
      ctx.fillStyle = '#E5E7EB';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(branchName, 55, yOffset + 4);
      
      yOffset += 25;
    });
  }, [repository, nodePositions, currentVersion, hoveredNode]);

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

  // Handle canvas interactions with visual feedback
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
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
      
      // Visual feedback
      const canvas = canvasRef.current;
      canvas.style.transform = 'scale(0.98)';
      setTimeout(() => {
        canvas.style.transform = 'scale(1)';
      }, 100);
    }
  };

  const handleCanvasMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let foundNode = null;
    Object.entries(nodePositions).forEach(([versionId, pos]) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 12) {
        foundNode = versionId;
      }
    });
    
    setHoveredNode(foundNode);
    canvasRef.current.style.cursor = foundNode ? 'pointer' : 'default';
    
    // Add hover effect feedback
    if (foundNode !== hoveredNode) {
      // Trigger redraw when hover state changes
      setHoveredNode(foundNode);
    }
  };

  // Create new version (commit)
  const handleCommit = () => {
    if (!editingCode.trim() || !commitMessage.trim()) {
      return;
    }

    const newVersionId = generateVersionId();
    const newVersion = {
      id: newVersionId,
      content: editingCode,
      message: commitMessage,
      timestamp: new Date().toISOString(),
      author: 'user',
      parent: currentVersion,
      branch: selectedBranch
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

  const currentVersionData = repository.versions[currentVersion];

  return (
    <div className="bg-black rounded-xl overflow-hidden border border-gray-900 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Branch selector */}
            <div className="relative">
              <button 
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 rounded-md
                           text-gray-400 hover:text-gray-200 hover:bg-gray-800 
                           transition-colors text-sm border border-gray-800">
                <GitBranch size={14} />
                <span className="font-medium">{selectedBranch}</span>
                <ChevronDown size={14} className={`transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showBranchDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 rounded-md 
                                shadow-lg border border-gray-800 py-1 z-50">
                  {Object.keys(repository.branches).map((branchName) => (
                    <button
                      key={branchName}
                      onClick={() => {
                        setSelectedBranch(branchName);
                        setShowBranchDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-400
                                 hover:bg-gray-800 hover:text-gray-200 transition-colors
                                 flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: repository.branches[branchName].color.primary }}
                      />
                      {branchName}
                    </button>
                  ))}
                  <div className="border-t border-gray-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        const name = prompt('New branch name:');
                        if (name && !repository.branches[name]) {
                          handleCreateBranch(name);
                          setShowBranchDropdown(false);
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-blue-400
                                 hover:bg-gray-800 transition-colors"
                    >
                      + Create new branch
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Current version info */}
            {currentVersionData && (
              <div className="text-xs text-gray-500">
                <Code2 size={12} className="inline mr-1" />
                <span className="text-gray-400 font-mono">{currentVersion}</span>
                {' · '}
                <span>{currentVersionData.message}</span>
              </div>
            )}
          </div>
          
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            {mode === 'edit' ? (
              <>
                <button
                  onClick={() => setMode('view')}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommit}
                  disabled={!editingCode.trim() || !commitMessage.trim()}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm
                             hover:bg-blue-700 transition-colors flex items-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} />
                  Commit
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('edit')}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Edit Code
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metro Map Visualization */}
      <div className="relative bg-black h-80 overflow-hidden rounded-lg border border-gray-900">
        <canvas
          ref={canvasRef}
          className="w-full h-full transition-transform duration-100"
          style={{ imageRendering: 'auto' }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
        />
        
        
        {/* Enhanced version tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 
                          bg-gray-900 rounded-lg text-xs
                          border border-gray-800 shadow-lg
                          transform transition-all duration-200 ease-out">
            <div className="font-mono text-gray-500 text-[10px] uppercase tracking-wider mb-1">Version {hoveredNode}</div>
            <div className="text-gray-300 font-medium">{repository.versions[hoveredNode]?.message}</div>
            <div className="text-gray-500 mt-1">{new Date(repository.versions[hoveredNode]?.timestamp).toLocaleDateString()}</div>
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="border-t border-gray-900 rounded-b-xl overflow-hidden">
        {mode === 'edit' ? (
          <div className="p-4 space-y-3">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes..."
              className="w-full px-3 py-2 bg-gray-950 text-gray-300 text-sm
                         rounded-md border border-gray-800 focus:border-blue-600
                         focus:outline-none placeholder-gray-600"
            />
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-900 
                              border-r border-gray-800 rounded-l-md overflow-hidden">
                <div className="text-gray-500 text-xs font-mono leading-6 py-3 px-2 select-none">
                  {editingCode.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </div>
              <textarea
                value={editingCode}
                onChange={(e) => setEditingCode(e.target.value)}
                className="w-full h-64 pl-14 pr-3 py-3 bg-gray-950 text-gray-300 font-mono text-sm
                           rounded-md border border-gray-800 focus:border-blue-600
                           focus:outline-none resize-none leading-6"
                placeholder="Enter your code..."
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="relative" ref={codeContainerRef}>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-900 
                            border-r border-gray-800 rounded-bl-lg">
              <div className="text-gray-600 text-xs font-mono leading-6 py-3 px-2 select-none">
                {(currentVersionData?.content || '').split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            </div>
            <div className="pl-14 pr-4 py-3 bg-gray-950 max-h-64 overflow-y-auto">
              <pre className="text-gray-300 font-mono text-sm leading-6 whitespace-pre-wrap break-words">
                <code 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightCode(currentVersionData?.content || '// No code yet') 
                  }} 
                />
              </pre>
            </div>
            {currentVersionData && (
              <div className="px-4 py-2 bg-black border-t border-gray-800
                              flex items-center gap-6 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <User size={12} />
                  {currentVersionData.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  {new Date(currentVersionData.timestamp).toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <GitBranch size={12} />
                  {currentVersionData.branch || 'main'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}