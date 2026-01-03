import { useState, useEffect, useRef } from 'react';
import { useResponsive } from '@/shared/hooks';
import { useTouchGestures } from '@/shared/hooks';
import ExpandedViewEnhanced from './ExpandedViewEnhanced';
import MobileDocumentHeader from './MobileDocumentHeader';
import MobileBottomSheet from './MobileBottomSheet';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileDocumentViewer({ 
  entry, 
  onClose, 
  onUpdate, 
  allEntries = [],
  onNavigateToDocument 
}) {
  const { isMobile, isTablet, getSafeAreaInsets } = useResponsive();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = useRef(null);
  const safeAreaInsets = getSafeAreaInsets();
  
  // Determine if we should use mobile view
  const useMobileView = isMobile || (isTablet && window.innerWidth < 1024);
  
  // Handle scroll to show/hide header
  useEffect(() => {
    const scrollElement = scrollContainerRef.current;
    if (!scrollElement || !useMobileView) return;
    
    const handleScroll = () => {
      const currentScrollY = scrollElement.scrollTop;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide header
        setHeaderVisible(false);
      } else {
        // Scrolling up - show header
        setHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, useMobileView]);
  
  // Handle swipe gestures for document navigation
  const handleSwipeLeft = () => {
    const currentIndex = allEntries.findIndex(e => e.id === entry.id);
    if (currentIndex < allEntries.length - 1 && onNavigateToDocument) {
      const nextEntry = allEntries[currentIndex + 1];
      onNavigateToDocument(nextEntry);
    }
  };
  
  const handleSwipeRight = () => {
    const currentIndex = allEntries.findIndex(e => e.id === entry.id);
    if (currentIndex > 0 && onNavigateToDocument) {
      const prevEntry = allEntries[currentIndex - 1];
      onNavigateToDocument(prevEntry);
    }
  };
  
  useTouchGestures(scrollContainerRef, {
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    swipeThreshold: 80,
    swipeVelocityThreshold: 0.5,
  });
  
  
  // Create refs to interact with ExpandedViewEnhanced
  const expandedViewRef = useRef(null);
  
  // Action handlers
  const handleShare = () => {
    setShowActionSheet(false);
    // Trigger share in ExpandedViewEnhanced
    if (expandedViewRef.current?.handleShare) {
      expandedViewRef.current.handleShare();
    }
  };
  
  const handleDelete = () => {
    setShowActionSheet(false);
    // Trigger delete in ExpandedViewEnhanced
    if (expandedViewRef.current?.handleDelete) {
      expandedViewRef.current.handleDelete();
    }
  };
  
  const handleViewModeChange = (mode) => {
    setShowActionSheet(false);
    // Trigger view mode change in ExpandedViewEnhanced
    if (expandedViewRef.current?.handleViewModeChange) {
      expandedViewRef.current.handleViewModeChange(mode);
    }
  };
  
  // If not mobile/tablet, render the regular desktop view
  if (!useMobileView) {
    return (
      <ExpandedViewEnhanced 
        entry={entry}
        onClose={onClose}
        onUpdate={onUpdate}
        allEntries={allEntries}
      />
    );
  }
  
  // Mobile view layout
  return (
    <div className="fixed inset-0 bg-dark-primary flex flex-col">
      {/* Mobile Header */}
      <AnimatePresence>
        {headerVisible && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ paddingTop: safeAreaInsets.top }}
          >
            <MobileDocumentHeader
              title={entry.title}
              onBack={onClose}
              onMenuClick={() => setShowActionSheet(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Document Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ 
          paddingBottom: safeAreaInsets.bottom + 20, // Extra space for last block
        }}
      >
        <ExpandedViewEnhanced
          ref={expandedViewRef}
          entry={entry}
          onClose={onClose}
          onUpdate={onUpdate}
          allEntries={allEntries}
          isMobileView={true}
          scrollContainerRef={scrollContainerRef}
          onActionSheetOpen={() => setShowActionSheet(true)}
        />
      </div>
      
      {/* Swipe Indicators */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
        <AnimatePresence>
          {allEntries.findIndex(e => e.id === entry.id) > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 0.2, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-text-secondary"
            >
              <svg width="8" height="40" viewBox="0 0 8 40" fill="currentColor">
                <path d="M8 0 L0 20 L8 40" opacity="0.3" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {allEntries.findIndex(e => e.id === entry.id) < allEntries.length - 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0.2, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-text-secondary"
            >
              <svg width="8" height="40" viewBox="0 0 8 40" fill="currentColor">
                <path d="M0 0 L8 20 L0 40" opacity="0.3" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      
      {/* Action Sheet for Menu Options */}
      <MobileBottomSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Document Actions"
        height="auto"
        showHandle={true}
      >
        <div className="space-y-2 p-4 pb-6">
          <button
            onClick={handleShare}
            className="w-full p-4 bg-dark-secondary rounded-xl text-left 
                     hover:bg-dark-secondary/80 active:scale-98 transition-all
                     flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 8.048c.516-.674.8-1.5.8-2.388 0-.888-.284-1.714-.8-2.388m-9.632 0c.516-.674.8-1.5.8-2.388 0-.888-.284-1.714-.8-2.388m0 0C9.482 5.114 9.938 5 10.42 5c.482 0 .938.114 1.342.316m-2.684 0a3 3 0 012.684 0m9.632 8.052a3 3 0 010 2.684m0-2.684a3 3 0 00-2.684 0m0 0a3 3 0 010 2.684" />
              </svg>
            </div>
            <span className="text-text-primary">Share Document</span>
          </button>
          
          <button
            onClick={() => handleViewModeChange('toggle')}
            className="w-full p-4 bg-dark-secondary rounded-xl text-left 
                     hover:bg-dark-secondary/80 active:scale-98 transition-all
                     flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <span className="text-text-primary">Toggle View Mode</span>
          </button>
          
          <button
            onClick={handleDelete}
            className="w-full p-4 bg-red-500/10 rounded-xl text-left 
                     hover:bg-red-500/20 active:scale-98 transition-all
                     flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <span className="text-red-400">Delete Document</span>
          </button>
          
          {/* Cancel button for better UX */}
          <button
            onClick={() => setShowActionSheet(false)}
            className="w-full p-4 bg-dark-secondary/50 rounded-xl text-left 
                     hover:bg-dark-secondary/70 active:scale-98 transition-all
                     flex items-center justify-center mt-4"
          >
            <span className="text-text-secondary">Cancel</span>
          </button>
        </div>
      </MobileBottomSheet>
      
    </div>
  );
}