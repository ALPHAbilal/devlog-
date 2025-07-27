import { useState, useEffect } from 'react';
import { Plus, FileText, Folder, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileFAB({ onCreateDocument, onCreateFolder, onCreateProject }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide FAB on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    const throttledScroll = () => {
      window.requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [lastScrollY]);

  const fabVariants = {
    hidden: { 
      scale: 0,
      opacity: 0,
      y: 100
    },
    visible: { 
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  };

  const menuItemVariants = {
    hidden: { 
      scale: 0,
      opacity: 0,
      y: 20
    },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    })
  };

  const actions = [
    {
      icon: FileText,
      label: 'New Document',
      color: 'bg-accent-green',
      onClick: () => {
        onCreateDocument();
        setIsOpen(false);
      }
    },
    {
      icon: Folder,
      label: 'New Folder',
      color: 'bg-blue-500',
      onClick: () => {
        onCreateFolder();
        setIsOpen(false);
      }
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-3 items-end">
              {actions.map((action, i) => (
                <motion.div
                  key={action.label}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={menuItemVariants}
                  className="flex items-center gap-3"
                >
                  <span className="bg-dark-secondary/90 backdrop-blur-sm px-3 py-1.5 
                                   rounded-full text-sm text-text-primary whitespace-nowrap
                                   border border-dark-secondary/50">
                    {action.label}
                  </span>
                  <button
                    onClick={action.onClick}
                    className={`${action.color} w-12 h-12 rounded-full flex items-center 
                               justify-center shadow-lg active:scale-95 transition-transform`}
                  >
                    <action.icon size={20} className="text-white" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          variants={fabVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center
                     shadow-xl active:scale-95 transition-all duration-200
                     ${isOpen 
                       ? 'bg-red-500 hover:bg-red-600' 
                       : 'bg-accent-green hover:bg-accent-green/90'}`}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X size={24} className="text-white" /> : <Plus size={24} className="text-white" />}
          </motion.div>
          
          {/* Ripple effect on touch */}
          <span className="absolute inset-0 rounded-full overflow-hidden">
            <span className="absolute inset-0 rounded-full bg-white/20 
                           transform scale-0 group-active:scale-100 
                           transition-transform duration-300" />
          </span>
        </motion.button>
      </div>
    </>
  );
}