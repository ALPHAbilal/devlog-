# Barrel File Audit Report

> Generated: 2026-01-02T12:36:55.922Z

## Summary

| Metric | Value |
|--------|-------|
| Barrels analyzed | 38 |
| Total issues | 172 |
| Critical (errors) | 172 |
| Warnings | 0 |
| Affected consumers | 42 |

## Quick Fixes

Copy and apply these fixes to resolve all critical issues:

### `src/features/analytics/api/index.ts`

```typescript
// Fix: wrong_source - AnalyticsService
export { default as AnalyticsService } from './service';
// Fix: wrong_source - analytics
export { default as analytics } from './service';
```

### `src/features/analytics/index.ts`

```typescript
// Fix: wrong_source - useAnalytics
// Available exports: none
// Fix: wrong_source - useDocumentAnalytics
// Available exports: none
// Fix: wrong_source - usePerformanceTracking
// Available exports: none
// Fix: missing_export - getAnalytics
// Could not find source for getAnalytics
// Fix: missing_export - ConsentManager
// Could not find source for ConsentManager
// Fix: missing_export - getAnalytics
// Could not find source for getAnalytics
// Fix: missing_export - getAnalytics
// Could not find source for getAnalytics
```

### `src/features/analytics/lib/index.ts`

```typescript
// Fix: wrong_source - analyticsConsent
// Available exports: ConsentManager
// Fix: wrong_source - hasConsent
// Available exports: ConsentManager
// Fix: wrong_source - setConsent
// Available exports: ConsentManager
// Fix: wrong_source - loadAnalyticsScript
// Available exports: loadGtagScript, isGtagLoaded
```

### `src/features/block/hooks/index.ts`

```typescript
// Fix: wrong_source - useMemoryManagement
// Available exports: useCanvasCleanup, useBlockMemoryManagement, useMemoryMonitor
```

### `src/features/block/index.ts`

```typescript
// Fix: missing_export - useGlobalAutoSave
// Could not find source for useGlobalAutoSave
// Fix: missing_export - useBlockLazyLoading
// Could not find source for useBlockLazyLoading
// Fix: missing_export - useOptimizedBlockLoader
// Could not find source for useOptimizedBlockLoader
// Fix: missing_export - usePaginatedBlockLoader
// Could not find source for usePaginatedBlockLoader
// Fix: missing_export - getSmartSyncManager
// Could not find source for getSmartSyncManager
// Fix: missing_export - serializeBlock
// Could not find source for serializeBlock
// Fix: missing_export - deserializeBlock
// Could not find source for deserializeBlock
// Fix: missing_export - deserializeBlock
// Could not find source for deserializeBlock
// Fix: missing_export - useAutoSave
// Could not find source for useAutoSave
```

### `src/features/block/lib/index.ts`

```typescript
// Fix: wrong_source - blockSerializer
export { default as blockSerializer } from './serializer';
```

### `src/features/document/index.ts`

```typescript
// Fix: missing_export - useFolders
// Could not find source for useFolders
// Fix: missing_export - useFolders
// Could not find source for useFolders
// Fix: missing_export - useFolders
// Could not find source for useFolders
// Fix: missing_export - useDocumentOrganization
// Could not find source for useDocumentOrganization
// Fix: missing_export - useFolders
// Could not find source for useFolders
// Fix: missing_export - usePaginatedDashboard
// Could not find source for usePaginatedDashboard
```

### `src/features/share/api/index.ts`

```typescript
// Fix: wrong_source - shareDocument
// Available exports: ShareService, shareService
// Fix: wrong_source - revokeShare
// Available exports: ShareService, shareService
// Fix: wrong_source - getShareInfo
// Available exports: ShareService, shareService
```

### `src/features/share/index.ts`

```typescript
// Fix: missing_export - sophisticatedShareService
// Could not find source for sophisticatedShareService
// Fix: missing_export - shareService
// Could not find source for shareService
// Fix: missing_export - shareService
// Could not find source for shareService
// Fix: missing_export - shareService
// Could not find source for shareService
// Fix: missing_export - shareService
// Could not find source for shareService
// Fix: missing_export - shareService
// Could not find source for shareService
// Fix: missing_export - shareService
// Could not find source for shareService
// Fix: missing_export - shareService
// Could not find source for shareService
```

### `src/features/storage/index.ts`

```typescript
// Fix: missing_export - useSmartSync
// Could not find source for useSmartSync
// Fix: missing_export - useMultiLayerStorage
// Could not find source for useMultiLayerStorage
// Fix: missing_export - useProjectStructure
// Could not find source for useProjectStructure
// Fix: missing_export - useProjectStructure
// Could not find source for useProjectStructure
// Fix: missing_export - useSmartDatabaseUsage
// Could not find source for useSmartDatabaseUsage
// Fix: missing_export - createSmartSync
// Could not find source for createSmartSync
// Fix: missing_export - createSmartSync
// Could not find source for createSmartSync
// Fix: missing_export - useSmartDatabaseUsage
// Could not find source for useSmartDatabaseUsage
```

### `src/features/storage/lib/index.ts`

```typescript
// Fix: wrong_source - SmartSync
export { default as SmartSync } from './smart-sync';
// Fix: wrong_source - RealtimeManager
export { default as RealtimeManager } from './realtime-manager';
// Fix: wrong_source - exportData
// Available exports: exportSupabaseData, importSupabaseData
// Fix: wrong_source - exportToJSON
// Available exports: exportSupabaseData, importSupabaseData
// Fix: wrong_source - exportToCSV
// Available exports: exportSupabaseData, importSupabaseData
```

### `src/shared/hooks/index.ts`

```typescript
// Fix: wrong_source - usePerformance
// Available exports: useDebounce, useThrottle, useIntersectionObserver, useIdleCallback, useViewportSize, useMediaQuery, usePrefetch, useVirtualScroll, useProgressiveImage, useNetworkStatus
// Fix: wrong_source - toast
// Available exports: ToastProvider, useToast
```

