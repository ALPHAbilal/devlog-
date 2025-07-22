import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Save, GitBranch, Clock, User } from 'lucide-react';

// Branch colors matching the screenshot
const BRANCH_COLORS = {
  main: '#F59E0B',      // Yellow
  feature: '#3B82F6',   // Blue  
  develop: '#8B5CF6',   // Purple
  hotfix: '#EC4899',    // Pink
  release: '#10B981',   // Green
};

// Generate a short ID for versions
const generateVersionId = () => {
  return 'v' + Date.now().toString(36);
};

// Calculate node positions for metro map
const calculateNodePositions = (repository) => {
  const positions = {};
  const branchYOffsets = { main: 100, feature: 180, develop: 260, hotfix: 340, release: 420 };
  let xOffset = 100;

  // Sort versions by timestamp
  const sortedVersions = Object.values(repository.versions).sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Calculate positions
  sortedVersions.forEach((version, index) => {
    const branch = version.branch || 'main';
    const y = branchYOffsets[branch] || 100;
    positions[version.id] = {
      x: xOffset + (index * 80),
      y: y,
      branch: branch
    };
  });

  return positions;
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

  // Draw metro map visualization
  const drawMetroMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections between versions
    Object.values(repository.versions).forEach(version => {
      if (version.parent) {
        const parentPos = nodePositions[version.parent];
        const childPos = nodePositions[version.id];
        
        if (parentPos && childPos) {
          const branch = repository.branches[version.branch] || repository.branches.main;
          ctx.strokeStyle = branch.color;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(parentPos.x, parentPos.y);
          
          // Smooth curve for branch connections
          if (parentPos.y !== childPos.y) {
            const midX = (parentPos.x + childPos.x) / 2;
            ctx.bezierCurveTo(
              midX, parentPos.y,
              midX, childPos.y,
              childPos.x, childPos.y
            );
          } else {
            ctx.lineTo(childPos.x, childPos.y);
          }
          
          ctx.stroke();
        }
      }
    });
    
    // Draw nodes
    Object.entries(repository.versions).forEach(([versionId, version]) => {
      const pos = nodePositions[versionId];
      if (!pos) return;
      
      const branch = repository.branches[version.branch] || repository.branches.main;
      const isCurrentVersion = versionId === currentVersion;
      const isHovered = hoveredNode === versionId;
      
      // Outer circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.strokeStyle = branch.color;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Inner circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = branch.color;
      ctx.fill();
      
      // Highlight current version
      if (isCurrentVersion) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        ctx.strokeStyle = branch.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    
    // Draw branch labels
    let yOffset = 40;
    Object.entries(repository.branches).forEach(([branchName, branch]) => {
      ctx.fillStyle = branch.color;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`origin/${branchName}`, 20, yOffset);
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

  // Handle canvas interactions
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find clicked node
    Object.entries(nodePositions).forEach(([versionId, pos]) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 12) {
        // Checkout this version
        setCurrentVersion(versionId);
        setRepository(prev => ({ ...prev, HEAD: versionId }));
      }
    });
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
  };

  // Create new version (commit)
  const handleCommit = () => {
    if (!editingCode.trim() || !commitMessage.trim()) {
      alert('Please provide both code and commit message');
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
    const colorOptions = Object.values(BRANCH_COLORS);
    const usedColors = Object.values(repository.branches).map(b => b.color);
    const availableColor = colorOptions.find(c => !usedColors.includes(c)) || colorOptions[0];

    setRepository(prev => ({
      ...prev,
      branches: {
        ...prev.branches,
        [branchName]: {
          name: branchName,
          head: currentVersion,
          color: availableColor
        }
      }
    }));

    setSelectedBranch(branchName);
  };

  const currentVersionData = repository.versions[currentVersion];

  return (
    <div className="bg-black rounded-xl overflow-hidden border border-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Branch selector */}
            <div className="relative">
              <button 
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-950 rounded-lg
                           text-gray-300 hover:text-gray-100 hover:bg-gray-900 
                           transition-all text-sm border border-gray-800">
                <GitBranch size={14} />
                <span className="font-medium">{selectedBranch}</span>
                <ChevronDown size={14} className={`transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showBranchDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 rounded-md 
                                shadow-xl border border-gray-800 py-1 z-50">
                  {Object.keys(repository.branches).map((branchName) => (
                    <button
                      key={branchName}
                      onClick={() => {
                        setSelectedBranch(branchName);
                        setShowBranchDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-400
                                 hover:bg-gray-800 hover:text-gray-200 transition-colors"
                    >
                      {branchName}
                    </button>
                  ))}
                  <div className="border-t border-gray-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        const name = prompt('New branch name:');
                        if (name) {
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
                <span className="text-gray-400">{currentVersion}</span>
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
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-md text-sm
                             hover:bg-gray-700 transition-colors flex items-center gap-2"
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
      <div className="relative bg-black h-64">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
        />
        
        {/* Version tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 
                          bg-gray-900/90 rounded text-xs text-gray-400">
            {repository.versions[hoveredNode]?.message || hoveredNode}
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="p-4 border-t border-gray-900">
        {mode === 'edit' ? (
          <>
            <div className="mb-3">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                className="w-full px-3 py-2 bg-gray-950 text-gray-300 text-sm
                           rounded-md border border-gray-800 focus:border-gray-700
                           focus:outline-none"
              />
            </div>
            <textarea
              value={editingCode}
              onChange={(e) => setEditingCode(e.target.value)}
              className="w-full h-48 p-3 bg-gray-950 text-gray-300 font-mono text-sm
                         rounded-md border border-gray-800 focus:border-gray-700
                         focus:outline-none resize-none"
              placeholder="Enter your code..."
            />
          </>
        ) : (
          <div className="relative">
            <pre className="p-3 bg-gray-950 text-gray-300 font-mono text-sm rounded-md
                            border border-gray-800 overflow-x-auto">
              <code>{currentVersionData?.content || '// No code yet'}</code>
            </pre>
            {currentVersionData && (
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {currentVersionData.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(currentVersionData.timestamp).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}