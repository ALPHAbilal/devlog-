import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileBlockDivider({ onAdd }) {
  return (
    <motion.div 
      className="relative py-3 -my-1 touch-manipulation"
      whileTap={{ scale: 0.98 }}
    >
      {/* Always visible touch target - minimum 44px height for accessibility */}
      <button
        onClick={onAdd}
        className="w-full h-12 flex items-center justify-center group relative touch-manipulation"
        aria-label="Add block here"
      >
        {/* Background line */}
        <div className="absolute inset-x-4 h-px bg-gradient-to-r from-transparent via-dark-secondary/30 to-transparent" />
        
        {/* Plus button - always visible on mobile with better contrast */}
        <div className="relative bg-dark-primary border border-dark-secondary/60 
                       text-text-secondary/70 rounded-full w-9 h-9 
                       flex items-center justify-center
                       transition-all duration-200
                       group-active:scale-90 group-active:bg-dark-secondary/60
                       group-active:border-accent-green/60 group-active:text-accent-green
                       shadow-sm hover:border-dark-secondary hover:text-text-secondary">
          <Plus size={20} strokeWidth={2} />
        </div>
      </button>
    </motion.div>
  );
}