### `src/shared/lib/auth/index.ts`

```typescript
// Fix: wrong_source - clearAuthStorage
// Available exports: clearCorruptedAuthStorage
// Fix: missing_export - getURL
export { getURL } from './utils';
// Fix: missing_export - getURL
export { getURL } from './utils';
// Fix: missing_export - getURL
export { getURL } from './utils';
```

### `src/shared/lib/index.ts`

```typescript
// Fix: wrong_source - LRUCache
// Available exports: none
// Fix: wrong_source - cn
// Available exports: none
// Fix: wrong_source - eventBus
// Available exports: none
// Fix: wrong_source - EVENT_TYPES
// Available exports: none
// Fix: wrong_source - storageWrapper
// Available exports: none
// Fix: wrong_source - deleteEntry
// Available exports: none
// Fix: wrong_source - MultiLayerStorage
// Available exports: none
// Fix: wrong_source - SyncEngine
// Available exports: none
// Fix: wrong_source - StorageLRUCache
// Available exports: none
// Fix: wrong_source - SecureStorage
// Available exports: none
// Fix: wrong_source - SessionCache
// Available exports: none
// Fix: wrong_source - IndexedDBAdapter
// Available exports: none
// Fix: wrong_source - SupabaseAdapterOptimized
// Available exports: none
// Fix: wrong_source - CompressedStorageAdapter
// Available exports: none
// Fix: wrong_source - DataIntegrityManager
// Available exports: none
// Fix: wrong_source - LockManager
// Available exports: none
// Fix: wrong_source - CircuitBreaker
// Available exports: none
// Fix: wrong_source - RecoveryManager
// Available exports: none
// Fix: wrong_source - TransactionManager
// Available exports: none
// Fix: wrong_source - sanitize
// Available exports: SanitizeType, sanitizeConfig, sanitizeInput, sanitizeTitle, sanitizeTags, sanitizeBlock, sanitizeDocument, sanitizeSearchQuery, createSafeElement, sanitizeURL, DOMPurify
// Fix: wrong_source - sanitizeForStorage
// Available exports: SanitizeType, sanitizeConfig, sanitizeInput, sanitizeTitle, sanitizeTags, sanitizeBlock, sanitizeDocument, sanitizeSearchQuery, createSafeElement, sanitizeURL, DOMPurify
// Fix: wrong_source - markdownConverter
// Available exports: none
// Fix: wrong_source - parseMarkdown
// Available exports: none
// Fix: wrong_source - InlineMarkdown
// Available exports: none
// Fix: wrong_source - uploadImage
// Available exports: none
// Fix: wrong_source - deleteImage
// Available exports: none
// Fix: wrong_source - setupImageStorage
// Available exports: none
// Fix: wrong_source - extractLinks
// Available exports: none
// Fix: wrong_source - extractAllLinks
// Available exports: none
// Fix: wrong_source - patchQuerySelector
// Available exports: none
// Fix: missing_export - initMonitoring
// Could not find source for initMonitoring
// Fix: missing_export - setUserContext
// Could not find source for setUserContext
// Fix: missing_export - preloadResources
// Could not find source for preloadResources
// Fix: missing_export - heroTextReveal
export { heroTextReveal } from './animations';
// Fix: missing_export - magneticHover
export { magneticHover } from './animations';
// Fix: missing_export - liquidMorph
export { liquidMorph } from './animations';
// Fix: missing_export - staggerContainer
export { staggerContainer } from './animations';
// Fix: missing_export - staggerItem
export { staggerItem } from './animations';
// Fix: missing_export - energyPulse
export { energyPulse } from './animations';
// Fix: missing_export - staggerContainer
export { staggerContainer } from './animations';
// Fix: missing_export - staggerItem
export { staggerItem } from './animations';
// Fix: missing_export - staggerContainer
export { staggerContainer } from './animations';
// Fix: missing_export - staggerItem
export { staggerItem } from './animations';
// Fix: missing_export - lockBodyScroll
export { lockBodyScroll } from './responsive';
// Fix: missing_export - unlockBodyScroll
export { unlockBodyScroll } from './responsive';
// Fix: missing_export - fadeInUp
export { fadeInUp } from './animations';
// Fix: missing_export - staggerContainer
export { staggerContainer } from './animations';
// Fix: missing_export - staggerItem
export { staggerItem } from './animations';
// Fix: missing_export - buttonHover
export { buttonHover } from './animations';
// Fix: missing_export - fadeInUp
export { fadeInUp } from './animations';
// Fix: missing_export - problemCardContainer
export { problemCardContainer } from './animations';
// Fix: missing_export - problemCardItem
export { problemCardItem } from './animations';
// Fix: missing_export - iconFloat
export { iconFloat } from './animations';
// Fix: missing_export - debugHelpers
// Could not find source for debugHelpers
// Fix: missing_export - fadeInUp
export { fadeInUp } from './animations';
// Fix: missing_export - staggerContainer
export { staggerContainer } from './animations';
// Fix: missing_export - staggerItem
export { staggerItem } from './animations';
// Fix: missing_export - iconLift
export { iconLift } from './animations';
// Fix: missing_export - buttonHover
export { buttonHover } from './animations';
// Fix: missing_export - featureReveal
export { featureReveal } from './animations';
// Fix: missing_export - tiltEffect
export { tiltEffect } from './animations';
// Fix: missing_export - fadeInUp
export { fadeInUp } from './animations';
// Fix: missing_export - staggerContainer
export { staggerContainer } from './animations';
// Fix: missing_export - staggerItem
export { staggerItem } from './animations';
// Fix: missing_export - fadeInUp
export { fadeInUp } from './animations';
// Fix: missing_export - staggerContainer
export { staggerContainer } from './animations';
// Fix: missing_export - staggerItem
export { staggerItem } from './animations';
// Fix: missing_export - fadeInUp
export { fadeInUp } from './animations';
// Fix: missing_export - staggerContainer
export { staggerContainer } from './animations';
// Fix: missing_export - staggerItem
export { staggerItem } from './animations';
```

