import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MobileTabNavigation({ tabs, activeTab, onTabChange }) {
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const scrollContainerRef = useRef(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Check scroll indicators
  const checkScrollIndicators = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftIndicator(scrollLeft > 0);
      setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollIndicators();
    window.addEventListener('resize', checkScrollIndicators);
    return () => window.removeEventListener('resize', checkScrollIndicators);
  }, [tabs]);

  // Touch handlers for swipe gestures
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        onTabChange(tabs[currentIndex + 1].id);
        // Haptic feedback on supported devices
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right - go to previous tab
        onTabChange(tabs[currentIndex - 1].id);
        // Haptic feedback
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10);
        }
      }
    }
  };

  // Scroll to active tab
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeTabElement = scrollContainerRef.current.querySelector('.tab.active');
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  }, [activeTab]);

  return (
    <div className="mobile-tab-navigation">
      {/* Left scroll indicator */}
      <div className={`scroll-indicator left ${showLeftIndicator ? 'visible' : ''}`}>
        <ChevronLeft size={16} />
      </div>

      {/* Tab container */}
      <div
        ref={scrollContainerRef}
        className="tab-scroll-container"
        onScroll={checkScrollIndicators}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="tab-list">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                onTabChange(tab.id);
                // Haptic feedback
                if (window.navigator.vibrate) {
                  window.navigator.vibrate(10);
                }
              }}
            >
              <tab.icon size={20} />
              <span className="tab-label">{tab.label}</span>
              {/* Active indicator */}
              <div className="tab-indicator" />
            </button>
          ))}
        </div>
      </div>

      {/* Right scroll indicator */}
      <div className={`scroll-indicator right ${showRightIndicator ? 'visible' : ''}`}>
        <ChevronRight size={16} />
      </div>

      {/* Swipe hint (shown briefly on first load) */}
      <div className="swipe-hint">
        <span>Swipe to navigate tabs</span>
      </div>
    </div>
  );
}