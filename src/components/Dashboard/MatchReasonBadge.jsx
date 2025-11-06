import React from 'react';
import { FileText, Tag, Code } from 'lucide-react';

/**
 * Badge showing where the search match occurred
 * @param {string} matchReason - 'title', 'tags', or 'blocks'
 * @param {number} matchScore - Relevance score (0.0-1.0)
 */
export function MatchReasonBadge({ matchReason, matchScore }) {
  const badges = {
    title: {
      icon: FileText,
      label: 'Title',
      className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    tags: {
      icon: Tag,
      label: 'Tags',
      className: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    blocks: {
      icon: Code,
      label: 'Content',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    all: {
      icon: FileText,
      label: 'All',
      className: 'bg-gray-100 text-gray-700 border-gray-200'
    }
  };

  const badge = badges[matchReason] || badges.all;
  const Icon = badge.icon;
  const scorePercent = Math.round(matchScore * 100);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${badge.className}`}>
      <Icon className="w-3 h-3" />
      <span>{badge.label}</span>
      {matchScore !== undefined && matchScore !== 1.0 && (
        <span className="opacity-75">· {scorePercent}%</span>
      )}
    </div>
  );
}

export default MatchReasonBadge;



