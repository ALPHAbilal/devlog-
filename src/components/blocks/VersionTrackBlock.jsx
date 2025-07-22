import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

// Simple color palette for branches
const BRANCH_COLORS = {
  master: '#F59E0B', // Yellow/amber
  'json-payload': '#3B82F6', // Blue
  'rouge_1': '#8B5CF6', // Purple
  'pull-mark': '#EC4899', // Pink
  '2.4-patch': '#10B981', // Green
};

// Demo data structure matching the screenshot
const DEMO_BRANCHES = {
  master: {
    name: 'origin/3.5-stable',
    color: BRANCH_COLORS.master,
    nodes: [
      { id: 'm1', x: 280, y: 60 },
      { id: 'm2', x: 340, y: 60 },
      { id: 'm3', x: 400, y: 60 }
    ]
  },
  'json-payload': {
    name: 'origin/json-payload',
    color: BRANCH_COLORS['json-payload'],
    nodes: [
      { id: 'j1', x: 180, y: 100, parent: 'm1' },
      { id: 'j2', x: 240, y: 100 },
      { id: 'j3', x: 280, y: 100, merge: 'm1' }
    ]
  },
  'rouge_1': {
    name: 'origin/rouge_1',
    color: BRANCH_COLORS['rouge_1'],
    nodes: [
      { id: 'r1', x: 140, y: 140, parent: 'j1' },
      { id: 'r2', x: 220, y: 140 },
      { id: 'r3', x: 320, y: 140 }
    ]
  },
  'pull-mark': {
    name: 'origin/pull/mark',
    color: BRANCH_COLORS['pull-mark'],
    nodes: [
      { id: 'p1', x: 240, y: 180 },
      { id: 'p2', x: 360, y: 180 },
      { id: 'p3', x: 440, y: 180 }
    ]
  },
  '2.4-patch': {
    name: 'origin/2.4-patch',
    color: BRANCH_COLORS['2.4-patch'],
    nodes: [
      { id: 't1', x: 300, y: 220 },
      { id: 't2', x: 360, y: 220 }
    ]
  }
};

export default function VersionTrackBlock({ block, onUpdate }) {
  const [mode, setMode] = useState('view'); // 'view' or 'edit'
  const [selectedBranch, setSelectedBranch] = useState('master');
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [branches] = useState(DEMO_BRANCHES);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize block data
  useEffect(() => {
    if (!block.branches) {
      onUpdate(block.id, {
        ...block,
        branches: DEMO_BRANCHES,
        currentBranch: 'master'
      });
    }
  }, [block, onUpdate]);

  // Draw the metro map
  const drawMetroMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas with pure black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections between nodes
    Object.values(branches).forEach(branch => {
      ctx.strokeStyle = branch.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw lines between consecutive nodes
      for (let i = 0; i < branch.nodes.length - 1; i++) {
        const node1 = branch.nodes[i];
        const node2 = branch.nodes[i + 1];
        
        ctx.beginPath();
        ctx.moveTo(node1.x, node1.y);
        ctx.lineTo(node2.x, node2.y);
        ctx.stroke();
      }
      
      // Draw parent connections
      branch.nodes.forEach(node => {
        if (node.parent) {
          // Find parent node
          Object.values(branches).forEach(b => {
            const parentNode = b.nodes.find(n => n.id === node.parent);
            if (parentNode) {
              ctx.beginPath();
              ctx.moveTo(parentNode.x, parentNode.y);
              ctx.lineTo(node.x, node.y);
              ctx.stroke();
            }
          });
        }
        
        if (node.merge) {
          // Find merge target
          Object.values(branches).forEach(b => {
            const mergeNode = b.nodes.find(n => n.id === node.merge);
            if (mergeNode) {
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(mergeNode.x, mergeNode.y);
              ctx.stroke();
            }
          });
        }
      });
    });
    
    // Draw nodes
    Object.values(branches).forEach(branch => {
      branch.nodes.forEach(node => {
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode?.id === node.id;
        
        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.strokeStyle = branch.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Inner circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = branch.color;
        ctx.fill();
      });
    });
    
    // Draw branch labels on the left side
    let yOffset = 40;
    Object.entries(branches).forEach(([key, branch]) => {
      ctx.fillStyle = branch.color;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(branch.name, 20, yOffset);
      yOffset += 25;
    });
  }, [branches, hoveredNode, selectedNode]);

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

  // Handle canvas click
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is on a node
    let clickedNode = null;
    let clickedBranch = null;
    
    Object.entries(branches).forEach(([branchKey, branch]) => {
      branch.nodes.forEach(node => {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (distance < 12) {
          clickedNode = node;
          clickedBranch = branchKey;
        }
      });
    });
    
    if (clickedNode) {
      setSelectedNode(clickedNode);
      setSelectedBranch(clickedBranch);
      if (mode === 'view') {
        // In view mode, clicking a node switches to edit mode
        setMode('edit');
        setEditingContent(`Version ${clickedNode.id} content`);
      }
    }
  };

  // Handle canvas hover
  const handleCanvasMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let foundNode = null;
    Object.values(branches).forEach(branch => {
      branch.nodes.forEach(node => {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (distance < 12) {
          foundNode = node.id;
        }
      });
    });
    
    setHoveredNode(foundNode);
    canvasRef.current.style.cursor = foundNode ? 'pointer' : 'default';
  };

  // Save new version
  const handleSave = () => {
    // In a real implementation, this would create a new node
    console.log('Saving new version:', editingContent);
    setMode('view');
    setSelectedNode(null);
    setEditingContent('');
  };

  return (
    <div className="bg-black rounded-xl overflow-hidden border border-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-900">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button 
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-950 rounded-lg
                         text-gray-300 hover:text-gray-100 hover:bg-gray-900 
                         transition-all text-sm border border-gray-800">
              <span className="font-medium">{selectedBranch}</span>
              <ChevronDown size={14} className={`transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showBranchDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 rounded-md 
                              shadow-xl border border-gray-800 py-1 z-50">
                {Object.keys(branches).map((branchKey) => (
                  <button
                    key={branchKey}
                    onClick={() => {
                      setSelectedBranch(branchKey);
                      setShowBranchDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-400
                               hover:bg-gray-800 hover:text-gray-200 transition-colors"
                  >
                    {branchKey}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMode('view');
                  setSelectedNode(null);
                  setEditingContent('');
                }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-md text-sm
                           hover:bg-gray-700 transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metro Map */}
      <div className={`relative bg-black ${mode === 'edit' ? 'h-64' : 'h-80'}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
        />
        
        {/* Simple node label */}
        {hoveredNode && mode === 'view' && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 
                          bg-gray-900/90 rounded text-xs text-gray-400">
            {hoveredNode}
          </div>
        )}
        
        {/* Master label button */}
        <div className="absolute bottom-4 left-4">
          <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded-md text-xs font-medium
                             hover:bg-red-500/30 transition-colors">
            master
          </button>
        </div>
      </div>

      {/* Edit Mode */}
      {mode === 'edit' && selectedNode && (
        <div className="p-4 border-t border-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Version: <span className="text-gray-400 font-mono">{selectedNode.id}</span>
            </span>
            <span className="text-xs text-gray-500">
              Branch: <span className="text-gray-400">{selectedBranch}</span>
            </span>
          </div>
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="w-full h-32 p-3 bg-gray-950 text-gray-300 font-mono text-sm
                       rounded-md border border-gray-800 focus:border-gray-700
                       focus:outline-none resize-none"
            placeholder="Version content..."
          />
        </div>
      )}
    </div>
  );
}