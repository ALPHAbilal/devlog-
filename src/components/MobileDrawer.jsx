import { useEffect, useRef, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTouchGestures } from '@/shared/hooks';
import { lockBodyScroll, unlockBodyScroll } from '@/shared/lib';

/**
 * MobileDrawer Component
 * A touch-friendly drawer component with swipe gestures and smooth animations
 */
export default function MobileDrawer({ 
  isOpen, 
  onClose, 
  position = 'left',
  width = '80%',
  maxWidth = '320px',
  children,
  title,
  showOverlay = true,
  closeOnOverlayClick = true,
  enableSwipeToClose = true,
  className = '',
}) {
  const drawerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }

    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  // Touch gestures for swipe to close
  const swipeDirection = position === 'left' ? 'onSwipeLeft' : 'onSwipeRight';
  
  useTouchGestures(drawerRef, {
    [swipeDirection]: enableSwipeToClose ? () => {
      onClose();
    } : undefined,
    swipeThreshold: 100,
  });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Animation variants
  const drawerVariants = {
    closed: {
      x: position === 'left' ? '-100%' : '100%',
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    },
    open: {
      x: dragOffset,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    },
  };

  const overlayVariants = {
    closed: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
    open: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Handle drag for swipe gestures
  const handleDragEnd = (event, info) => {
    const threshold = 100;
    const velocity = 500;
    
    const shouldClose = position === 'left' 
      ? (info.offset.x < -threshold || info.velocity.x < -velocity)
      : (info.offset.x > threshold || info.velocity.x > velocity);

    if (shouldClose && enableSwipeToClose) {
      onClose();
    } else {
      setDragOffset(0);
    }
    
    setIsDragging(false);
  };

  const handleDrag = (event, info) => {
    if (position === 'left' && info.offset.x < 0) {
      setDragOffset(info.offset.x);
    } else if (position === 'right' && info.offset.x > 0) {
      setDragOffset(info.offset.x);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          {showOverlay && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              onClick={closeOnOverlayClick ? onClose : undefined}
              className="fixed inset-0 bg-black/50 z-40"
              style={{ touchAction: 'none' }}
            />
          )}

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial="closed"
            animate="open"
            exit="closed"
            variants={drawerVariants}
            drag={enableSwipeToClose ? "x" : false}
            dragConstraints={position === 'left' ? { right: 0 } : { left: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className={`fixed top-0 ${position}-0 h-full bg-dark-primary z-50 
                       shadow-2xl flex flex-col ${className}`}
            style={{ 
              width,
              maxWidth,
              touchAction: isDragging ? 'none' : 'pan-y',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-secondary">
              {title && (
                <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
              )}
              <button
                onClick={onClose}
                className="ml-auto p-2 text-text-secondary hover:text-text-primary 
                           hover:bg-dark-secondary rounded-lg transition-colors 
                           touch-target-small"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto momentum-scroll">
              {children}
            </div>

            {/* Swipe indicator */}
            {enableSwipeToClose && (
              <div className="absolute top-1/2 -translate-y-1/2 
                              ${position === 'left' ? 'right-2' : 'left-2'}">
                <div className="bg-dark-secondary/50 rounded-full p-1">
                  <ChevronRight 
                    size={16} 
                    className={`text-text-secondary ${position === 'right' ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sub-components for common drawer patterns

// Navigation item for mobile drawer
export function DrawerNavItem({ icon: Icon, label, onClick, isActive, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${isActive 
                    ? 'bg-accent-green/20 text-accent-green border-l-4 border-accent-green' 
                    : 'text-text-secondary hover:bg-dark-secondary hover:text-text-primary'}`}
    >
      {Icon && <Icon size={20} />}
      <span className="flex-1 font-medium">{label}</span>
      {badge && (
        <span className="px-2 py-1 text-xs bg-accent-green/20 text-accent-green rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

// Section divider for drawer
export function DrawerSection({ title, children }) {
  return (
    <div className="py-2">
      {title && (
        <h3 className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// Drawer footer for actions
export function DrawerFooter({ children, className = '' }) {
  return (
    <div className={`p-4 border-t border-dark-secondary bg-dark-secondary/30 ${className}`}>
      {children}
    </div>
  );
}

// Example usage component
export function NavigationDrawer({ isOpen, onClose, currentPath, onNavigate }) {
  return (
    <MobileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Menu"
      position="left"
    >
      <DrawerSection>
        <DrawerNavItem
          icon={Home}
          label="Dashboard"
          isActive={currentPath === '/dashboard'}
          onClick={() => {
            onNavigate('/dashboard');
            onClose();
          }}
        />
        <DrawerNavItem
          icon={FileText}
          label="Documents"
          isActive={currentPath === '/documents'}
          onClick={() => {
            onNavigate('/documents');
            onClose();
          }}
          badge="12"
        />
        <DrawerNavItem
          icon={Settings}
          label="Settings"
          isActive={currentPath === '/settings'}
          onClick={() => {
            onNavigate('/settings');
            onClose();
          }}
        />
      </DrawerSection>

      <DrawerSection title="Recent">
        <div className="px-4 py-2 text-sm text-text-secondary">
          Your recent documents will appear here
        </div>
      </DrawerSection>

      <DrawerFooter>
        <button className="w-full py-2 bg-accent-green text-dark-primary rounded-lg 
                          font-medium hover:bg-accent-green/80 transition-colors">
          Create New Document
        </button>
      </DrawerFooter>
    </MobileDrawer>
  );
}

// Icons for example (import actual icons in real usage)
function Home({ size }) {
  return <div style={{ width: size, height: size }} className="bg-text-secondary rounded" />;
}

function FileText({ size }) {
  return <div style={{ width: size, height: size }} className="bg-text-secondary rounded" />;
}

function Settings({ size }) {
  return <div style={{ width: size, height: size }} className="bg-text-secondary rounded" />;
}