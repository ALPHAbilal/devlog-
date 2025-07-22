import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  GitBranch, Clock, ChevronDown, ChevronRight, X, GitCommit, 
  Edit3, Eye, Save, Code2, FileText, Plus, Search, Download,
  ChevronLeft, Sparkles
} from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

// Beautiful color palette
const COLORS = {
  tracks: {
    main: 'rgb(34, 197, 94)', // Emerald green
    branch: 'rgb(59, 130, 246)', // Blue
    experimental: 'rgb(251, 146, 60)', // Orange
    merge: 'rgb(168, 85, 247)', // Purple
  },
  stations: {
    current: '#3b82f6',
    stable: '#10b981',
    experimental: '#f97316',
    deprecated: '#6b7280',
    draft: '#8b5cf6'
  },
  ui: {
    glass: 'rgba(30, 41, 59, 0.8)',
    glassLight: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.2)',
    text: '#e2e8f0',
    textSecondary: '#94a3b8'
  }
};

// Sample version content for demo
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
  const [mode, setMode] = useState('read'); // 'read' or 'edit'
  const [viewStyle, setViewStyle] = useState('metro'); // 'metro' or 'timeline'
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [compareVersions, setCompareVersions] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hoveredVersion, setHoveredVersion] = useState(null);
  
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize with demo data if empty
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
          stats: { additions: 8, deletions: 0 }
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
          stats: { additions: 15, deletions: 3 }
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
          stats: { additions: 22, deletions: 5 }
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

  // Beautiful SVG metro map rendering
  const renderMetroMap = () => {
    const versions = block.versions || [];
    if (versions.length === 0) return null;

    const width = 800;
    const height = 300;
    const stationRadius = 24;
    const trackWidth = 4;
    const stationSpacing = 200;
    const startX = 80;
    const centerY = height / 2;

    // Calculate positions for each version
    const positions = {};
    versions.forEach((version, index) => {
      positions[version.id] = {
        x: startX + index * stationSpacing,
        y: centerY,
        version
      };
    });

    return (
      <svg 
        ref={svgRef}
        width={width} 
        height={height}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      >
        {/* Definitions for gradients and filters */}
        <defs>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Track gradient */}
          <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={COLORS.tracks.main} stopOpacity="0.3" />
            <stop offset="50%" stopColor={COLORS.tracks.main} stopOpacity="0.8" />
            <stop offset="100%" stopColor={COLORS.tracks.main} stopOpacity="0.3" />
          </linearGradient>

          {/* Station gradients */}
          {Object.entries(COLORS.stations).map(([state, color]) => (
            <radialGradient key={state} id={`station-${state}`}>
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </radialGradient>
          ))}
        </defs>

        {/* Main track line with animation */}
        <line
          x1={startX - 20}
          y1={centerY}
          x2={startX + (versions.length - 1) * stationSpacing + 20}
          y2={centerY}
          stroke="url(#trackGradient)"
          strokeWidth={trackWidth}
          strokeLinecap="round"
        />

        {/* Progress indicator line */}
        <line
          x1={startX - 20}
          y1={centerY}
          x2={positions[block.currentVersion]?.x || startX}
          y2={centerY}
          stroke={COLORS.tracks.main}
          strokeWidth={trackWidth + 2}
          strokeLinecap="round"
          opacity="0.8"
        >
          <animate
            attributeName="x2"
            from={startX - 20}
            to={positions[block.currentVersion]?.x || startX}
            dur="1s"
            fill="freeze"
          />
        </line>

        {/* Version stations */}
        {versions.map((version, index) => {
          const pos = positions[version.id];
          const isCurrent = version.id === block.currentVersion;
          const isHovered = hoveredVersion === version.id;
          const isSelected = selectedVersion?.id === version.id;
          
          return (
            <g key={version.id}>
              {/* Station glow effect */}
              {(isCurrent || isHovered) && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={stationRadius + 8}
                  fill={COLORS.stations[version.state || 'stable']}
                  opacity="0.2"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="r"
                    from={stationRadius}
                    to={stationRadius + 8}
                    dur="0.3s"
                    fill="freeze"
                  />
                </circle>
              )}

              {/* Station circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isCurrent ? stationRadius : stationRadius - 4}
                fill={`url(#station-${version.state || 'stable'})`}
                stroke={isSelected ? '#fff' : 'transparent'}
                strokeWidth="3"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredVersion(version.id)}
                onMouseLeave={() => setHoveredVersion(null)}
                onClick={() => handleVersionClick(version)}
              >
                {isCurrent && (
                  <animate
                    attributeName="r"
                    values={`${stationRadius - 2};${stationRadius};${stationRadius - 2}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>

              {/* Version label */}
              <text
                x={pos.x}
                y={pos.y - stationRadius - 10}
                textAnchor="middle"
                className="fill-text-primary text-sm font-medium select-none"
                style={{ fill: COLORS.ui.text }}
              >
                {version.label}
              </text>

              {/* Author and time */}
              <text
                x={pos.x}
                y={pos.y + stationRadius + 20}
                textAnchor="middle"
                className="fill-text-secondary text-xs select-none"
                style={{ fill: COLORS.ui.textSecondary }}
              >
                {version.author}
              </text>
              <text
                x={pos.x}
                y={pos.y + stationRadius + 35}
                textAnchor="middle"
                className="fill-text-secondary text-xs select-none"
                style={{ fill: COLORS.ui.textSecondary }}
              >
                {formatTimestamp(version.timestamp)}
              </text>

              {/* Stats badge */}
              {version.stats && (
                <g transform={`translate(${pos.x - 30}, ${pos.y + stationRadius + 45})`}>
                  <rect
                    width="60"
                    height="20"
                    rx="10"
                    fill={COLORS.ui.glass}
                    stroke={COLORS.ui.border}
                    strokeWidth="1"
                  />
                  <text
                    x="30"
                    y="14"
                    textAnchor="middle"
                    className="text-xs"
                    style={{ fill: COLORS.ui.text, fontSize: '10px' }}
                  >
                    +{version.stats.additions} -{version.stats.deletions}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const handleVersionClick = (version) => {
    if (isComparing) {
      if (compareVersions.find(v => v.id === version.id)) {
        setCompareVersions(compareVersions.filter(v => v.id !== version.id));
      } else if (compareVersions.length < 2) {
        setCompareVersions([...compareVersions, version]);
      }
    } else {
      setSelectedVersion(version);
      if (mode === 'edit') {
        setEditingContent(version.content);
      }
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
      branch: 'main',
      parents: [block.currentVersion],
      stats: { additions: 10, deletions: 5 } // Would calculate real diff
    };

    onUpdate(block.id, {
      ...block,
      versions: [...(block.versions || []), newVersion],
      currentVersion: newVersion.id
    });

    setMode('read');
    setSelectedVersion(newVersion);
  };

  // Main render
  return (
    <div className="relative bg-dark-secondary/20 backdrop-blur-sm rounded-xl overflow-hidden border border-dark-secondary/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-secondary/40 to-transparent p-4 border-b border-dark-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-green/20 rounded-lg">
              <GitBranch size={24} className="text-accent-green" />
            </div>
            <div>
              <h3 className="text-text-primary font-semibold text-lg flex items-center gap-2">
                {block.title || 'Version Track'}
                <Sparkles size={16} className="text-accent-green opacity-60" />
              </h3>
              <p className="text-text-secondary text-sm">
                {block.versions?.length || 0} versions • {mode === 'read' ? 'Read Mode' : 'Edit Mode'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-lg hover:bg-dark-secondary/50 transition-colors"
              title="Search versions"
            >
              <Search size={18} className="text-text-secondary" />
            </button>

            {/* View style toggle */}
            <div className="flex items-center bg-dark-secondary/30 rounded-lg p-1">
              <button
                onClick={() => setViewStyle('metro')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewStyle === 'metro' 
                    ? 'bg-accent-green text-dark-primary' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Metro
              </button>
              <button
                onClick={() => setViewStyle('timeline')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewStyle === 'timeline' 
                    ? 'bg-accent-green text-dark-primary' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Timeline
              </button>
            </div>

            {/* Mode toggle */}
            <button
              onClick={() => setMode(mode === 'read' ? 'edit' : 'read')}
              className="flex items-center gap-2 px-4 py-2 bg-accent-green/20 
                         text-accent-green rounded-lg hover:bg-accent-green/30 transition-colors"
            >
              {mode === 'read' ? (
                <>
                  <Edit3 size={16} />
                  <span className="text-sm font-medium">Edit Mode</span>
                </>
              ) : (
                <>
                  <Eye size={16} />
                  <span className="text-sm font-medium">Read Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="mt-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search versions by label, author, or content..."
              className="w-full px-4 py-2 bg-dark-primary/50 rounded-lg 
                         text-text-primary placeholder-text-secondary/50
                         focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            />
          </div>
        )}
      </div>

      {/* Metro Map Visualization */}
      <div className="relative p-6 overflow-x-auto">
        {renderMetroMap()}
      </div>

      {/* Version Details / Editor */}
      {selectedVersion && (
        <div className="border-t border-dark-secondary/30">
          {mode === 'read' ? (
            // Read mode - show version details
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-text-primary font-medium text-lg flex items-center gap-2">
                    <GitCommit size={20} />
                    {selectedVersion.label}
                  </h4>
                  <p className="text-text-secondary text-sm mt-1">
                    {selectedVersion.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                    <span>{selectedVersion.author}</span>
                    <span>•</span>
                    <span>{formatTimestamp(selectedVersion.timestamp)}</span>
                    <span>•</span>
                    <span className="text-green-400">+{selectedVersion.stats?.additions || 0}</span>
                    <span className="text-red-400">-{selectedVersion.stats?.deletions || 0}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="p-2 hover:bg-dark-secondary/50 rounded-lg transition-colors"
                >
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>

              {/* Code preview with syntax highlighting */}
              <div className="bg-dark-primary rounded-lg overflow-hidden">
                <Highlight
                  theme={themes.nightOwl}
                  code={selectedVersion.content}
                  language="javascript"
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={`${className} p-4 text-sm`} style={style}>
                      <code>
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
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

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    setMode('edit');
                    setEditingContent(selectedVersion.content);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-green 
                             text-dark-primary rounded-lg hover:bg-accent-green/80 
                             transition-colors font-medium"
                >
                  <Edit3 size={16} />
                  Edit this version
                </button>
                <button
                  onClick={() => {
                    onUpdate(block.id, { ...block, currentVersion: selectedVersion.id });
                  }}
                  className="px-4 py-2 bg-dark-secondary/50 text-text-primary 
                             rounded-lg hover:bg-dark-secondary transition-colors"
                >
                  Set as current
                </button>
                <button
                  onClick={() => setIsComparing(true)}
                  className="px-4 py-2 bg-dark-secondary/50 text-text-primary 
                             rounded-lg hover:bg-dark-secondary transition-colors"
                >
                  Compare with...
                </button>
              </div>
            </div>
          ) : (
            // Edit mode - show editor
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-text-primary font-medium mb-2">
                  Editing: {selectedVersion.label}
                </h4>
              </div>
              
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-96 p-4 bg-dark-primary rounded-lg text-text-primary 
                           font-mono text-sm focus:outline-none focus:ring-2 
                           focus:ring-accent-green/50 resize-none"
                spellCheck={false}
              />

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={saveNewVersion}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-green 
                             text-dark-primary rounded-lg hover:bg-accent-green/80 
                             transition-colors font-medium"
                >
                  <Save size={16} />
                  Save as new version
                </button>
                <button
                  onClick={() => {
                    setMode('read');
                    setEditingContent('');
                  }}
                  className="px-4 py-2 bg-dark-secondary/50 text-text-primary 
                             rounded-lg hover:bg-dark-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison view */}
      {isComparing && compareVersions.length === 2 && (
        <div className="border-t border-dark-secondary/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-text-primary font-medium text-lg">
              Comparing: {compareVersions[0].label} ↔ {compareVersions[1].label}
            </h4>
            <button
              onClick={() => {
                setIsComparing(false);
                setCompareVersions([]);
              }}
              className="p-2 hover:bg-dark-secondary/50 rounded-lg transition-colors"
            >
              <X size={18} className="text-text-secondary" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {compareVersions.map((version, index) => (
              <div key={version.id} className="bg-dark-primary rounded-lg p-4">
                <h5 className="text-text-primary font-medium mb-2">{version.label}</h5>
                <pre className="text-xs text-text-secondary overflow-x-auto">
                  <code>{version.content}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}