### `src/shared/lib/integrity/index.ts`

```typescript
// Fix: wrong_source - DataIntegrityManager
export { default as DataIntegrityManager } from './data-integrity';
// Fix: default_mismatch - default
export { default } from './primary-module';
```

### `src/shared/lib/links/index.ts`

```typescript
// Fix: wrong_source - extractLinks
// Available exports: extractDocumentLinks, getBacklinks
// Fix: wrong_source - extractAllLinks
// Available exports: extractDocumentLinks, getBacklinks
```

### `src/shared/lib/locking/index.ts`

```typescript
// Fix: wrong_source - LockManager
export { default as LockManager } from './lock-manager';
// Fix: default_mismatch - default
export { default } from './primary-module';
```

### `src/shared/lib/markdown/index.ts`

```typescript
// Fix: wrong_source - markdownConverter
// Available exports: markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlainText
// Fix: wrong_source - convertMarkdownToHtml
// Available exports: markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlainText
// Fix: wrong_source - convertHtmlToMarkdown
// Available exports: markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlainText
// Fix: wrong_source - InlineMarkdown
// Available exports: parseMarkdown, detectHeadingMarkdown, processLineBreaksAndLists, extractTagsFromContent
```

### `src/shared/lib/network/index.ts`

```typescript
// Fix: default_mismatch - default
export { default } from './primary-module';
```

### `src/shared/lib/performance/index.ts`

```typescript
// Fix: wrong_source - measureRenderTime
// Available exports: debounce, throttle, preloadResources, createLazyLoader, lazyLoadImages, whenIdle, measurePerformance, batchDOMUpdates, createVirtualList, prefetchData, memoizeWithLimit, observePerformance
// Fix: wrong_source - ResourceLoader
// Available exports: debounce, throttle, preloadResources, createLazyLoader, lazyLoadImages, whenIdle, measurePerformance, batchDOMUpdates, createVirtualList, prefetchData, memoizeWithLimit, observePerformance
// Fix: wrong_source - requestIdleCallback
// Available exports: debounce, throttle, preloadResources, createLazyLoader, lazyLoadImages, whenIdle, measurePerformance, batchDOMUpdates, createVirtualList, prefetchData, memoizeWithLimit, observePerformance
// Fix: wrong_source - cancelIdleCallback
// Available exports: debounce, throttle, preloadResources, createLazyLoader, lazyLoadImages, whenIdle, measurePerformance, batchDOMUpdates, createVirtualList, prefetchData, memoizeWithLimit, observePerformance
// Fix: wrong_source - isLowPowerMode
// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce
// Fix: wrong_source - getDeviceCapabilities
// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce
// Fix: wrong_source - createLazyLoadObserver
// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce
// Fix: wrong_source - createVirtualScroller
// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce
// Fix: wrong_source - measurePerformance
// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce
// Fix: wrong_source - PerformanceMetrics
// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce
// Fix: wrong_source - MobilePerformanceMonitor
// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader
// Fix: wrong_source - mobilePerformance
// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader
// Fix: wrong_source - AdaptiveAnimations
// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader
// Fix: wrong_source - createAdaptiveAnimation
// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader
// Fix: wrong_source - isMobileDevice
// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader
// Fix: wrong_source - isLandscape
// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader
// Fix: wrong_source - isPortrait
// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader
// Fix: wrong_source - getDeviceType
// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader
// Fix: wrong_source - getViewportDimensions
// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader
// Fix: missing_export - createLazyLoader
export { createLazyLoader } from './mobile';
```

### `src/shared/lib/recovery/index.ts`

```typescript
// Fix: wrong_source - RecoveryManager
export { default as RecoveryManager } from './recovery-manager';
// Fix: default_mismatch - default
export { default } from './primary-module';
```

### `src/shared/lib/storage/index.ts`

```typescript
// Fix: wrong_source - optimizedBlockLoader
// Available exports: none
// Fix: wrong_source - OptimizedBlockLoader
// Available exports: none
// Fix: wrong_source - paginatedBlockLoader
// Available exports: none
// Fix: wrong_source - PaginatedBlockLoader
// Available exports: none
```

### `src/shared/lib/transactions/index.ts`

```typescript
// Fix: wrong_source - TransactionManager
export { default as TransactionManager } from './transaction-manager';
// Fix: default_mismatch - default
export { default } from './primary-module';
```

### `src/shared/lib/upload/index.ts`

```typescript
// Fix: wrong_source - uploadImage
// Available exports: uploadImageToSupabase, dataUrlToBlob, compressImage, deleteImageFromSupabase, createImagesBucketIfNotExists
// Fix: wrong_source - deleteImage
// Available exports: uploadImageToSupabase, dataUrlToBlob, compressImage, deleteImageFromSupabase, createImagesBucketIfNotExists
// Fix: wrong_source - generateUniqueFilename
// Available exports: uploadImageToSupabase, dataUrlToBlob, compressImage, deleteImageFromSupabase, createImagesBucketIfNotExists
```

## Detailed Issues

### ✅ `src/app/providers/index.ts`

No issues found.

### ✅ `src/components/sidebar/index.js`

No issues found.

### ✅ `src/components/sidebar/views/index.js`

No issues found.

### ❌ `src/features/analytics/api/index.ts`

**Issues:** 2 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `AnalyticsService` | named export "AnalyticsService" | getAnalytics, default (default) | `export { default as AnalyticsService } from './service';` |
| 🔴 wrong_source | `analytics` | named export "analytics" | getAnalytics, default (default) | `export { default as analytics } from './service';` |

### ❌ `src/features/analytics/index.ts`

