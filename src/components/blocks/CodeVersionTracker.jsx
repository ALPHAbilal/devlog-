import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

// Feature flag - set to false to completely disable version tracking
export const VERSION_TRACKING_ENABLED = true;

export default function CodeVersionTracker({ 
  block, 
  allBlocks = [], 
  onNavigateToVersion,
  position = 'top' // 'top' or 'bottom'
}) {
  if (!VERSION_TRACKING_ENABLED) return null;
  
  const [versionInfo, setVersionInfo] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Check if this block has version metadata
    if (block.versionOf || block.hasVersions) {
      const info = {
        isOriginal: !block.versionOf,
        originalId: block.versionOf || block.id,
        versionNumber: block.versionNumber || 1,
        hasVersions: block.hasVersions || false
      };
      setVersionInfo(info);
    }
  }, [block]);

  if (!versionInfo) return null;

  const handleNavigate = (targetId) => {
    if (onNavigateToVersion) {
      onNavigateToVersion(targetId);
    }
  };

  return (
    <div 
      className={`absolute ${position === 'top' ? '-top-7' : '-bottom-7'} left-0 
                  flex items-center gap-2 transition-all duration-200
                  ${isHovered ? 'opacity-100' : 'opacity-70'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Version Badge - Redesigned */}
      <div className={`
        flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]
        ${versionInfo.isOriginal 
          ? 'bg-accent-green/10 border border-accent-green/20 text-accent-green/90' 
          : 'bg-dark-secondary/40 border border-dark-secondary/60 text-text-secondary'
        }
        backdrop-blur-sm transition-all duration-200
        ${isHovered ? 'shadow-lg shadow-accent-green/10' : ''}
      `}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          versionInfo.isOriginal ? 'bg-accent-green' : 'bg-text-secondary/50'
        }`} />
        
        {versionInfo.isOriginal ? (
          <span className="font-medium">Original</span>
        ) : (
          <span className="font-mono">v{versionInfo.versionNumber}</span>
        )}
        
        {/* Navigation arrows - more subtle */}
        {!versionInfo.isOriginal && (
          <button
            onClick={() => handleNavigate(versionInfo.originalId)}
            className="ml-1 -mr-1 p-1 hover:bg-white/5 rounded-full transition-colors"
            title="Jump to original"
          >
            <ArrowUp size={10} className="text-current opacity-60 hover:opacity-100" />
          </button>
        )}
        
        {versionInfo.hasVersions && (
          <button
            onClick={() => {/* TODO: Show version list */}}
            className="ml-0.5 -mr-1 p-1 hover:bg-white/5 rounded-full transition-colors"
            title="View versions"
          >
            <ArrowDown size={10} className="text-current opacity-60 hover:opacity-100" />
          </button>
        )}
      </div>
    </div>
  );
}

// Timeline connector component
export function VersionTimeline({ 
  startBlockId, 
  endBlockId, 
  blocks = [],
  containerRef 
}) {
  if (!VERSION_TRACKING_ENABLED) return null;
  
  const [pathData, setPathData] = useState(null);

  useEffect(() => {
    if (!containerRef?.current) return;

    const calculatePath = () => {
      const startElement = document.querySelector(`[data-block-id="${startBlockId}"]`);
      const endElement = document.querySelector(`[data-block-id="${endBlockId}"]`);
      
      if (!startElement || !endElement || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const startRect = startElement.getBoundingClientRect();
      const endRect = endElement.getBoundingClientRect();

      // Calculate relative positions
      const startY = startRect.bottom - containerRect.top - 10;
      const endY = endRect.top - containerRect.top + 10;
      const x = -24; // Position to the left of blocks

      setPathData({
        x,
        startY,
        endY,
        height: endY - startY,
        startHeight: startRect.height,
        endHeight: endRect.height
      });
    };

    calculatePath();
    // Recalculate on scroll or resize
    const handleUpdate = () => calculatePath();
    window.addEventListener('resize', handleUpdate);
    containerRef.current?.addEventListener('scroll', handleUpdate);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      containerRef.current?.removeEventListener('scroll', handleUpdate);
    };
  }, [startBlockId, endBlockId, blocks, containerRef]);

  if (!pathData || pathData.height < 0) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: pathData.x + 'px',
        top: pathData.startY + 'px',
        width: '24px',
        height: pathData.height + 'px',
        zIndex: 5
      }}
    >
      {/* Vertical line with gradient */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-[2px] transition-all duration-300
                   hover:w-[3px] hover:shadow-[0_0_8px_rgba(76,175,80,0.5)]"
        style={{
          height: '100%',
          background: 'linear-gradient(180deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.4) 100%)'
        }}
      />
      
      {/* Subtle glow effect */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-[20px] opacity-20"
        style={{
          height: '100%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(76, 175, 80, 0.1) 50%, transparent 100%)',
          filter: 'blur(6px)'
        }}
      />
      
      {/* Start indicator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="w-2 h-2 bg-accent-green/30 rounded-full" />
          <div className="absolute inset-0 w-2 h-2 bg-accent-green/30 rounded-full animate-ping" />
        </div>
      </div>
      
      {/* End indicator with arrow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
        <div className="relative">
          <div className="w-3 h-3 bg-accent-green/50 rounded-full flex items-center justify-center">
            <ArrowDown size={8} className="text-accent-green" />
          </div>
        </div>
      </div>
      
      {/* Version flow label */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-8 -rotate-90 
                      text-[10px] text-text-secondary/40 font-mono whitespace-nowrap">
        version
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