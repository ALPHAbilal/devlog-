import React from 'react';

const BlockSkeleton = ({ type = 'text' }) => {
  const getSkeletonContent = () => {
    switch (type) {
      case 'heading':
        return (
          <div className="space-y-2">
            <div className="h-8 bg-gray-800 rounded animate-pulse w-3/4"></div>
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-2">
            <div className="h-4 bg-gray-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-gray-800 rounded animate-pulse w-4/6"></div>
          </div>
        );
      
      case 'code':
        return (
          <div className="bg-dark-secondary rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
              <div className="h-4 bg-gray-800 rounded animate-pulse w-16"></div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 bg-gray-800 rounded animate-pulse w-full"></div>
              <div className="h-3 bg-gray-800 rounded animate-pulse w-4/5"></div>
              <div className="h-3 bg-gray-800 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-gray-800 rounded animate-pulse w-5/6"></div>
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="border border-gray-800 rounded">
            <div className="grid grid-cols-3 gap-2 p-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-800 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        );
      
      case 'todo':
        return (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse flex-1"></div>
              </div>
            ))}
          </div>
        );
      
      case 'ai-conversation':
        return (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-4/5"></div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-800 rounded animate-pulse w-5/6"></div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="h-20 bg-gray-800 rounded animate-pulse"></div>
        );
    }
  };

  return (
    <div className="relative p-4 rounded-lg bg-dark-primary/50 border border-gray-800/50">
      <div className="absolute top-2 right-2 flex gap-1">
        <div className="w-8 h-8 bg-gray-800/50 rounded animate-pulse"></div>
        <div className="w-8 h-8 bg-gray-800/50 rounded animate-pulse"></div>
      </div>
      {getSkeletonContent()}
    </div>
  );
};

export default BlockSkeleton;