**Issues:** 7 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `useAnalytics` | named export "useAnalytics" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `useDocumentAnalytics` | named export "useDocumentAnalytics" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `usePerformanceTracking` | named export "usePerformanceTracking" | nothing | `// Available exports: none` |
| 🔴 missing_export | `getAnalytics` | export { getAnalytics } | not exported | `// Could not find source for getAnalytics` |
| 🔴 missing_export | `ConsentManager` | export { ConsentManager } | not exported | `// Could not find source for ConsentManager` |
| 🔴 missing_export | `getAnalytics` | export { getAnalytics } | not exported | `// Could not find source for getAnalytics` |
| 🔴 missing_export | `getAnalytics` | export { getAnalytics } | not exported | `// Could not find source for getAnalytics` |

**Affected consumers:**

- `src/components/CookieConsentBanner.jsx`
- `src/main.jsx`
- `src/shared/hooks/use-analytics.ts`

### ❌ `src/features/analytics/lib/index.ts`

**Issues:** 4 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `analyticsConsent` | named export "analyticsConsent" | ConsentManager | `// Available exports: ConsentManager` |
| 🔴 wrong_source | `hasConsent` | named export "hasConsent" | ConsentManager | `// Available exports: ConsentManager` |
| 🔴 wrong_source | `setConsent` | named export "setConsent" | ConsentManager | `// Available exports: ConsentManager` |
| 🔴 wrong_source | `loadAnalyticsScript` | named export "loadAnalyticsScript" | loadGtagScript, isGtagLoaded | `// Available exports: loadGtagScript, isGtagLoaded` |

### ❌ `src/features/block/hooks/index.ts`

**Issues:** 1 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `useMemoryManagement` | named export "useMemoryManagement" | useCanvasCleanup, useBlockMemoryManagement, useMemoryMonitor | `// Available exports: useCanvasCleanup, useBlockMemoryManagement, useMemoryMonit` |

### ❌ `src/features/block/index.ts`

**Issues:** 9 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 missing_export | `useGlobalAutoSave` | export { useGlobalAutoSave } | not exported | `// Could not find source for useGlobalAutoSave` |
| 🔴 missing_export | `useBlockLazyLoading` | export { useBlockLazyLoading } | not exported | `// Could not find source for useBlockLazyLoading` |
| 🔴 missing_export | `useOptimizedBlockLoader` | export { useOptimizedBlockLoader } | not exported | `// Could not find source for useOptimizedBlockLoader` |
| 🔴 missing_export | `usePaginatedBlockLoader` | export { usePaginatedBlockLoader } | not exported | `// Could not find source for usePaginatedBlockLoader` |
| 🔴 missing_export | `getSmartSyncManager` | export { getSmartSyncManager } | not exported | `// Could not find source for getSmartSyncManager` |
| 🔴 missing_export | `serializeBlock` | export { serializeBlock } | not exported | `// Could not find source for serializeBlock` |
| 🔴 missing_export | `deserializeBlock` | export { deserializeBlock } | not exported | `// Could not find source for deserializeBlock` |
| 🔴 missing_export | `deserializeBlock` | export { deserializeBlock } | not exported | `// Could not find source for deserializeBlock` |
| 🔴 missing_export | `useAutoSave` | export { useAutoSave } | not exported | `// Could not find source for useAutoSave` |

**Affected consumers:**

- `src/App.jsx`
- `src/components/Block.jsx`
- `src/components/ExpandedViewEnhanced.jsx`
- `src/features/share/api/share-service.ts`
- `src/features/share/api/sophisticated-share.ts`
- `src/pages/Dashboard.jsx`

### ❌ `src/features/block/lib/index.ts`

**Issues:** 1 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `blockSerializer` | named export "blockSerializer" | serializeBlock, deserializeBlock, validateBlock, default (default) | `export { default as blockSerializer } from './serializer';` |

### ✅ `src/features/document/hooks/index.ts`

No issues found.

### ❌ `src/features/document/index.ts`

**Issues:** 6 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 missing_export | `useFolders` | export { useFolders } | not exported | `// Could not find source for useFolders` |
| 🔴 missing_export | `useFolders` | export { useFolders } | not exported | `// Could not find source for useFolders` |
| 🔴 missing_export | `useFolders` | export { useFolders } | not exported | `// Could not find source for useFolders` |
| 🔴 missing_export | `useDocumentOrganization` | export { useDocumentOrganization } | not exported | `// Could not find source for useDocumentOrganization` |
| 🔴 missing_export | `useFolders` | export { useFolders } | not exported | `// Could not find source for useFolders` |
| 🔴 missing_export | `usePaginatedDashboard` | export { usePaginatedDashboard } | not exported | `// Could not find source for usePaginatedDashboard` |

**Affected consumers:**

- `src/components/ProjectExplorer/ProjectExplorer.jsx`
- `src/components/ProjectExplorer/ProjectExplorerRedesigned.jsx`
- `src/components/ProjectExplorer/ProjectExplorerV2.jsx`
- `src/pages/Dashboard.jsx`

### ❌ `src/features/share/api/index.ts`

**Issues:** 3 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `shareDocument` | named export "shareDocument" | ShareService, shareService | `// Available exports: ShareService, shareService` |
| 🔴 wrong_source | `revokeShare` | named export "revokeShare" | ShareService, shareService | `// Available exports: ShareService, shareService` |
| 🔴 wrong_source | `getShareInfo` | named export "getShareInfo" | ShareService, shareService | `// Available exports: ShareService, shareService` |

### ❌ `src/features/share/index.ts`

**Issues:** 8 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 missing_export | `sophisticatedShareService` | export { sophisticatedShareService } | not exported | `// Could not find source for sophisticatedShareService` |
| 🔴 missing_export | `shareService` | export { shareService } | not exported | `// Could not find source for shareService` |
| 🔴 missing_export | `shareService` | export { shareService } | not exported | `// Could not find source for shareService` |
| 🔴 missing_export | `shareService` | export { shareService } | not exported | `// Could not find source for shareService` |
| 🔴 missing_export | `shareService` | export { shareService } | not exported | `// Could not find source for shareService` |
| 🔴 missing_export | `shareService` | export { shareService } | not exported | `// Could not find source for shareService` |
| 🔴 missing_export | `shareService` | export { shareService } | not exported | `// Could not find source for shareService` |
| 🔴 missing_export | `shareService` | export { shareService } | not exported | `// Could not find source for shareService` |

