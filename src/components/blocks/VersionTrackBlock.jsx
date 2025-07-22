import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Save, GitBranch, Clock, User, Code2, GitMerge, ZoomIn, ZoomOut } from 'lucide-react';

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

// Smart node positioning algorithm
const calculateNodePositions = (repository) => {
  const positions = {};
  const branchLanes = {};
  const LANE_WIDTH = 100;
  const NODE_SPACING = 80;
  const START_X = 120;
  const START_Y = 80;
  
  // First, organize versions by branch and time
  const branchVersions = {};
  Object.values(repository.versions).forEach(version => {
    const branch = version.branch || 'main';
    if (!branchVersions[branch]) {
      branchVersions[branch] = [];
    }
    branchVersions[branch].push(version);
  });

  // Sort versions within each branch by timestamp
  Object.keys(branchVersions).forEach(branch => {
    branchVersions[branch].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  // Assign lanes to branches
  let laneIndex = 0;
  Object.keys(branchVersions).forEach(branch => {
    branchLanes[branch] = laneIndex++;
  });

  // Position nodes
  const globalTimeline = Object.values(repository.versions)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  globalTimeline.forEach((version, index) => {
    const branch = version.branch || 'main';
    const lane = branchLanes[branch];
    
    positions[version.id] = {
      x: START_X + (index * NODE_SPACING),
      y: START_Y + (lane * LANE_WIDTH),
      branch: branch,
      lane: lane
    };
  });

  return positions;
};

// Syntax highlighting for code
const highlightCode = (code, language = 'javascript') => {
  // Simple syntax highlighting for JavaScript
  const keywords = /\b(function|const|let|var|if|else|return|for|while|class|import|export|from|new|async|await)\b/g;
  const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm;
  const numbers = /\b\d+\b/g;
  const functions = /\b(\w+)(?=\()/g;

  let highlighted = code
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Apply highlighting in order
  highlighted = highlighted
    .replace(comments, '<span class="text-gray-500">$&</span>')
    .replace(strings, '<span class="text-green-400">$&</span>')
    .replace(keywords, '<span class="text-purple-400">$&</span>')
    .replace(functions, '<span class="text-blue-400">$1</span>')
    .replace(numbers, '<span class="text-orange-400">$&</span>');

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw grid pattern (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < rect.width * 2; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height * 2);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height * 2; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width * 2, y);
      ctx.stroke();
    }
    
    // Draw connections with gradients
    Object.values(repository.versions).forEach(version => {
      if (version.parent) {
        const parentPos = nodePositions[version.parent];
        const childPos = nodePositions[version.id];
        
        if (parentPos && childPos) {
          const branch = repository.branches[version.branch] || repository.branches.main;
          const gradient = ctx.createLinearGradient(
            parentPos.x, parentPos.y,
            childPos.x, childPos.y
          );
          gradient.addColorStop(0, branch.color.primary);
          gradient.addColorStop(1, branch.color.secondary);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = 0.8;
          
          ctx.beginPath();
          ctx.moveTo(parentPos.x, parentPos.y);
          
          // Smooth bezier curves for branch connections
          if (parentPos.y !== childPos.y) {
            const controlPoint1X = parentPos.x + (childPos.x - parentPos.x) * 0.5;
            const controlPoint1Y = parentPos.y;
            const controlPoint2X = parentPos.x + (childPos.x - parentPos.x) * 0.5;
            const controlPoint2Y = childPos.y;
            
            ctx.bezierCurveTo(
              controlPoint1X, controlPoint1Y,
              controlPoint2X, controlPoint2Y,
              childPos.x, childPos.y
            );
          } else {
            ctx.lineTo(childPos.x, childPos.y);
          }
          
          ctx.stroke();
          ctx.globalAlpha = 1;
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
      
      // Node shadow/glow
      if (isCurrentVersion || isHovered) {
        const glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 20);
        glowGradient.addColorStop(0, `${branch.color.primary}40`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(pos.x - 20, pos.y - 20, 40, 40);
      }
      
      // Outer ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isHovered ? 12 : 10, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      
      const ringGradient = ctx.createLinearGradient(
        pos.x - 10, pos.y - 10,
        pos.x + 10, pos.y + 10
      );
      ringGradient.addColorStop(0, branch.color.primary);
      ringGradient.addColorStop(1, branch.color.secondary);
      ctx.strokeStyle = ringGradient;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Inner circle with gradient
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      const innerGradient = ctx.createRadialGradient(
        pos.x - 2, pos.y - 2, 0,
        pos.x, pos.y, 5
      );
      innerGradient.addColorStop(0, branch.color.primary);
      innerGradient.addColorStop(1, branch.color.secondary);
      ctx.fillStyle = innerGradient;
      ctx.fill();
      
      // Special icon for merge commits
      if (isMergeCommit) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', pos.x, pos.y);
      }
      
      // Animated selection ring
      if (isCurrentVersion) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 16 + Math.sin(Date.now() * 0.003) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = branch.color.primary;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = Date.now() * 0.01;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    
    ctx.restore();
    
    // Draw branch labels with better styling
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 20, 160, Object.keys(repository.branches).length * 28 + 20);
    
    let yOffset = 40;
    Object.entries(repository.branches).forEach(([branchName, branch]) => {
      // Branch color indicator
      const gradient = ctx.createLinearGradient(20, yOffset - 8, 36, yOffset - 8);
      gradient.addColorStop(0, branch.color.primary);
      gradient.addColorStop(1, branch.color.secondary);
      ctx.fillStyle = gradient;
      ctx.fillRect(20, yOffset - 12, 16, 16);
      
      // Branch name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(branchName, 44, yOffset - 4);
      
      yOffset += 28;
    });
  }, [repository, nodePositions, currentVersion, hoveredNode, zoom, pan]);

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

  // Handle canvas interactions
  const handleCanvasClick = (e) => {
    if (isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    // Find clicked node
    Object.entries(nodePositions).forEach(([versionId, pos]) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 12) {
        // Checkout this version with animation
        setCurrentVersion(versionId);
        setRepository(prev => ({ ...prev, HEAD: versionId }));
        
        // Auto-center on selected node
        const targetPan = {
          x: rect.width / 2 - pos.x * zoom,
          y: rect.height / 2 - pos.y * zoom
        };
        setPan(targetPan);
      }
    });
  };

  const handleCanvasMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
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

  const handleCanvasMouseDown = (e) => {
    if (!hoveredNode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
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
    <div className="bg-black rounded-xl overflow-hidden border border-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-900 bg-gradient-to-r from-gray-950 to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Branch selector */}
            <div className="relative">
              <button 
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg
                           text-gray-300 hover:text-gray-100 hover:bg-black/70 
                           transition-all text-sm border border-gray-800/50">
                <GitBranch size={14} />
                <span className="font-medium">{selectedBranch}</span>
                <ChevronDown size={14} className={`transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showBranchDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-950/95 backdrop-blur-md rounded-md 
                                shadow-xl border border-gray-800 py-1 z-50">
                  {Object.keys(repository.branches).map((branchName) => (
                    <button
                      key={branchName}
                      onClick={() => {
                        setSelectedBranch(branchName);
                        setShowBranchDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-400
                                 hover:bg-gray-800/50 hover:text-gray-200 transition-colors
                                 flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          background: `linear-gradient(135deg, ${repository.branches[branchName].color.primary}, ${repository.branches[branchName].color.secondary})` 
                        }}
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
                                 hover:bg-gray-800/50 transition-colors"
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
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md text-sm
                             hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} />
                  Commit
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode('edit')}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 
                           bg-gray-900/50 hover:bg-gray-800/50 rounded-md transition-all"
              >
                Edit Code
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metro Map Visualization */}
      <div className="relative bg-black h-80 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => {
            setHoveredNode(null);
            setIsDragging(false);
          }}
        />
        
        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 bg-gray-900/80 backdrop-blur-sm rounded-md text-gray-400
                       hover:text-gray-200 hover:bg-gray-800/80 transition-all"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 bg-gray-900/80 backdrop-blur-sm rounded-md text-gray-400
                       hover:text-gray-200 hover:bg-gray-800/80 transition-all"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="p-2 bg-gray-900/80 backdrop-blur-sm rounded-md text-gray-400
                       hover:text-gray-200 hover:bg-gray-800/80 transition-all text-xs"
          >
            Reset
          </button>
        </div>
        
        {/* Version tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 
                          bg-gray-900/95 backdrop-blur-sm rounded-md text-xs text-gray-300
                          border border-gray-800/50 shadow-lg">
            <div className="font-mono text-gray-400 mb-0.5">{hoveredNode}</div>
            <div>{repository.versions[hoveredNode]?.message}</div>
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="border-t border-gray-900">
        {mode === 'edit' ? (
          <div className="p-4 space-y-3">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes..."
              className="w-full px-3 py-2 bg-gray-950/50 text-gray-300 text-sm
                         rounded-md border border-gray-800 focus:border-blue-600/50
                         focus:outline-none focus:ring-1 focus:ring-blue-600/20
                         placeholder-gray-600"
            />
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-950/50 
                              border-r border-gray-800 rounded-l-md overflow-hidden">
                <div className="text-gray-600 text-xs font-mono leading-6 py-3 px-2 select-none">
                  {editingCode.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </div>
              <textarea
                value={editingCode}
                onChange={(e) => setEditingCode(e.target.value)}
                className="w-full h-64 pl-14 pr-3 py-3 bg-gray-950/50 text-gray-300 font-mono text-sm
                           rounded-md border border-gray-800 focus:border-blue-600/50
                           focus:outline-none focus:ring-1 focus:ring-blue-600/20
                           resize-none leading-6"
                placeholder="Enter your code..."
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="relative" ref={codeContainerRef}>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-950/30 
                            border-r border-gray-800/50">
              <div className="text-gray-600 text-xs font-mono leading-6 py-3 px-2 select-none">
                {(currentVersionData?.content || '').split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            </div>
            <div className="pl-14 pr-4 py-3 bg-gray-950/30 max-h-64 overflow-y-auto">
              <pre className="text-gray-300 font-mono text-sm leading-6">
                <code 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightCode(currentVersionData?.content || '// No code yet') 
                  }} 
                />
              </pre>
            </div>
            {currentVersionData && (
              <div className="px-4 py-2 bg-gray-950/50 border-t border-gray-800/50
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