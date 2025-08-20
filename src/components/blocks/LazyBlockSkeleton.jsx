import React from 'react';
import { 
  GitBranch, 
  CheckSquare, 
  MessageSquare, 
  FileText,
  Loader2
} from 'lucide-react';

/**
 * Skeleton component for lazy-loaded heavy blocks
 * Provides immediate visual feedback while content loads
 */
export default function LazyBlockSkeleton({ blockType, estimatedHeight = 200 }) {
  const getSkeletonContent = () => {
    switch (blockType) {
      case 'version-track':
        return (
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-dark-secondary/30 rounded-lg">
              <GitBranch size={20} className="text-blue-400/60" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-dark-secondary/40 rounded w-48 mb-2"></div>
              <div className="h-3 bg-dark-secondary/30 rounded w-32"></div>
            </div>
          </div>
        );
        
      case 'issue-tracker':
        return (
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-dark-secondary/30 rounded-lg">
              <CheckSquare size={20} className="text-green-400/60" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-dark-secondary/40 rounded w-40 mb-2"></div>
              <div className="h-3 bg-dark-secondary/30 rounded w-24"></div>
            </div>
          </div>
        );
        
      case 'ai':
        return (
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-dark-secondary/30 rounded-lg">
              <MessageSquare size={20} className="text-purple-400/60" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-dark-secondary/40 rounded w-36 mb-2"></div>
              <div className="h-3 bg-dark-secondary/30 rounded w-28"></div>
            </div>
          </div>
        );
        
      case 'filetree':
        return (
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-dark-secondary/30 rounded-lg">
              <FileText size={20} className="text-orange-400/60" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-dark-secondary/40 rounded w-44 mb-2"></div>
              <div className="h-3 bg-dark-secondary/30 rounded w-36"></div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-dark-secondary/30 rounded-lg">
              <div className="w-5 h-5 bg-dark-secondary/40 rounded"></div>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-dark-secondary/40 rounded w-32 mb-2"></div>
              <div className="h-3 bg-dark-secondary/30 rounded w-24"></div>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className="relative bg-dark-primary/30 rounded-lg border border-dark-secondary/20 p-6 animate-pulse"
      style={{ minHeight: estimatedHeight }}
    >
      {/* Header */}
      {getSkeletonContent()}
      
      {/* Content area */}
      <div className="space-y-3">
        <div className="h-3 bg-dark-secondary/30 rounded w-full"></div>
        <div className="h-3 bg-dark-secondary/30 rounded w-5/6"></div>
        <div className="h-3 bg-dark-secondary/30 rounded w-3/4"></div>
        
        {blockType === 'version-track' && (
          <>
            {/* Metro map skeleton */}
            <div className="mt-6 p-4 bg-dark-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-blue-400/40 rounded-full"></div>
                <div className="h-2 bg-blue-400/30 rounded flex-1"></div>
                <div className="w-3 h-3 bg-green-400/40 rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400/40 rounded-full"></div>
                <div className="h-2 bg-purple-400/30 rounded flex-1"></div>
                <div className="w-3 h-3 bg-red-400/40 rounded-full"></div>
              </div>
            </div>
          </>
        )}
        
        {blockType === 'ai' && (
          <>
            {/* Chat messages skeleton */}
            <div className="space-y-4 mt-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-400/30 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-dark-secondary/30 rounded w-3/4"></div>
                  <div className="h-3 bg-dark-secondary/30 rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-400/30 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-dark-secondary/30 rounded w-5/6"></div>
                  <div className="h-3 bg-dark-secondary/30 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Loading indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-text-secondary/60 text-sm">
        <Loader2 size={14} className="animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}