**Affected consumers:**

- `src/components/EnhancedShareDialog.jsx`
- `src/components/ShareAnalytics.jsx`
- `src/components/ShareDialog.jsx`
- `src/components/ShareDialogElite.jsx`
- `src/components/ShareDialogEnhanced.jsx`
- `src/components/ShareDialogPro.jsx`
- `src/components/ShareDialogSimple.jsx`
- `src/pages/SharedDocument.jsx`

### ✅ `src/features/storage/hooks/index.ts`

No issues found.

### ❌ `src/features/storage/index.ts`

**Issues:** 8 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 missing_export | `useSmartSync` | export { useSmartSync } | not exported | `// Could not find source for useSmartSync` |
| 🔴 missing_export | `useMultiLayerStorage` | export { useMultiLayerStorage } | not exported | `// Could not find source for useMultiLayerStorage` |
| 🔴 missing_export | `useProjectStructure` | export { useProjectStructure } | not exported | `// Could not find source for useProjectStructure` |
| 🔴 missing_export | `useProjectStructure` | export { useProjectStructure } | not exported | `// Could not find source for useProjectStructure` |
| 🔴 missing_export | `useSmartDatabaseUsage` | export { useSmartDatabaseUsage } | not exported | `// Could not find source for useSmartDatabaseUsage` |
| 🔴 missing_export | `createSmartSync` | export { createSmartSync } | not exported | `// Could not find source for createSmartSync` |
| 🔴 missing_export | `createSmartSync` | export { createSmartSync } | not exported | `// Could not find source for createSmartSync` |
| 🔴 missing_export | `useSmartDatabaseUsage` | export { useSmartDatabaseUsage } | not exported | `// Could not find source for useSmartDatabaseUsage` |

**Affected consumers:**

- `src/components/DocumentEditor-SmartSync-Example.jsx`
- `src/components/PerformanceMonitor.jsx`
- `src/components/ProjectExplorer/ProjectExplorer.jsx`
- `src/components/ProjectExplorer/ProjectExplorerV2.jsx`
- `src/components/RealtimeIndicator.jsx`
- `src/features/block/hooks/use-auto-save.ts`
- `src/features/storage/hooks/use-smart-sync.ts`
- `src/pages/SettingsClaude.jsx`

### ❌ `src/features/storage/lib/index.ts`

**Issues:** 5 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `SmartSync` | named export "SmartSync" | createSmartSync, default (SmartSyncManager) | `export { default as SmartSync } from './smart-sync';` |
| 🔴 wrong_source | `RealtimeManager` | named export "RealtimeManager" | default (realtimeManager) | `export { default as RealtimeManager } from './realtime-manager';` |
| 🔴 wrong_source | `exportData` | named export "exportData" | exportSupabaseData, importSupabaseData | `// Available exports: exportSupabaseData, importSupabaseData` |
| 🔴 wrong_source | `exportToJSON` | named export "exportToJSON" | exportSupabaseData, importSupabaseData | `// Available exports: exportSupabaseData, importSupabaseData` |
| 🔴 wrong_source | `exportToCSV` | named export "exportToCSV" | exportSupabaseData, importSupabaseData | `// Available exports: exportSupabaseData, importSupabaseData` |

### ✅ `src/shared/api/index.ts`

No issues found.

### ✅ `src/shared/api/supabase/index.ts`

No issues found.

### ❌ `src/shared/hooks/index.ts`

**Issues:** 2 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `usePerformance` | named export "usePerformance" | useDebounce, useThrottle, useIntersectionObserver, useIdleCallback, useViewportSize, useMediaQuery, usePrefetch, useVirtualScroll, useProgressiveImage, useNetworkStatus | `// Available exports: useDebounce, useThrottle, useIntersectionObserver, useIdle` |
| 🔴 wrong_source | `toast` | named export "toast" | ToastProvider, useToast | `// Available exports: ToastProvider, useToast` |

### ❌ `src/shared/lib/auth/index.ts`

**Issues:** 4 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `clearAuthStorage` | named export "clearAuthStorage" | clearCorruptedAuthStorage | `// Available exports: clearCorruptedAuthStorage` |
| 🔴 missing_export | `getURL` | export { getURL } | not exported | `export { getURL } from './utils';` |
| 🔴 missing_export | `getURL` | export { getURL } | not exported | `export { getURL } from './utils';` |
| 🔴 missing_export | `getURL` | export { getURL } | not exported | `export { getURL } from './utils';` |

**Affected consumers:**

- `src/components/AuthDesktop.jsx`
- `src/components/AuthElite.backup.jsx`
- `src/components/AuthPageRedesign.jsx`

### ✅ `src/shared/lib/cache/index.ts`

No issues found.

### ✅ `src/shared/lib/dom/index.ts`

No issues found.

### ✅ `src/shared/lib/events/index.ts`

No issues found.

### ❌ `src/shared/lib/index.ts`

