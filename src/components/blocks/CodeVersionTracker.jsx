import { useState, useEffect } from 'react';
import { GitBranch, History, Clock } from 'lucide-react';

// Feature flag - set to false to completely disable version tracking
export const VERSION_TRACKING_ENABLED = true;

// Gutter-based version indicator following modern UX patterns
export default function CodeVersionTracker({ 
  block, 
  allBlocks = [], 
  onNavigateToVersion,
  isBlockHovered = false,
  showAlways = false // For version comparison mode
}) {
  if (!VERSION_TRACKING_ENABLED) return null;
  
  const [versionInfo, setVersionInfo] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isRecent, setIsRecent] = useState(false);

  useEffect(() => {
    // Check if this block has version metadata
    if (block.versionOf || block.hasVersions) {
      const info = {
        isOriginal: !block.versionOf,
        originalId: block.versionOf || block.id,
        versionNumber: block.versionNumber || 1,
        hasVersions: block.hasVersions || false,
        versionCount: 0 // Will be calculated
      };
      
      // Count total versions
      if (info.hasVersions) {
        info.versionCount = allBlocks.filter(b => 
          b.versionOf === block.id || b.id === block.id
        ).length;
      }
      
      setVersionInfo(info);
      
      // Check if recently modified (within 24 hours)
      const modifiedTime = block.versionCreatedAt || block.updatedAt;
      if (modifiedTime) {
        const hoursSinceModified = (Date.now() - new Date(modifiedTime).getTime()) / (1000 * 60 * 60);
        setIsRecent(hoursSinceModified < 24);
      }
    }
  }, [block, allBlocks]);

  // Determine visibility based on context
  const shouldShow = versionInfo && (
    showAlways || // Version comparison mode
    isBlockHovered || // Block is hovered
    isHovered || // Indicator is hovered
    (versionInfo.versionCount > 1) || // Multiple versions exist
    isRecent // Recently modified
  );

  if (!versionInfo) return null;

  const handleNavigate = (targetId) => {
    if (onNavigateToVersion) {
      onNavigateToVersion(targetId);
      setShowTimeline(false);
    }
  };

  // Gutter indicator styles based on state
  const getIndicatorStyle = () => {
    if (versionInfo.isOriginal && versionInfo.hasVersions) {
      return 'bg-accent-green/60'; // Original with versions
    } else if (versionInfo.isOriginal) {
      return 'bg-accent-green/30'; // Original without versions
    } else {
      return 'bg-text-secondary/30'; // Version
    }
  };

  return (
    <>
      {/* Gutter indicator - positioned in the far left margin to avoid overlap with block controls */}
      <div 
        className={`absolute -left-14 top-4 transition-all duration-300 ${
          shouldShow ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowTimeline(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setTimeout(() => setShowTimeline(false), 200);
        }}
      >
        {/* Dot indicator */}
        <div className="relative">
          <div 
            className={`w-2 h-2 rounded-full ${getIndicatorStyle()} 
                       transition-all duration-200 cursor-pointer
                       ${isHovered ? 'scale-125' : ''}`}
            onClick={() => {
              if (!versionInfo.isOriginal) {
                handleNavigate(versionInfo.originalId);
              }
            }}
          >
            {/* Pulse animation for recent changes */}
            {isRecent && (
              <div className="absolute inset-0 rounded-full bg-accent-green/40 animate-ping" />
            )}
          </div>
          
          {/* Version number on hover */}
          {isHovered && !versionInfo.isOriginal && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 
                           text-[9px] text-text-secondary/70 font-mono whitespace-nowrap">
              v{versionInfo.versionNumber}
            </div>
          )}
          
          {/* Tooltip with details */}
          {isHovered && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 
                           bg-dark-primary/95 backdrop-blur-sm border border-dark-secondary/50
                           rounded px-2 py-1 text-[10px] whitespace-nowrap
                           shadow-lg pointer-events-none z-50">
              <div className="flex items-center gap-1.5">
                {versionInfo.isOriginal ? (
                  <>
                    <GitBranch size={10} className="text-accent-green" />
                    <span className="text-accent-green">Original</span>
                    {versionInfo.hasVersions && (
                      <span className="text-text-secondary/70">
                        • {versionInfo.versionCount} versions
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <History size={10} className="text-text-secondary" />
                    <span>Version {versionInfo.versionNumber}</span>
                    <button
                      className="text-accent-green/70 hover:text-accent-green underline ml-1"
                      onClick={() => handleNavigate(versionInfo.originalId)}
                    >
                      → Original
                    </button>
                  </>
                )}
                {isRecent && (
                  <>
                    <span className="text-text-secondary/50">•</span>
                    <Clock size={10} className="text-yellow-500/70" />
                    <span className="text-yellow-500/70">Recent</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Temporal heat map background (subtle) */}
      {isRecent && isBlockHovered && (
        <div 
          className="absolute inset-0 bg-accent-green/[0.02] rounded-lg pointer-events-none
                     transition-opacity duration-500"
          style={{ zIndex: -1 }}
        />
      )}
    </>
  );
}

// Subtle timeline connector component - only visible on hover
export function VersionTimeline({ 
  startBlockId, 
  endBlockId, 
  blocks = [],
  containerRef,
  isVisible = false // Controlled by parent hover state
}) {
  if (!VERSION_TRACKING_ENABLED) return null;
  
  const [pathData, setPathData] = useState(null);

  useEffect(() => {
    if (!containerRef?.current || !isVisible) return;

    const calculatePath = () => {
      const startElement = document.querySelector(`[data-block-id="${startBlockId}"]`);
      const endElement = document.querySelector(`[data-block-id="${endBlockId}"]`);
      
      if (!startElement || !endElement || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const startRect = startElement.getBoundingClientRect();
      const endRect = endElement.getBoundingClientRect();

      // Position in the gutter area - aligned with the new dot position
      const startY = startRect.top - containerRect.top + 20; // Align with gutter dots
      const endY = endRect.top - containerRect.top + 20;
      const x = -56; // Align with -left-14 (-56px)

      setPathData({
        x,
        startY,
        endY,
        height: endY - startY,
        startHeight: startRect.height,
        endHeight: endRect.height
      });
    };

    if (isVisible) {
      calculatePath();
      // Recalculate on scroll or resize
      const handleUpdate = () => calculatePath();
      window.addEventListener('resize', handleUpdate);
      containerRef.current?.addEventListener('scroll', handleUpdate);

      return () => {
        window.removeEventListener('resize', handleUpdate);
        containerRef.current?.removeEventListener('scroll', handleUpdate);
      };
    }
  }, [startBlockId, endBlockId, blocks, containerRef, isVisible]);

  if (!pathData || pathData.height < 0 || !isVisible) return null;

  return (
    <div
      className="absolute pointer-events-none transition-opacity duration-300"
      style={{
        left: pathData.x + 'px',
        top: pathData.startY + 'px',
        width: '24px',
        height: pathData.height + 'px',
        opacity: isVisible ? 0.3 : 0,
        zIndex: 4
      }}
    >
      {/* Subtle dotted line */}
      <svg 
        width="24" 
        height={pathData.height} 
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        <line
          x1="12"
          y1="0"
          x2="12"
          y2={pathData.height}
          stroke="rgb(76, 175, 80)"
          strokeWidth="1"
          strokeDasharray="2,4"
          opacity="0.4"
        />
      </svg>
      
      {/* Connection dots - aligned with gutter indicators */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <div className="w-1.5 h-1.5 bg-text-secondary/20 rounded-full" />
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <div className="w-1.5 h-1.5 bg-text-secondary/20 rounded-full" />
      </div>
    </div>
  );
}

// Helper function to link code blocks
export function linkCodeVersions(originalBlock, newBlock) {
  return {
    ...newBlock,
    versionOf: originalBlock.id,
    versionNumber: (originalBlock.versionNumber || 1) + 1,
    versionCreatedAt: new Date().toISOString()
  };
}

// Helper to mark a block as having versions
export function markAsHavingVersions(block) {
  return {
    ...block,
    hasVersions: true
  };
}