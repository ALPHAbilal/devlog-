import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InteractionHints({ show = true }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  useEffect(() => {
    // Check if user has seen hints before
    const hasSeenHints = localStorage.getItem('hero-animation-hints-seen');
    if (!hasSeenHints && show) {
      setTimeout(() => setIsVisible(true), 2000);
    }
    
    // Hide hints after first interaction
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        localStorage.setItem('hero-animation-hints-seen', 'true');
        setTimeout(() => setIsVisible(false), 500);
      }
    };
    
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [show, hasInteracted]);
  
  const hints = [
    { key: 'Space', action: 'Explosion', icon: '💥' },
    { key: 'V', action: 'Vortex', icon: '🌀' },
    { key: 'W', action: 'Wave', icon: '🌊' },
    { key: 'Click', action: 'Ripple', icon: '💫' },
    { key: 'Move', action: 'Interact', icon: '✨' }
  ];
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="interaction-hints"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="hints-container">
            {hints.map((hint, index) => (
              <motion.div
                key={hint.key}
                className="hint-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="hint-icon">{hint.icon}</span>
                <kbd className="hint-key">{hint.key}</kbd>
                <span className="hint-action">{hint.action}</span>
              </motion.div>
            ))}
          </div>
          <motion.p 
            className="hint-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.5 }}
          >
            Try these interactions!
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}