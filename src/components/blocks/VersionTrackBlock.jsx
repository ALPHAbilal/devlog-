import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  GitBranch, ChevronLeft, ChevronRight, X, GitCommit, 
  Edit3, Eye, Save, Plus, Search, ZoomIn, ZoomOut,
  Filter, Sparkles, Clock, User, FileText, AlertCircle
} from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

// LCH-based color system for world-class dark theme
const COLORS = {
  // Base colors
  base: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#2A2A2A',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Metro lines with semantic meaning
  lines: {
    main: '#22C55E', // Emerald green
    feature: '#3B82F6', // Blue  
    experimental: '#FB923C', // Orange
    hotfix: '#EF4444', // Red
    merge: '#A855F7', // Purple
  },
  
  // Station states
  stations: {
    default: 'rgba(255, 255, 255, 0.87)',
    hover: 'rgba(255, 255, 255, 1)',
    selected: '#3B82F6',
    current: '#22C55E',
    conflict: '#EF4444',
  },
  
  // Text
  text: {
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.6)',
    tertiary: 'rgba(255, 255, 255, 0.38)',
  }
};

// Spring physics for animations
const SPRING = {
  tension: 170,
  friction: 26,
  duration: 600,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

// Demo content remains the same
const DEMO_CONTENT = {
  v1: `function authenticate(username, password) {
  // Basic authentication
  if (username === 'admin' && password === 'password') {
    return { success: true, token: 'basic-token' };
  }
  return { success: false };
}`,
  v2: `import bcrypt from 'bcrypt';

async function authenticate(username, password) {
  // Enhanced with password hashing
  const user = await db.users.findOne({ username });
  if (!user) return { success: false };
  
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (valid) {
    return { success: true, token: generateToken(user) };
  }
  return { success: false };
}`,
  v3: `import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

async function authenticate(username, password, method = 'basic') {
  // Multi-method authentication
  if (method === 'oauth') {
    return authenticateOAuth(username);
  }
  
  // Basic auth with hashing
  const user = await db.users.findOne({ username });
  if (!user) return { success: false };
  
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (valid) {
    // Add 2FA check
    if (user.twoFactorEnabled) {
      return { success: true, requiresTwoFactor: true };
    }
    return { success: true, token: generateToken(user) };
  }
  return { success: false };
}`
};

export default function VersionTrackBlock({ block, onUpdate, onDelete }) {
  // State management
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [hoveredVersion, setHoveredVersion] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState([]);
  const [editingVersion, setEditingVersion] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, author, branch, date
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  
  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  
  // Initialize with demo data
  useEffect(() => {
    if (!block.versions || block.versions.length === 0) {
      const demoVersions = [
        {
          id: 'v1',
          label: 'Basic Auth',
          content: DEMO_CONTENT.v1,
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          author: 'Alex Chen',
          message: 'Initial authentication implementation',
          branch: 'main',
          parents: [],
          stats: { additions: 8, deletions: 0, files: 1 }
        },
        {
          id: 'v2', 
          label: 'Add Hashing',
          content: DEMO_CONTENT.v2,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          author: 'Sarah Kim',
          message: 'Enhanced security with bcrypt password hashing',
          branch: 'main',
          parents: ['v1'],
          stats: { additions: 15, deletions: 3, files: 1 }
        },
        {
          id: 'v3',
          label: 'OAuth + 2FA',
          content: DEMO_CONTENT.v3,
          timestamp: new Date(),
          author: 'You',
          message: 'Added OAuth support and two-factor authentication',
          branch: 'main',
          parents: ['v2'],
          stats: { additions: 22, deletions: 5, files: 2 }
        }
      ];
      
      onUpdate(block.id, { 
        ...block, 
        versions: demoVersions,
        currentVersion: 'v3',
        title: block.title || 'Authentication System'
      });
    }
  }, [block, onUpdate]);

  // Calculate layout for metro map
  const calculateLayout = useMemo(() => {
    const versions = block.versions || [];
    if (versions.length === 0) return { positions: {}, connections: [] };

    const positions = {};
    const connections = [];
    const branchYOffsets = { main: 0 };
    let maxY = 0;

    // Calculate positions
    versions.forEach((version, index) => {
      const x = 200 + index * 250;
      const branchOffset = branchYOffsets[version.branch] || 0;
      const y = 200 + branchOffset;
      
      positions[version.id] = { x, y, version };
      
      // Calculate connections
      version.parents.forEach(parentId => {
        const parent = positions[parentId];
        if (parent) {
          connections.push({
            from: parent,
            to: positions[version.id],
            branch: version.branch
          });
        }
      });
    });

    return { positions, connections };
  }, [block.versions]);

  // Render metro map with Canvas for performance
  const renderMetroMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr * zoomLevel, dpr * zoomLevel);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply pan offset
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    
    const { positions, connections } = calculateLayout;
    
    // Draw connections with bezier curves
    connections.forEach(({ from, to, branch }) => {
      const color = COLORS.lines[branch] || COLORS.lines.main;
      
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      
      // Calculate control points for smooth curves
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const cx1 = from.x + dx * 0.5;
      const cy1 = from.y;
      const cx2 = to.x - dx * 0.5;
      const cy2 = to.y;
      
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, to.x, to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
    
    // Draw stations
    Object.entries(positions).forEach(([id, pos]) => {
      const version = pos.version;
      const isHovered = hoveredVersion === id;
      const isSelected = selectedVersion?.id === id;
      const isCurrent = block.currentVersion === id;
      
      // Station size based on state
      const baseRadius = 24;
      const radius = isHovered ? baseRadius * 1.1 : baseRadius;
      
      // Glow effect for hover/selected
      if (isHovered || isSelected || isCurrent) {
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 2);
        gradient.addColorStop(0, `${COLORS.stations[isCurrent ? 'current' : isSelected ? 'selected' : 'hover']}33`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Main station circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? COLORS.stations.current : COLORS.surface;
      ctx.fill();
      ctx.strokeStyle = COLORS.stations[isSelected ? 'selected' : 'default'];
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Station label
      ctx.fillStyle = COLORS.text.primary;
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(version.label, pos.x, pos.y - radius - 10);
      
      // Author and time
      ctx.fillStyle = COLORS.text.secondary;
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(version.author, pos.x, pos.y + radius + 20);
      ctx.fillText(formatTimestamp(version.timestamp), pos.x, pos.y + radius + 35);
    });
    
    ctx.restore();
  }, [calculateLayout, hoveredVersion, selectedVersion, block.currentVersion, zoomLevel, panOffset]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      renderMetroMap();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [renderMetroMap]);

  // Handle canvas interactions
  const handleCanvasMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;
    
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }
    
    // Check hover over stations
    const { positions } = calculateLayout;
    let foundHover = null;
    
    Object.entries(positions).forEach(([id, pos]) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 30) {
        foundHover = id;
      }
    });
    
    setHoveredVersion(foundHover);
    canvasRef.current.style.cursor = foundHover ? 'pointer' : isDragging ? 'grabbing' : 'grab';
  };

  const handleCanvasClick = (e) => {
    if (isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;
    
    const { positions } = calculateLayout;
    
    Object.entries(positions).forEach(([id, pos]) => {
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 30) {
        if (compareMode) {
          handleCompareSelect(pos.version);
        } else {
          setSelectedVersion(pos.version);
          setShowRightPanel(true);
        }
      }
    });
  };

  const handleCompareSelect = (version) => {
    if (compareVersions.find(v => v.id === version.id)) {
      setCompareVersions(compareVersions.filter(v => v.id !== version.id));
    } else if (compareVersions.length < 2) {
      setCompareVersions([...compareVersions, version]);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const saveNewVersion = () => {
    const newVersion = {
      id: `v${(block.versions?.length || 0) + 1}`,
      label: `Version ${(block.versions?.length || 0) + 1}`,
      content: editingContent,
      timestamp: new Date(),
      author: 'You',
      message: 'Updated version',
      branch: editingVersion.branch || 'main',
      parents: [editingVersion.id],
      stats: { additions: 10, deletions: 5, files: 1 }
    };

    onUpdate(block.id, {
      ...block,
      versions: [...(block.versions || []), newVersion],
      currentVersion: newVersion.id
    });

    setEditingVersion(null);
    setEditingContent('');
    setSelectedVersion(newVersion);
  };

  // Main render with three-panel layout
  return (
    <div className="relative bg-base rounded-xl overflow-hidden border border-glass">
      {/* Header Bar */}
      <div className="h-14 bg-surface border-b border-glass flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-glass rounded-lg">
            <GitBranch size={20} className="text-primary" style={{ color: COLORS.lines.main }} />
          </div>
          <div>
            <h3 className="text-primary font-medium flex items-center gap-2">
              {block.title || 'Version Track'}
              <span className="text-xs text-secondary bg-glass px-2 py-0.5 rounded-full">
                {block.versions?.length || 0} versions
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search versions..."
              className="w-48 h-8 pl-8 pr-3 bg-glass border border-glass rounded-lg
                         text-primary placeholder-secondary text-sm
                         focus:outline-none focus:ring-1 focus:ring-primary/50"
              style={{
                background: COLORS.glass,
                borderColor: COLORS.glassBorder,
                color: COLORS.text.primary
              }}
            />
            <Search size={14} className="absolute left-2.5 top-2 text-secondary" />
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-1 bg-glass rounded-lg p-1">
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className={`p-1.5 rounded transition-colors ${
                showLeftPanel ? 'bg-surface text-primary' : 'text-secondary hover:text-primary'
              }`}
              title="Toggle left panel"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="w-px h-4 bg-glass" />
            <button
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
              className="p-1.5 text-secondary hover:text-primary transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-secondary px-1">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
              className="p-1.5 text-secondary hover:text-primary transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-4 bg-glass" />
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`p-1.5 rounded transition-colors ${
                showRightPanel ? 'bg-surface text-primary' : 'text-secondary hover:text-primary'
              }`}
              title="Toggle right panel"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Compare Mode Toggle */}
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareVersions([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              compareMode 
                ? 'bg-selected text-white' 
                : 'bg-glass text-secondary hover:text-primary'
            }`}
            style={{
              background: compareMode ? COLORS.stations.selected : COLORS.glass,
              color: compareMode ? 'white' : COLORS.text.secondary
            }}
          >
            Compare
          </button>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="flex h-[600px]">
        {/* Left Panel - Context/Filters */}
        {showLeftPanel && (
          <div className="w-64 bg-surface border-r border-glass p-4 overflow-y-auto"
               style={{ background: COLORS.surface, borderColor: COLORS.glassBorder }}>
            <h4 className="text-sm font-medium text-primary mb-4">Filters</h4>
            
            {/* Branch Filter */}
            <div className="mb-4">
              <label className="text-xs text-secondary mb-2 block">Branch</label>
              <select className="w-full h-8 px-2 bg-glass border border-glass rounded text-sm text-primary">
                <option value="all">All branches</option>
                <option value="main">main</option>
                <option value="feature">feature</option>
              </select>
            </div>

            {/* Author Filter */}
            <div className="mb-4">
              <label className="text-xs text-secondary mb-2 block">Author</label>
              <select className="w-full h-8 px-2 bg-glass border border-glass rounded text-sm text-primary">
                <option value="all">All authors</option>
                <option value="you">You</option>
                <option value="alex">Alex Chen</option>
                <option value="sarah">Sarah Kim</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="mb-4">
              <label className="text-xs text-secondary mb-2 block">Date Range</label>
              <select className="w-full h-8 px-2 bg-glass border border-glass rounded text-sm text-primary">
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </div>

            {/* Version List */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-primary mb-3">Versions</h4>
              <div className="space-y-2">
                {(block.versions || []).map(version => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full text-left p-2 rounded-lg transition-all ${
                      selectedVersion?.id === version.id
                        ? 'bg-selected/20 border border-selected'
                        : 'bg-glass hover:bg-glass/80'
                    }`}
                    style={{
                      background: selectedVersion?.id === version.id 
                        ? `${COLORS.stations.selected}20`
                        : COLORS.glass,
                      borderColor: selectedVersion?.id === version.id
                        ? COLORS.stations.selected
                        : 'transparent'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary">{version.label}</span>
                      {version.id === block.currentVersion && (
                        <span className="text-xs px-1.5 py-0.5 bg-current/20 text-current rounded">
                          current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-secondary mt-0.5">
                      {version.author} • {formatTimestamp(version.timestamp)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Center Panel - Metro Map */}
        <div className="flex-1 relative bg-base">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onClick={handleCanvasClick}
            style={{ background: COLORS.base }}
          />

          {/* Minimap */}
          <div className="absolute bottom-4 left-4 w-48 h-32 bg-surface/90 backdrop-blur 
                          border border-glass rounded-lg p-2">
            <div className="text-xs text-secondary mb-1">Overview</div>
            {/* Minimap implementation would go here */}
          </div>
        </div>

        {/* Right Panel - Details */}
        {showRightPanel && selectedVersion && (
          <div className="w-96 bg-surface border-l border-glass overflow-y-auto"
               style={{ background: COLORS.surface, borderColor: COLORS.glassBorder }}>
            {/* Version Header */}
            <div className="p-4 border-b border-glass">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                  <GitCommit size={20} />
                  {selectedVersion.label}
                </h3>
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="p-1 hover:bg-glass rounded transition-colors"
                >
                  <X size={18} className="text-secondary" />
                </button>
              </div>
              
              <p className="text-sm text-secondary mb-3">{selectedVersion.message}</p>
              
              <div className="flex items-center gap-4 text-xs text-secondary">
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {selectedVersion.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatTimestamp(selectedVersion.timestamp)}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs text-green-400">
                  +{selectedVersion.stats?.additions || 0}
                </span>
                <span className="text-xs text-red-400">
                  -{selectedVersion.stats?.deletions || 0}
                </span>
                <span className="text-xs text-secondary">
                  {selectedVersion.stats?.files || 0} files
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-b border-glass">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingVersion(selectedVersion);
                    setEditingContent(selectedVersion.content);
                  }}
                  className="flex-1 px-3 py-2 bg-primary text-white rounded-lg
                             hover:bg-primary/80 transition-colors text-sm font-medium"
                  style={{ background: COLORS.stations.selected }}
                >
                  <Edit3 size={14} className="inline mr-1.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onUpdate(block.id, { ...block, currentVersion: selectedVersion.id });
                  }}
                  className="flex-1 px-3 py-2 bg-glass text-primary rounded-lg
                             hover:bg-glass/80 transition-colors text-sm font-medium"
                >
                  Set Current
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                <FileText size={14} />
                Code
              </h4>
              
              <div className="bg-base rounded-lg overflow-hidden border border-glass">
                <Highlight
                  theme={themes.nightOwl}
                  code={selectedVersion.content}
                  language="javascript"
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={`${className} p-4 text-sm overflow-x-auto`} 
                         style={{ ...style, background: COLORS.base }}>
                      <code>
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            <span className="text-secondary select-none pr-4 text-xs">
                              {i + 1}
                            </span>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </code>
                    </pre>
                  )}
                </Highlight>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingVersion && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-glass flex items-center justify-between">
              <h3 className="text-lg font-medium text-primary">
                Editing: {editingVersion.label}
              </h3>
              <button
                onClick={() => {
                  setEditingVersion(null);
                  setEditingContent('');
                }}
                className="p-1 hover:bg-glass rounded transition-colors"
              >
                <X size={20} className="text-secondary" />
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-96 p-4 bg-base rounded-lg text-primary font-mono text-sm
                           border border-glass focus:outline-none focus:ring-1 focus:ring-primary/50"
                style={{
                  background: COLORS.base,
                  borderColor: COLORS.glassBorder,
                  color: COLORS.text.primary
                }}
                spellCheck={false}
              />
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setEditingVersion(null);
                    setEditingContent('');
                  }}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNewVersion}
                  className="px-4 py-2 bg-primary text-white rounded-lg
                             hover:bg-primary/80 transition-colors font-medium"
                  style={{ background: COLORS.stations.selected }}
                >
                  <Save size={16} className="inline mr-2" />
                  Save as New Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare View */}
      {compareMode && compareVersions.length === 2 && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-glass flex items-center justify-between">
              <h3 className="text-lg font-medium text-primary">
                Comparing: {compareVersions[0].label} ↔ {compareVersions[1].label}
              </h3>
              <button
                onClick={() => {
                  setCompareMode(false);
                  setCompareVersions([]);
                }}
                className="p-1 hover:bg-glass rounded transition-colors"
              >
                <X size={20} className="text-secondary" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 h-[calc(100%-5rem)]">
              {compareVersions.map((version, index) => (
                <div key={version.id} className={`p-4 ${index === 0 ? 'border-r border-glass' : ''}`}>
                  <h4 className="text-sm font-medium text-primary mb-3">{version.label}</h4>
                  <div className="bg-base rounded-lg p-3 h-[calc(100%-2rem)] overflow-auto">
                    <pre className="text-xs text-secondary font-mono">
                      <code>{version.content}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}