import { useState, useRef, useEffect, useCallback } from 'react';
import { GitBranch, Clock, ChevronDown, ChevronRight, Maximize2, X, GitCommit } from 'lucide-react';

// Metro map color scheme
const TRACK_COLORS = {
  main: '#10b981', // Green for main line
  experimental: '#f97316', // Orange for experimental
  deprecated: '#6b7280', // Gray for deprecated
  active: '#3b82f6' // Blue for active/stable
};

// Station (version) states
const STATION_STATES = {
  current: 'current',
  stable: 'stable',
  experimental: 'experimental',
  deprecated: 'deprecated'
};

export default function VersionTrackBlock({ block, onUpdate, onDelete }) {
  const [viewMode, setViewMode] = useState(block.viewMode || 'collapsed');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState([]);
  const [hoveredStation, setHoveredStation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(block.title || 'Version Track');
  const [description, setDescription] = useState(block.description || '');
  
  const canvasRef = useRef(null);
  const timelineRef = useRef(null);

  // Initialize with sample data if empty
  useEffect(() => {
    if (!block.mainLine || block.mainLine.length === 0) {
      const sampleData = {
        mainLine: [
          {
            id: 'v1',
            label: 'Initial',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            author: 'You',
            state: STATION_STATES.stable,
            summary: 'Initial implementation',
            content: '// Initial code'
          },
          {
            id: 'v2',
            label: 'Refactor',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            author: 'You',
            state: STATION_STATES.stable,
            summary: 'Improved structure',
            content: '// Refactored code'
          },
          {
            id: 'v3',
            label: 'Current',
            timestamp: new Date(),
            author: 'You',
            state: STATION_STATES.current,
            summary: 'Latest version',
            content: '// Current code'
          }
        ],
        branches: [],
        currentVersion: 'v3'
      };
      
      onUpdate(block.id, { ...block, ...sampleData });
    }
  }, [block, onUpdate]);

  // Draw metro map visualization
  useEffect(() => {
    if (viewMode === 'timeline' && canvasRef.current && block.mainLine) {
      drawMetroMap();
    }
  }, [viewMode, block.mainLine, hoveredStation]);

  const drawMetroMap = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate positions
    const stationSpacing = 150;
    const startX = 50;
    const centerY = canvas.height / 2;
    
    // Draw main line
    ctx.beginPath();
    ctx.strokeStyle = TRACK_COLORS.main;
    ctx.lineWidth = 4;
    ctx.moveTo(startX, centerY);
    ctx.lineTo(startX + (block.mainLine.length - 1) * stationSpacing, centerY);
    ctx.stroke();
    
    // Draw stations
    block.mainLine.forEach((version, index) => {
      const x = startX + index * stationSpacing;
      const y = centerY;
      
      // Station circle
      ctx.beginPath();
      ctx.fillStyle = getStationColor(version.state);
      ctx.strokeStyle = hoveredStation === version.id ? '#fff' : 'transparent';
      ctx.lineWidth = 3;
      
      const radius = version.state === STATION_STATES.current ? 12 : 8;
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      if (hoveredStation === version.id) {
        ctx.stroke();
      }
      
      // Station label
      ctx.fillStyle = '#e0e7ff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(version.label, x, y - 20);
      
      // Timestamp
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText(formatTimestamp(version.timestamp), x, y + 30);
    });
  };

  const getStationColor = (state) => {
    switch (state) {
      case STATION_STATES.current:
        return TRACK_COLORS.active;
      case STATION_STATES.experimental:
        return TRACK_COLORS.experimental;
      case STATION_STATES.deprecated:
        return TRACK_COLORS.deprecated;
      default:
        return TRACK_COLORS.main;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleStationClick = (version) => {
    if (compareMode) {
      // Handle comparison mode
      if (compareVersions.length < 2) {
        setCompareVersions([...compareVersions, version]);
        if (compareVersions.length === 1) {
          // Two versions selected, show comparison
          setCompareMode(false);
          // TODO: Show comparison view
        }
      }
    } else {
      // Normal mode - show version details
      setSelectedVersion(version);
    }
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !block.mainLine) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is on a station
    const stationSpacing = 150;
    const startX = 50;
    const centerY = rect.height / 2;
    
    block.mainLine.forEach((version, index) => {
      const stationX = startX + index * stationSpacing;
      const distance = Math.sqrt(Math.pow(x - stationX, 2) + Math.pow(y - centerY, 2));
      
      if (distance < 15) { // Click radius
        handleStationClick(version);
      }
    });
  };

  const handleCanvasHover = (e) => {
    if (!canvasRef.current || !block.mainLine) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if hovering over a station
    const stationSpacing = 150;
    const startX = 50;
    const centerY = rect.height / 2;
    
    let foundStation = null;
    block.mainLine.forEach((version, index) => {
      const stationX = startX + index * stationSpacing;
      const distance = Math.sqrt(Math.pow(x - stationX, 2) + Math.pow(y - centerY, 2));
      
      if (distance < 15) {
        foundStation = version.id;
        canvasRef.current.style.cursor = 'pointer';
      }
    });
    
    if (!foundStation) {
      canvasRef.current.style.cursor = 'default';
    }
    
    if (foundStation !== hoveredStation) {
      setHoveredStation(foundStation);
    }
  };

  // Render based on view mode
  const renderCollapsed = () => (
    <div 
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-dark-secondary/30 rounded-lg transition-colors"
      onClick={() => setViewMode('inline')}
    >
      <div className="flex items-center gap-3">
        <GitBranch size={20} className="text-accent-green" />
        <div>
          <h3 className="text-text-primary font-medium">{title}</h3>
          <p className="text-text-secondary text-sm">
            {block.mainLine?.length || 0} versions
            {block.branches?.length > 0 && ` • ${block.branches.length} branches`}
          </p>
        </div>
      </div>
      <ChevronRight size={20} className="text-text-secondary" />
    </div>
  );

  const renderInline = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <GitBranch size={20} className="text-accent-green" />
          <div>
            <h3 className="text-text-primary font-medium">{title}</h3>
            <p className="text-text-secondary text-sm">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('timeline')}
            className="p-2 hover:bg-dark-secondary rounded transition-colors"
            title="Expand timeline"
          >
            <Maximize2 size={16} className="text-text-secondary" />
          </button>
          <button
            onClick={() => setViewMode('collapsed')}
            className="p-2 hover:bg-dark-secondary rounded transition-colors"
            title="Collapse"
          >
            <ChevronDown size={16} className="text-text-secondary" />
          </button>
        </div>
      </div>
      
      {/* Inline version preview */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 text-sm">
          {block.mainLine?.map((version, index) => (
            <div key={version.id} className="flex items-center">
              <button
                onClick={() => handleStationClick(version)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  version.state === STATION_STATES.current
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-dark-secondary/50 text-text-secondary hover:bg-dark-secondary'
                }`}
              >
                {version.label}
              </button>
              {index < block.mainLine.length - 1 && (
                <span className="mx-1 text-text-secondary">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-secondary/50">
        <div className="flex items-center gap-3">
          <GitBranch size={20} className="text-accent-green" />
          <div>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditing(false);
                  onUpdate(block.id, { title });
                }}
                className="bg-transparent text-text-primary font-medium outline-none"
                autoFocus
              />
            ) : (
              <h3 
                className="text-text-primary font-medium cursor-text"
                onClick={() => setIsEditing(true)}
              >
                {title}
              </h3>
            )}
            <p className="text-text-secondary text-sm">{description}</p>
          </div>
        </div>
        <button
          onClick={() => setViewMode('inline')}
          className="p-2 hover:bg-dark-secondary rounded transition-colors"
          title="Minimize"
        >
          <X size={20} className="text-text-secondary" />
        </button>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-dark-secondary/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareVersions([]);
            }}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              compareMode
                ? 'bg-accent-green text-dark-primary'
                : 'bg-dark-secondary/50 text-text-secondary hover:bg-dark-secondary'
            }`}
          >
            {compareMode ? 'Cancel Compare' : 'Compare Versions'}
          </button>
          {compareMode && (
            <span className="text-sm text-text-secondary">
              Select {2 - compareVersions.length} version{2 - compareVersions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Clock size={14} />
          <span>Timeline View</span>
        </div>
      </div>
      
      {/* Metro Map Canvas */}
      <div className="relative bg-dark-primary/50 rounded-lg m-4" ref={timelineRef}>
        <canvas
          ref={canvasRef}
          className="w-full h-48"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasHover}
          onMouseLeave={() => setHoveredStation(null)}
        />
        
        {/* Version details tooltip */}
        {hoveredStation && (
          <div className="absolute top-4 right-4 bg-dark-primary/95 backdrop-blur-sm border border-dark-secondary/50 rounded-lg p-3 text-sm">
            {(() => {
              const version = block.mainLine.find(v => v.id === hoveredStation);
              return version ? (
                <div className="space-y-1">
                  <div className="font-medium text-text-primary">{version.label}</div>
                  <div className="text-text-secondary">{version.summary}</div>
                  <div className="text-text-secondary text-xs">by {version.author}</div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>
      
      {/* Selected version preview */}
      {selectedVersion && (
        <div className="m-4 p-4 bg-dark-secondary/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-text-primary font-medium flex items-center gap-2">
              <GitCommit size={16} />
              {selectedVersion.label}
            </h4>
            <button
              onClick={() => setSelectedVersion(null)}
              className="text-text-secondary hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-text-secondary">{selectedVersion.summary}</p>
            <div className="bg-dark-primary rounded p-3 font-mono text-xs">
              {selectedVersion.content}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-text-secondary text-xs">
                {formatTimestamp(selectedVersion.timestamp)} by {selectedVersion.author}
              </span>
              <button className="text-accent-green hover:text-accent-green/80 text-sm">
                Load this version →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div className="bg-dark-secondary/20 rounded-lg overflow-hidden">
      {viewMode === 'collapsed' && renderCollapsed()}
      {viewMode === 'inline' && renderInline()}
      {viewMode === 'timeline' && renderTimeline()}
    </div>
  );
}