**Issues:** 70 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `LRUCache` | named export "LRUCache" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `cn` | named export "cn" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `eventBus` | named export "eventBus" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `EVENT_TYPES` | named export "EVENT_TYPES" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `storageWrapper` | named export "storageWrapper" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `deleteEntry` | named export "deleteEntry" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `MultiLayerStorage` | named export "MultiLayerStorage" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `SyncEngine` | named export "SyncEngine" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `StorageLRUCache` | named export "StorageLRUCache" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `SecureStorage` | named export "SecureStorage" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `SessionCache` | named export "SessionCache" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `IndexedDBAdapter` | named export "IndexedDBAdapter" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `SupabaseAdapterOptimized` | named export "SupabaseAdapterOptimized" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `CompressedStorageAdapter` | named export "CompressedStorageAdapter" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `DataIntegrityManager` | named export "DataIntegrityManager" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `LockManager` | named export "LockManager" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `CircuitBreaker` | named export "CircuitBreaker" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `RecoveryManager` | named export "RecoveryManager" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `TransactionManager` | named export "TransactionManager" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `sanitize` | named export "sanitize" | SanitizeType, sanitizeConfig, sanitizeInput, sanitizeTitle, sanitizeTags, sanitizeBlock, sanitizeDocument, sanitizeSearchQuery, createSafeElement, sanitizeURL, DOMPurify | `// Available exports: SanitizeType, sanitizeConfig, sanitizeInput, sanitizeTitle` |
| 🔴 wrong_source | `sanitizeForStorage` | named export "sanitizeForStorage" | SanitizeType, sanitizeConfig, sanitizeInput, sanitizeTitle, sanitizeTags, sanitizeBlock, sanitizeDocument, sanitizeSearchQuery, createSafeElement, sanitizeURL, DOMPurify | `// Available exports: SanitizeType, sanitizeConfig, sanitizeInput, sanitizeTitle` |
| 🔴 wrong_source | `markdownConverter` | named export "markdownConverter" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `parseMarkdown` | named export "parseMarkdown" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `InlineMarkdown` | named export "InlineMarkdown" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `uploadImage` | named export "uploadImage" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `deleteImage` | named export "deleteImage" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `setupImageStorage` | named export "setupImageStorage" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `extractLinks` | named export "extractLinks" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `extractAllLinks` | named export "extractAllLinks" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `patchQuerySelector` | named export "patchQuerySelector" | nothing | `// Available exports: none` |
| 🔴 missing_export | `initMonitoring` | export { initMonitoring } | not exported | `// Could not find source for initMonitoring` |
| 🔴 missing_export | `setUserContext` | export { setUserContext } | not exported | `// Could not find source for setUserContext` |
| 🔴 missing_export | `preloadResources` | export { preloadResources } | not exported | `// Could not find source for preloadResources` |
| 🔴 missing_export | `heroTextReveal` | export { heroTextReveal } | not exported | `export { heroTextReveal } from './animations';` |
| 🔴 missing_export | `magneticHover` | export { magneticHover } | not exported | `export { magneticHover } from './animations';` |
| 🔴 missing_export | `liquidMorph` | export { liquidMorph } | not exported | `export { liquidMorph } from './animations';` |
| 🔴 missing_export | `staggerContainer` | export { staggerContainer } | not exported | `export { staggerContainer } from './animations';` |
| 🔴 missing_export | `staggerItem` | export { staggerItem } | not exported | `export { staggerItem } from './animations';` |
| 🔴 missing_export | `energyPulse` | export { energyPulse } | not exported | `export { energyPulse } from './animations';` |
| 🔴 missing_export | `staggerContainer` | export { staggerContainer } | not exported | `export { staggerContainer } from './animations';` |
| 🔴 missing_export | `staggerItem` | export { staggerItem } | not exported | `export { staggerItem } from './animations';` |
| 🔴 missing_export | `staggerContainer` | export { staggerContainer } | not exported | `export { staggerContainer } from './animations';` |
| 🔴 missing_export | `staggerItem` | export { staggerItem } | not exported | `export { staggerItem } from './animations';` |
| 🔴 missing_export | `lockBodyScroll` | export { lockBodyScroll } | not exported | `export { lockBodyScroll } from './responsive';` |
| 🔴 missing_export | `unlockBodyScroll` | export { unlockBodyScroll } | not exported | `export { unlockBodyScroll } from './responsive';` |
| 🔴 missing_export | `fadeInUp` | export { fadeInUp } | not exported | `export { fadeInUp } from './animations';` |
| 🔴 missing_export | `staggerContainer` | export { staggerContainer } | not exported | `export { staggerContainer } from './animations';` |
| 🔴 missing_export | `staggerItem` | export { staggerItem } | not exported | `export { staggerItem } from './animations';` |
| 🔴 missing_export | `buttonHover` | export { buttonHover } | not exported | `export { buttonHover } from './animations';` |
| 🔴 missing_export | `fadeInUp` | export { fadeInUp } | not exported | `export { fadeInUp } from './animations';` |
| 🔴 missing_export | `problemCardContainer` | export { problemCardContainer } | not exported | `export { problemCardContainer } from './animations';` |
| 🔴 missing_export | `problemCardItem` | export { problemCardItem } | not exported | `export { problemCardItem } from './animations';` |
| 🔴 missing_export | `iconFloat` | export { iconFloat } | not exported | `export { iconFloat } from './animations';` |
| 🔴 missing_export | `debugHelpers` | export { debugHelpers } | not exported | `// Could not find source for debugHelpers` |
| 🔴 missing_export | `fadeInUp` | export { fadeInUp } | not exported | `export { fadeInUp } from './animations';` |
| 🔴 missing_export | `staggerContainer` | export { staggerContainer } | not exported | `export { staggerContainer } from './animations';` |
| 🔴 missing_export | `staggerItem` | export { staggerItem } | not exported | `export { staggerItem } from './animations';` |
| 🔴 missing_export | `iconLift` | export { iconLift } | not exported | `export { iconLift } from './animations';` |
| 🔴 missing_export | `buttonHover` | export { buttonHover } | not exported | `export { buttonHover } from './animations';` |
| 🔴 missing_export | `featureReveal` | export { featureReveal } | not exported | `export { featureReveal } from './animations';` |
| 🔴 missing_export | `tiltEffect` | export { tiltEffect } | not exported | `export { tiltEffect } from './animations';` |
| 🔴 missing_export | `fadeInUp` | export { fadeInUp } | not exported | `export { fadeInUp } from './animations';` |
| 🔴 missing_export | `staggerContainer` | export { staggerContainer } | not exported | `export { staggerContainer } from './animations';` |
| 🔴 missing_export | `staggerItem` | export { staggerItem } | not exported | `export { staggerItem } from './animations';` |
| 🔴 missing_export | `fadeInUp` | export { fadeInUp } | not exported | `export { fadeInUp } from './animations';` |
| 🔴 missing_export | `staggerContainer` | export { staggerContainer } | not exported | `export { staggerContainer } from './animations';` |
| 🔴 missing_export | `staggerItem` | export { staggerItem } | not exported | `export { staggerItem } from './animations';` |
| 🔴 missing_export | `fadeInUp` | export { fadeInUp } | not exported | `export { fadeInUp } from './animations';` |
| 🔴 missing_export | `staggerContainer` | export { staggerContainer } | not exported | `export { staggerContainer } from './animations';` |
| 🔴 missing_export | `staggerItem` | export { staggerItem } | not exported | `export { staggerItem } from './animations';` |

