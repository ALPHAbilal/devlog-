import { ArrowLeft, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileDocumentHeader({ title, onBack, onMenuClick }) {
  return (
    <header className="bg-dark-primary/95 backdrop-blur-xl border-b border-dark-secondary/30">
      <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary 
                     hover:bg-dark-secondary/50 rounded-lg transition-all
                     active:scale-95 touch-manipulation"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        
        {/* Title */}
        <h1 className="flex-1 mx-3 text-text-primary text-base font-medium 
                       truncate text-center">
          {title}
        </h1>
        
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 -mr-2 text-text-secondary hover:text-text-primary 
                     hover:bg-dark-secondary/50 rounded-lg transition-all
                     active:scale-95 touch-manipulation"
          aria-label="Document actions"
        >
          <MoreVertical size={20} />
        </button>
      </div>
      
      {/* Subtle gradient border */}
      <div className="absolute bottom-0 left-0 right-0 h-px 
                      bg-gradient-to-r from-transparent via-dark-secondary/50 to-transparent" />
    </header>
  );
}