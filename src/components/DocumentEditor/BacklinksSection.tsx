/**
 * BacklinksSection Component
 *
 * Displays documents that link to the current document.
 * Clicking a backlink navigates to that document.
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { memo } from 'react';
import { Link2 } from 'lucide-react';

// ============== Types ==============

export interface BacklinkEntry {
  id: string;
  title: string;
  preview: string;
}

export interface BacklinksSectionProps {
  backlinks: BacklinkEntry[];
  isMobileView: boolean;
  onNavigateToDocument: (title: string) => void;
}

// ============== Component ==============

function BacklinksSectionComponent({
  backlinks,
  isMobileView,
  onNavigateToDocument,
}: BacklinksSectionProps) {
  if (backlinks.length === 0) {
    return null;
  }

  return (
    <div className={`border-t border-dark-secondary/30 pt-8 ${isMobileView ? 'px-0' : ''}`}>
      <h3 className="text-text-secondary text-sm font-medium mb-4 flex items-center gap-2">
        <Link2 size={16} />
        Linked References ({backlinks.length})
      </h3>
      <div className="space-y-3">
        {backlinks.map((backlink) => (
          <button
            key={backlink.id}
            onClick={() => onNavigateToDocument(backlink.title)}
            className="w-full text-left p-3 bg-dark-secondary/30 rounded-lg
                       hover:bg-dark-secondary/50 transition-colors group"
          >
            <div className="text-text-primary font-medium group-hover:text-text-primary
                            transition-colors">
              {backlink.title}
            </div>
            <div className="text-text-secondary text-sm line-clamp-1 mt-1">
              {backlink.preview}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export const BacklinksSection = memo(BacklinksSectionComponent);
export default BacklinksSection;
