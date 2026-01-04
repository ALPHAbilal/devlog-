/**
 * LinesView Component
 *
 * Compact lines/outline view of all blocks.
 * Clicking a line switches to blocks view and scrolls to that block.
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { memo, useState, useCallback } from 'react';
import type React from 'react';
// @ts-expect-error - JSX component without type declarations
import CompactBlockLine from '../CompactBlockLine';

// ============== Types ==============

export interface BlockData {
  id: string;
  type: string;
  content?: string;
  [key: string]: unknown;
}

export interface LinesViewProps {
  blocks: BlockData[];
  isMobileView: boolean;
  selectedLineBlockId: string | null;
  onSelectLine: (blockId: string) => void;
  onSwitchToBlocksView: (blockId: string) => void;
}

// ============== Component ==============

function LinesViewComponent({
  blocks,
  isMobileView,
  selectedLineBlockId,
  onSelectLine,
  onSwitchToBlocksView,
}: LinesViewProps) {
  // Scroll progress state for fade shadows
  const [scrollProgress, setScrollProgress] = useState({
    top: 0,
    bottom: 1,
  });

  // Handle scroll for fade shadows
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // Calculate scroll progress (0 = at top, 1 = at bottom)
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setScrollProgress({ top: 0, bottom: 0 });
      return;
    }

    // Compute scroll progress for shadow fading
    setScrollProgress({
      top: Math.min(scrollTop / 50, 1), // Fade in top shadow quickly
      bottom: Math.min((maxScroll - scrollTop) / 50, 1), // Fade in bottom shadow quickly
    });
  }, []);

  return (
    <div className={`mb-8 ${isMobileView ? '-mx-4' : '-mx-8'}`}>
      <div
        className="relative bg-dark-primary/30 backdrop-blur-sm rounded-lg
                    border border-dark-secondary/20 overflow-hidden"
        style={{ maxHeight: '500px' }}
      >
        {/* Top fade shadow - visible when scrolled */}
        <div
          className="absolute top-0 left-0 right-0 h-20
                     bg-gradient-to-b from-dark-primary via-dark-primary/50 to-transparent
                     z-10 pointer-events-none transition-opacity duration-300"
          style={{ opacity: scrollProgress.top * 0.9 }}
        />

        {/* Bottom fade shadow - visible when not at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20
                     bg-gradient-to-t from-dark-primary via-dark-primary/50 to-transparent
                     z-10 pointer-events-none transition-opacity duration-300"
          style={{ opacity: scrollProgress.bottom * 0.9 }}
        />

        {/* Scrollable container */}
        <div
          className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-stable"
          style={{ maxHeight: '500px' }}
          onScroll={handleScroll}
        >
          {blocks.map((block, index) => (
            <CompactBlockLine
              key={block.id}
              block={block}
              index={index}
              isSelected={selectedLineBlockId === block.id}
              onClick={(blockId: string) => {
                onSelectLine(blockId);
                onSwitchToBlocksView(blockId);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const LinesView = memo(LinesViewComponent);
export default LinesView;