**Affected consumers:**

- `src/App.jsx`
- `src/components/HeroSectionV3.jsx`
- `src/components/HowItWorksSimple.jsx`
- `src/components/HowItWorksVideo.jsx`
- `src/components/MobileDrawer.jsx`
- `src/components/PricingSection.jsx`
- `src/components/ProblemSection.jsx`
- `src/components/debug/AuthDebugConsole.jsx`
- `src/pages/Landing.jsx`
- `src/pages/Privacy.jsx`
- `src/pages/Terms.jsx`
- `src/pages/Upgrade.jsx`

### ❌ `src/shared/lib/integrity/index.ts`

**Issues:** 2 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `DataIntegrityManager` | named export "DataIntegrityManager" | INTEGRITY_EVENTS, default (dataIntegrityManager) | `export { default as DataIntegrityManager } from './data-integrity';` |
| 🔴 default_mismatch | `default` | default export | no default export | `export { default } from './primary-module';` |

**Affected consumers:**

- `src/components/SystemHealthMonitor.jsx`

### ❌ `src/shared/lib/links/index.ts`

**Issues:** 2 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `extractLinks` | named export "extractLinks" | extractDocumentLinks, getBacklinks | `// Available exports: extractDocumentLinks, getBacklinks` |
| 🔴 wrong_source | `extractAllLinks` | named export "extractAllLinks" | extractDocumentLinks, getBacklinks | `// Available exports: extractDocumentLinks, getBacklinks` |

### ❌ `src/shared/lib/locking/index.ts`

**Issues:** 2 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `LockManager` | named export "LockManager" | LOCK_EVENTS, default (lockManager) | `export { default as LockManager } from './lock-manager';` |
| 🔴 default_mismatch | `default` | default export | no default export | `export { default } from './primary-module';` |

**Affected consumers:**

- `src/components/SystemHealthMonitor.jsx`

### ❌ `src/shared/lib/markdown/index.ts`

**Issues:** 4 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `markdownConverter` | named export "markdownConverter" | markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlainText | `// Available exports: markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlai` |
| 🔴 wrong_source | `convertMarkdownToHtml` | named export "convertMarkdownToHtml" | markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlainText | `// Available exports: markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlai` |
| 🔴 wrong_source | `convertHtmlToMarkdown` | named export "convertHtmlToMarkdown" | markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlainText | `// Available exports: markdownToHtml, htmlToMarkdown, isContentEmpty, htmlToPlai` |
| 🔴 wrong_source | `InlineMarkdown` | named export "InlineMarkdown" | parseMarkdown, detectHeadingMarkdown, processLineBreaksAndLists, extractTagsFromContent | `// Available exports: parseMarkdown, detectHeadingMarkdown, processLineBreaksAnd` |

### ✅ `src/shared/lib/math/index.ts`

No issues found.

### ❌ `src/shared/lib/network/index.ts`

**Issues:** 1 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 default_mismatch | `default` | default export | no default export | `export { default } from './primary-module';` |

**Affected consumers:**

- `src/components/SystemHealthMonitor.jsx`

### ❌ `src/shared/lib/performance/index.ts`

