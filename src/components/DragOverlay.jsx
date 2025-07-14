import React from 'react';
import { FileText, Files } from 'lucide-react';

export default function CustomDragOverlay({ documents = [] }) {
  const count = documents.length;
  const isMultiple = count > 1;

  return (
    <div className="relative pointer-events-none">
      {/* Main drag preview card */}
      <div className={`
        bg-surface-2 rounded-lg shadow-2xl border border-accent-green/50
        p-4 transform rotate-3 transition-all duration-200
        ${isMultiple ? 'scale-95' : ''}
      `}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            {isMultiple ? (
              <Files size={24} className="text-accent-green" />
            ) : (
              <FileText size={24} className="text-accent-green" />
            )}
            {isMultiple && (
              <div className="absolute -bottom-1 -right-1 bg-accent-green text-dark-primary 
                            rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {count}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-text-primary font-medium truncate">
              {isMultiple ? `${count} documents` : documents[0]?.title || 'Document'}
            </h4>
            {!isMultiple && documents[0]?.preview && (
              <p className="text-text-secondary text-sm truncate mt-0.5">
                {documents[0].preview}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stacked cards effect for multiple documents */}
      {isMultiple && (
        <>
          <div className="absolute inset-0 bg-surface-2 rounded-lg -rotate-3 -z-10 
                        shadow-lg border border-surface-3 transform scale-90" />
          <div className="absolute inset-0 bg-surface-1 rounded-lg rotate-6 -z-20 
                        shadow-md border border-surface-3 transform scale-85" />
        </>
      )}

      {/* Animated pulse effect */}
      <div className="absolute inset-0 rounded-lg animate-pulse bg-accent-green/10 -z-30 scale-110" />
    </div>
  );
}