/**
 * Lazy-loaded component definitions
 * 
 * Uses React.lazy for code splitting to reduce initial bundle size
 */

import { lazy, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy load heavy components
export const DocumentEditor = lazy(() => 
  import('./DocumentEditor').then(module => ({
    default: module.DocumentEditor
  }))
);

export const MarkdownRenderer = lazy(() => 
  import('./MarkdownRenderer')
);

export const CodeEditor = lazy(() => 
  import('./CodeEditor').then(module => ({
    default: module.CodeEditor
  }))
);

export const ImageGallery = lazy(() => 
  import('./ImageGallery').then(module => ({
    default: module.ImageGallery
  }))
);

export const SearchModal = lazy(() => 
  import('./SearchModal').then(module => ({
    default: module.SearchModal
  }))
);

export const TemplateGallery = lazy(() => 
  import('./TemplateGallery').then(module => ({
    default: module.TemplateGallery
  }))
);

export const ExportDialog = lazy(() => 
  import('./ExportDialog').then(module => ({
    default: module.ExportDialog
  }))
);

export const SettingsPanel = lazy(() => 
  import('./SettingsPanel').then(module => ({
    default: module.SettingsPanel
  }))
);

/**
 * Wrapper component for lazy-loaded components
 * @param {React.Component} Component - Lazy component
 * @param {Object} props - Component props
 * @param {React.Component} fallback - Custom fallback component
 */
export function LazyWrapper({ Component, fallback, ...props }) {
  const FallbackComponent = fallback || LoadingSpinner;
  
  return (
    <Suspense fallback={<FallbackComponent />}>
      <Component {...props} />
    </Suspense>
  );
}

/**
 * Preload a lazy component
 * @param {Promise} lazyComponent - Lazy component promise
 */
export function preloadComponent(lazyComponent) {
  // Trigger the dynamic import without rendering
  if (lazyComponent._ctor) {
    lazyComponent._ctor();
  }
}

/**
 * HOC to add lazy loading to any component
 * @param {Function} importFunc - Dynamic import function
 * @param {React.Component} fallback - Fallback component
 */
export function withLazyLoading(importFunc, fallback) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyLoadedComponent(props) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}