**Issues:** 20 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `measureRenderTime` | named export "measureRenderTime" | debounce, throttle, preloadResources, createLazyLoader, lazyLoadImages, whenIdle, measurePerformance, batchDOMUpdates, createVirtualList, prefetchData, memoizeWithLimit, observePerformance | `// Available exports: debounce, throttle, preloadResources, createLazyLoader, la` |
| 🔴 wrong_source | `ResourceLoader` | named export "ResourceLoader" | debounce, throttle, preloadResources, createLazyLoader, lazyLoadImages, whenIdle, measurePerformance, batchDOMUpdates, createVirtualList, prefetchData, memoizeWithLimit, observePerformance | `// Available exports: debounce, throttle, preloadResources, createLazyLoader, la` |
| 🔴 wrong_source | `requestIdleCallback` | named export "requestIdleCallback" | debounce, throttle, preloadResources, createLazyLoader, lazyLoadImages, whenIdle, measurePerformance, batchDOMUpdates, createVirtualList, prefetchData, memoizeWithLimit, observePerformance | `// Available exports: debounce, throttle, preloadResources, createLazyLoader, la` |
| 🔴 wrong_source | `cancelIdleCallback` | named export "cancelIdleCallback" | debounce, throttle, preloadResources, createLazyLoader, lazyLoadImages, whenIdle, measurePerformance, batchDOMUpdates, createVirtualList, prefetchData, memoizeWithLimit, observePerformance | `// Available exports: debounce, throttle, preloadResources, createLazyLoader, la` |
| 🔴 wrong_source | `isLowPowerMode` | named export "isLowPowerMode" | startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce | `// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimation` |
| 🔴 wrong_source | `getDeviceCapabilities` | named export "getDeviceCapabilities" | startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce | `// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimation` |
| 🔴 wrong_source | `createLazyLoadObserver` | named export "createLazyLoadObserver" | startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce | `// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimation` |
| 🔴 wrong_source | `createVirtualScroller` | named export "createVirtualScroller" | startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce | `// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimation` |
| 🔴 wrong_source | `measurePerformance` | named export "measurePerformance" | startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce | `// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimation` |
| 🔴 wrong_source | `PerformanceMetrics` | named export "PerformanceMetrics" | startPerformanceMonitoring, logBlockRender, trackAnimationFrame, takeMemorySnapshot, getPerformanceReport, debugPerformance, isPerformanceOptimizationEnabled, throttle, debounce | `// Available exports: startPerformanceMonitoring, logBlockRender, trackAnimation` |
| 🔴 wrong_source | `MobilePerformanceMonitor` | named export "MobilePerformanceMonitor" | debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader | `// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallbac` |
| 🔴 wrong_source | `mobilePerformance` | named export "mobilePerformance" | debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader | `// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallbac` |
| 🔴 wrong_source | `AdaptiveAnimations` | named export "AdaptiveAnimations" | debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader | `// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallbac` |
| 🔴 wrong_source | `createAdaptiveAnimation` | named export "createAdaptiveAnimation" | debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader | `// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallbac` |
| 🔴 wrong_source | `isMobileDevice` | named export "isMobileDevice" | debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader | `// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallbac` |
| 🔴 wrong_source | `isLandscape` | named export "isLandscape" | debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader | `// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallbac` |
| 🔴 wrong_source | `isPortrait` | named export "isPortrait" | debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader | `// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallbac` |
| 🔴 wrong_source | `getDeviceType` | named export "getDeviceType" | debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader | `// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallbac` |
| 🔴 wrong_source | `getViewportDimensions` | named export "getViewportDimensions" | debounce, throttle, requestIdleCallback, cancelIdleCallback, deviceCapabilities, createLazyLoader, VirtualScroller, ImagePreloader, PerformanceMonitor, lazyLoader, performanceMonitor, imagePreloader | `// Available exports: debounce, throttle, requestIdleCallback, cancelIdleCallbac` |
| 🔴 missing_export | `createLazyLoader` | export { createLazyLoader } | not exported | `export { createLazyLoader } from './mobile';` |

**Affected consumers:**

- `src/components/OptimizedImage.jsx`

### ❌ `src/shared/lib/recovery/index.ts`

**Issues:** 2 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `RecoveryManager` | named export "RecoveryManager" | RECOVERY_EVENTS, default (recoveryManager) | `export { default as RecoveryManager } from './recovery-manager';` |
| 🔴 default_mismatch | `default` | default export | no default export | `export { default } from './primary-module';` |

**Affected consumers:**

- `src/components/SystemHealthMonitor.jsx`

### ✅ `src/shared/lib/service-worker/index.ts`

No issues found.

### ✅ `src/shared/lib/storage/adapters/index.ts`

No issues found.

### ❌ `src/shared/lib/storage/index.ts`

**Issues:** 4 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `optimizedBlockLoader` | named export "optimizedBlockLoader" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `OptimizedBlockLoader` | named export "OptimizedBlockLoader" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `paginatedBlockLoader` | named export "paginatedBlockLoader" | nothing | `// Available exports: none` |
| 🔴 wrong_source | `PaginatedBlockLoader` | named export "PaginatedBlockLoader" | nothing | `// Available exports: none` |

### ✅ `src/shared/lib/styles/index.ts`

No issues found.

### ❌ `src/shared/lib/transactions/index.ts`

**Issues:** 2 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `TransactionManager` | named export "TransactionManager" | TRANSACTION_EVENTS, documentSaga, default (transactionManager) | `export { default as TransactionManager } from './transaction-manager';` |
| 🔴 default_mismatch | `default` | default export | no default export | `export { default } from './primary-module';` |

**Affected consumers:**

- `src/components/SystemHealthMonitor.jsx`

### ❌ `src/shared/lib/upload/index.ts`

**Issues:** 3 errors, 0 warnings

| Type | Export | Expected | Actual | Fix |
|------|--------|----------|--------|-----|
| 🔴 wrong_source | `uploadImage` | named export "uploadImage" | uploadImageToSupabase, dataUrlToBlob, compressImage, deleteImageFromSupabase, createImagesBucketIfNotExists | `// Available exports: uploadImageToSupabase, dataUrlToBlob, compressImage, delet` |
| 🔴 wrong_source | `deleteImage` | named export "deleteImage" | uploadImageToSupabase, dataUrlToBlob, compressImage, deleteImageFromSupabase, createImagesBucketIfNotExists | `// Available exports: uploadImageToSupabase, dataUrlToBlob, compressImage, delet` |
| 🔴 wrong_source | `generateUniqueFilename` | named export "generateUniqueFilename" | uploadImageToSupabase, dataUrlToBlob, compressImage, deleteImageFromSupabase, createImagesBucketIfNotExists | `// Available exports: uploadImageToSupabase, dataUrlToBlob, compressImage, delet` |

## Clean Barrels

These barrel files have no issues:

- ✅ `src/app/providers/index.ts`
- ✅ `src/components/sidebar/index.js`
- ✅ `src/components/sidebar/views/index.js`
- ✅ `src/features/document/hooks/index.ts`
- ✅ `src/features/storage/hooks/index.ts`
- ✅ `src/shared/api/index.ts`
- ✅ `src/shared/api/supabase/index.ts`
- ✅ `src/shared/lib/cache/index.ts`
- ✅ `src/shared/lib/dom/index.ts`
- ✅ `src/shared/lib/events/index.ts`
- ✅ `src/shared/lib/math/index.ts`
- ✅ `src/shared/lib/service-worker/index.ts`
- ✅ `src/shared/lib/storage/adapters/index.ts`
- ✅ `src/shared/lib/styles/index.ts`
