import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileFloatingActionButton({ onClick, style = {} }) {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <motion.button
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="fixed z-50 w-14 h-14 bg-accent-green rounded-full shadow-lg
                 flex items-center justify-center text-dark-primary
                 active:scale-95 transition-transform duration-150
                 touch-manipulation"
      style={style}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Ripple effect */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      
      {/* Shadow glow */}
      <div className="absolute inset-0 rounded-full bg-accent-green/30 blur-xl -z-10" />
      
      {/* Icon */}
      <Plus size={24} strokeWidth={2.5} className="relative z-10" />
      
      {/* Haptic feedback simulation */}
      {isPressed && (
        <style jsx>{`
          @keyframes haptic {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(0.97); }
          }
          button { animation: haptic 0.1s ease-out; }
        `}</style>
      )}
    </motion.button>
  );
}