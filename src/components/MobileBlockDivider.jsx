import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileBlockDivider({ onAdd }) {
  return (
    <motion.div 
      className="relative py-3 -my-1 touch-manipulation"
      whileTap={{ scale: 0.98 }}
    >
      {/* Always visible touch target */}
      <button
        onClick={onAdd}
        className="w-full h-11 flex items-center justify-center group relative"
        aria-label="Add block here"
      >
        {/* Background line */}
        <div className="absolute inset-x-4 h-px bg-gradient-to-r from-transparent via-dark-secondary/30 to-transparent" />
        
        {/* Plus button - always visible on mobile */}
        <div className="relative bg-dark-primary border border-dark-secondary/50 
                       text-text-secondary/60 rounded-full w-8 h-8 
                       flex items-center justify-center
                       transition-all duration-200
                       group-active:scale-90 group-active:bg-dark-secondary/50
                       group-active:border-accent-green/50 group-active:text-accent-green
                       shadow-sm">
          <Plus size={18} strokeWidth={2} />
        </div>
      </button>
    </motion.div>
  );
}