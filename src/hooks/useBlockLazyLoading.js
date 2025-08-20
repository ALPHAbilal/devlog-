import { useState, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';
import { isEnabled } from '../config/featureFlags';

/**
 * Hook for implementing lazy loading on heavy blocks
 * Only renders full block content when visible
 */
export function useBlockLazyLoading(blockType, options = {}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  
  // Check if lazy loading is enabled
  const lazyLoadingEnabled = isEnabled('blockLazyLoading');
  
  // Determine if this block type is heavy and needs lazy loading
  const isHeavyBlock = [
    'version-track',
    'issue-tracker', 
    'ai',
    'filetree'
  ].includes(blockType);

  const { targetRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: lazyLoadingEnabled ? '200px' : '0px', // Start loading 200px before visible
    ...options
  });

  useEffect(() => {
    if (!lazyLoadingEnabled || !isHeavyBlock) {
      // If lazy loading is disabled or block is not heavy, render immediately
      setShouldRender(true);
      setHasRendered(true);
    } else if (isHeavyBlock && isVisible && !hasRendered) {
      // Add small delay to prevent flashing during fast scrolling
      const timer = setTimeout(() => {
        setShouldRender(true);
        setHasRendered(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [lazyLoadingEnabled, isHeavyBlock, isVisible, hasRendered]);

  // Provide a loading state for heavy blocks
  const isLoading = lazyLoadingEnabled && isHeavyBlock && !shouldRender && !hasRendered;
  
  return {
    targetRef,
    shouldRender: shouldRender || !isHeavyBlock || !lazyLoadingEnabled,
    isLoading,
    isVisible,
    isHeavyBlock: lazyLoadingEnabled && isHeavyBlock
  };
}

/**
 * Hook for progressive content loading within blocks
 * Used for blocks with multiple content sections
 */
export function useProgressiveContent(contentSections = [], options = {}) {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const { targetRef, isVisible } = useIntersectionObserver(options);

  useEffect(() => {
    if (isVisible && contentSections.length > 0) {
      // Progressive loading: show first section immediately, then others with delay
      setVisibleSections(new Set([0]));
      
      // Load remaining sections progressively
      contentSections.slice(1).forEach((_, index) => {
        const actualIndex = index + 1;
        const delay = actualIndex * 100; // 100ms between each section
        
        setTimeout(() => {
          setVisibleSections(prev => new Set([...prev, actualIndex]));
        }, delay);
      });
    }
  }, [isVisible, contentSections.length]);

  const isSectionVisible = useCallback((index) => {
    return visibleSections.has(index);
  }, [visibleSections]);

  return {
    targetRef,
    isSectionVisible,
    isVisible,
    allSectionsLoaded: visibleSections.size === contentSections.length
  };
}