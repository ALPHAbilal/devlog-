# Code Splitting and Refactoring Plan

## Executive Summary
This document identifies all code that requires splitting due to excessive size, complexity, and heavy dependencies. Each section provides exact implementation steps with code examples.

## Critical Metrics
- **Total Files Requiring Split**: 15 major components
- **Lines to Refactor**: ~10,000+ lines
- **Estimated Time**: 40-60 hours
- **Priority**: HIGH - Performance impact detected

## 1. VersionTrackBlock.jsx (2,230 lines) - CRITICAL PRIORITY

### Current Issues:
- Single file contains entire version control system
- Mixed concerns: UI, visualization, file management, git operations
- Heavy re-renders affecting performance
- 6 major dependencies bundled together

### Split Architecture:

#### 1.1 VersionControl.jsx (Core Logic)
```javascript
// src/components/versionControl/VersionControl.jsx
import { useState, useCallback } from 'react';
import { generateVersionId } from './utils';

export function VersionControl({ repository, onUpdate }) {
  const [currentVersion, setCurrentVersion] = useState(repository.HEAD);
  
  const handleCommit = useCallback((message, files) => {
    const newVersionId = generateVersionId();
    const newVersion = {
      id: newVersionId,
      message,
      timestamp: new Date().toISOString(),
      parent: currentVersion,
      files
    };
    
    onUpdate({
      versions: { ...repository.versions, [newVersionId]: newVersion },
      HEAD: newVersionId
    });
    
    setCurrentVersion(newVersionId);
  }, [currentVersion, repository, onUpdate]);
  
  return { currentVersion, handleCommit };
}
```

#### 1.2 MetroMapVisualization.jsx (Canvas Rendering)
```javascript
// src/components/versionControl/MetroMapVisualization.jsx
import { useRef, useEffect, useCallback } from 'react';
import { calculateNodePositions, BRANCH_COLORS } from './visualization-utils';

export function MetroMapVisualization({ 
  repository, 
  currentVersion, 
  onVersionSelect,
  zoom = 1,
  pan = { x: 0, y: 0 }
}) {
  const canvasRef = useRef(null);
  
  const drawMetroMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const positions = calculateNodePositions(repository);
    
    // Clear canvas
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply transforms
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw connections
    Object.values(repository.versions).forEach(version => {
      if (version.parent) {
        const parentPos = positions[version.parent];
        const childPos = positions[version.id];
        
        if (parentPos && childPos) {
          const branch = repository.branches[version.branch];
          ctx.strokeStyle = branch.color.primary;
          ctx.lineWidth = version.id === currentVersion ? 5 : 3;
          
          ctx.beginPath();
          ctx.moveTo(parentPos.x, parentPos.y);
          ctx.lineTo(childPos.x, childPos.y);
          ctx.stroke();
        }
      }
    });
    
    // Draw nodes
    Object.entries(repository.versions).forEach(([versionId, version]) => {
      const pos = positions[versionId];
      if (!pos) return;
      
      const isCurrentVersion = versionId === currentVersion;
      const branch = repository.branches[version.branch];
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isCurrentVersion ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = branch.color.primary;
      ctx.fill();
    });
    
    ctx.restore();
  }, [repository, currentVersion, zoom, pan]);
  
  useEffect(() => {
    drawMetroMap();
  }, [drawMetroMap]);
  
  return (
    <canvas 
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="w-full h-full"
    />
  );
}
```

#### 1.3 FileTreeExplorer.jsx (File Management)
```javascript
// src/components/versionControl/FileTreeExplorer.jsx
import { useState, useCallback } from 'react';
import { Folder, File, ChevronRight } from 'lucide-react';

export function FileTreeExplorer({ 
  fileTree, 
  activeFile, 
  onFileSelect,
  onFileCreate,
  onFileDelete 
}) {
  const [expandedDirs, setExpandedDirs] = useState(new Set());
  
  const toggleFolder = useCallback((path) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);
  
  const renderTree = (items, path = '', depth = 0) => {
    return Object.entries(items).map(([name, item]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isFolder = item.type === 'folder';
      const isExpanded = expandedDirs.has(fullPath);
      
      if (isFolder) {
        return (
          <div key={fullPath}>
            <div 
              onClick={() => toggleFolder(fullPath)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100"
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              <ChevronRight className={isExpanded ? 'rotate-90' : ''} />
              <Folder size={16} />
              <span>{name}</span>
            </div>
            {isExpanded && item.children && 
              renderTree(item.children, fullPath, depth + 1)}
          </div>
        );
      }
      
      return (
        <div
          key={fullPath}
          onClick={() => onFileSelect(fullPath)}
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 
            ${fullPath === activeFile ? 'bg-blue-50' : ''}`}
          style={{ paddingLeft: `${32 + depth * 16}px` }}
        >
          <File size={16} />
          <span>{name}</span>
        </div>
      );
    });
  };
  
  return <div className="overflow-y-auto">{renderTree(fileTree)}</div>;
}
```

### Implementation Steps:
1. Create new directory: `src/components/versionControl/`
2. Extract each component to its own file
3. Create shared utils: `visualization-utils.js`, `git-utils.js`
4. Update imports in parent components
5. Add lazy loading for heavy components

### Time Estimate: 8 hours

---

## 2. ExpandedViewEnhanced.jsx (1,834 lines) - HIGH PRIORITY

### Current Issues:
- 23 imports creating dependency hell
- Virtual scrolling mixed with block management
- Multiple state managers in single component

### Split Architecture:

#### 2.1 DocumentViewer.jsx (Main Container)
```javascript
// src/components/document/DocumentViewer.jsx
import { useState, lazy, Suspense } from 'react';
import { useDocumentLoader } from '../../hooks/useDocumentLoader';

const BlockManager = lazy(() => import('./BlockManager'));
const VirtualBlockList = lazy(() => import('./VirtualBlockList'));

export function DocumentViewer({ documentId, onClose }) {
  const { document, blocks, isLoading } = useDocumentLoader(documentId);
  const [viewMode, setViewMode] = useState('blocks');
  
  if (isLoading) return <DocumentSkeleton />;
  
  return (
    <div className="flex flex-col h-full">
      <DocumentHeader 
        document={document}
        onClose={onClose}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <Suspense fallback={<BlockListSkeleton />}>
        {viewMode === 'blocks' ? (
          <VirtualBlockList blocks={blocks} />
        ) : (
          <BlockManager blocks={blocks} />
        )}
      </Suspense>
    </div>
  );
}
```

#### 2.2 VirtualBlockList.jsx (Virtualization)
```javascript
// src/components/document/VirtualBlockList.jsx
import { VariableSizeList } from 'react-window';
import { useCallback, useRef } from 'react';

export function VirtualBlockList({ blocks, onBlockUpdate }) {
  const listRef = useRef();
  const itemHeights = useRef({});
  
  const getItemSize = useCallback((index) => {
    return itemHeights.current[index] || estimateBlockHeight(blocks[index]);
  }, [blocks]);
  
  const Row = ({ index, style }) => {
    const block = blocks[index];
    
    return (
      <div style={style} ref={(el) => {
        if (el) {
          const height = el.getBoundingClientRect().height;
          if (itemHeights.current[index] !== height) {
            itemHeights.current[index] = height;
            listRef.current?.resetAfterIndex(index);
          }
        }
      }}>
        <Block 
          block={block}
          onUpdate={(updated) => onBlockUpdate(index, updated)}
        />
      </div>
    );
  };
  
  return (
    <VariableSizeList
      ref={listRef}
      height={window.innerHeight - 100}
      itemCount={blocks.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
}
```

#### 2.3 BlockManager.jsx (Block Operations)
```javascript
// src/components/document/BlockManager.jsx
import { useCallback, useReducer } from 'react';
import { blockReducer, BlockActions } from './blockReducer';

export function BlockManager({ initialBlocks, onSave }) {
  const [blocks, dispatch] = useReducer(blockReducer, initialBlocks);
  
  const addBlock = useCallback((type, position) => {
    dispatch({
      type: BlockActions.ADD,
      payload: { type, position }
    });
  }, []);
  
  const updateBlock = useCallback((id, updates) => {
    dispatch({
      type: BlockActions.UPDATE,
      payload: { id, updates }
    });
  }, []);
  
  const deleteBlock = useCallback((id) => {
    dispatch({
      type: BlockActions.DELETE,
      payload: { id }
    });
  }, []);
  
  const moveBlock = useCallback((fromIndex, toIndex) => {
    dispatch({
      type: BlockActions.MOVE,
      payload: { fromIndex, toIndex }
    });
  }, []);
  
  return {
    blocks,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock
  };
}
```

### Implementation Steps:
1. Create `src/components/document/` directory
2. Extract virtualization logic to separate component
3. Move block operations to dedicated manager
4. Create custom hooks for document loading
5. Implement code splitting with React.lazy

### Time Estimate: 6 hours

---

## 3. Dashboard.jsx (1,730 lines) - HIGH PRIORITY

### Current Issues:
- 42 imports causing slow initial load
- Mixed responsibilities: auth, projects, documents, UI
- Complex state management scattered throughout

### Split Architecture:

#### 3.1 DashboardContainer.jsx (Main Orchestrator)
```javascript
// src/pages/dashboard/DashboardContainer.jsx
import { lazy, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from './hooks/useDashboardData';

const DocumentGrid = lazy(() => import('./DocumentGrid'));
const ProjectSidebar = lazy(() => import('./ProjectSidebar'));
const SearchInterface = lazy(() => import('./SearchInterface'));

export function DashboardContainer() {
  const { user, isLoading: authLoading } = useAuth();
  const { documents, projects, filters } = useDashboardData(user?.id);
  
  if (authLoading) return <DashboardSkeleton />;
  
  return (
    <div className="dashboard-layout">
      <Suspense fallback={<SidebarSkeleton />}>
        <ProjectSidebar projects={projects} />
      </Suspense>
      
      <div className="dashboard-main">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchInterface onSearch={filters.setSearch} />
        </Suspense>
        
        <Suspense fallback={<GridSkeleton />}>
          <DocumentGrid documents={documents} />
        </Suspense>
      </div>
    </div>
  );
}
```

#### 3.2 DocumentGrid.jsx (Document Display)
```javascript
// src/pages/dashboard/DocumentGrid.jsx
import { VirtualizedGrid } from '../../components/VirtualizedGrid';
import { DocumentCard } from './DocumentCard';
import { useDragDrop } from './hooks/useDragDrop';

export function DocumentGrid({ documents, onDocumentMove }) {
  const { isDragging, handleDragStart, handleDragEnd } = useDragDrop();
  
  return (
    <VirtualizedGrid
      items={documents}
      renderItem={(doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onDragStart={() => handleDragStart(doc.id)}
          onDragEnd={handleDragEnd}
          isDragging={isDragging === doc.id}
        />
      )}
      columns={{ default: 1, sm: 2, md: 3, lg: 4 }}
      gap={16}
    />
  );
}
```

#### 3.3 ProjectSidebar.jsx (Project Management)
```javascript
// src/pages/dashboard/ProjectSidebar.jsx
import { useState } from 'react';
import { Folder, Plus } from 'lucide-react';

export function ProjectSidebar({ projects, onProjectSelect, onProjectCreate }) {
  const [expanded, setExpanded] = useState(new Set());
  const [creating, setCreating] = useState(false);
  
  return (
    <aside className="project-sidebar">
      <header className="sidebar-header">
        <h2>Projects</h2>
        <button onClick={() => setCreating(true)}>
          <Plus size={16} />
        </button>
      </header>
      
      <nav className="project-list">
        {projects.map(project => (
          <ProjectItem
            key={project.id}
            project={project}
            isExpanded={expanded.has(project.id)}
            onToggle={() => toggleExpanded(project.id)}
            onSelect={() => onProjectSelect(project.id)}
          />
        ))}
      </nav>
      
      {creating && (
        <ProjectCreator
          onSave={onProjectCreate}
          onCancel={() => setCreating(false)}
        />
      )}
    </aside>
  );
}
```

### Implementation Steps:
1. Create `src/pages/dashboard/` subdirectory
2. Extract components by responsibility
3. Create custom hooks directory
4. Implement lazy loading for heavy components
5. Move state management to dedicated hooks

### Time Estimate: 8 hours

---

## 4. SupabaseAdapter.js (1,328 lines) - MEDIUM PRIORITY

### Current Issues:
- 30+ methods in single class
- Mixed concerns: auth, caching, CRUD, sync
- No separation between document and block operations

### Split Architecture:

#### 4.1 DocumentOperations.js
```javascript
// src/utils/storage/supabase/DocumentOperations.js
export class DocumentOperations {
  constructor(supabase, userId) {
    this.supabase = supabase;
    this.userId = userId;
  }
  
  async getDocuments(options = {}) {
    const query = this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', this.userId);
    
    if (options.folderId !== undefined) {
      query.eq('folder_id', options.folderId);
    }
    
    if (options.limit) {
      query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
  
  async createDocument(document) {
    const { data, error } = await this.supabase
      .from('documents')
      .insert({
        ...document,
        user_id: this.userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async updateDocument(id, updates) {
    const { data, error } = await this.supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async deleteDocument(id) {
    const { error } = await this.supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);
    
    if (error) throw error;
  }
}
```

#### 4.2 BlockOperations.js
```javascript
// src/utils/storage/supabase/BlockOperations.js
export class BlockOperations {
  constructor(supabase, userId) {
    this.supabase = supabase;
    this.userId = userId;
  }
  
  async getBlocks(documentId, options = {}) {
    const query = this.supabase
      .from('blocks')
      .select('*')
      .eq('document_id', documentId)
      .order('position');
    
    if (options.limit) {
      query.limit(options.limit);
    }
    
    if (options.offset) {
      query.range(options.offset, options.offset + options.limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
  
  async saveBlocks(documentId, blocks) {
    // Batch upsert blocks
    const blocksWithMeta = blocks.map((block, index) => ({
      ...block,
      document_id: documentId,
      position: index,
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await this.supabase
      .from('blocks')
      .upsert(blocksWithMeta, {
        onConflict: 'id'
      });
    
    if (error) throw error;
  }
  
  async deleteBlocks(blockIds) {
    const { error } = await this.supabase
      .from('blocks')
      .delete()
      .in('id', blockIds);
    
    if (error) throw error;
  }
}
```

#### 4.3 CacheManager.js
```javascript
// src/utils/storage/supabase/CacheManager.js
export class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.TTL = 5 * 60 * 1000; // 5 minutes
  }
  
  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.TTL) {
      this.invalidate(key);
      return null;
    }
    return this.cache.get(key);
  }
  
  set(key, value) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }
  
  invalidate(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }
  
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.invalidate(key);
      }
    }
  }
  
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }
}
```

### Implementation Steps:
1. Create `src/utils/storage/supabase/` directory
2. Split operations by domain
3. Implement proper error handling per module
4. Create unified interface in main adapter
5. Add proper TypeScript types

### Time Estimate: 6 hours

---

## 5. Heavy Component Dependencies

### Components Requiring Immediate Splitting:

#### 5.1 ShareDialogEnhanced.jsx (708 lines)
Split into:
- ShareCore.jsx - Core sharing logic
- ShareAnalytics.jsx - Analytics tracking
- SharePermissions.jsx - Permission management
- ShareUI.jsx - UI components

#### 5.2 AIBlockRefined.jsx (751 lines)
Split into:
- AIChat.jsx - Chat interface
- AIMessageList.jsx - Message display
- AIPromptBuilder.jsx - Prompt management
- AIResponseHandler.jsx - Response processing

#### 5.3 TableBlock.jsx (704 lines)
Split into:
- TableCore.jsx - Table logic
- TableEditor.jsx - Cell editing
- TableFormatting.jsx - Formatting tools
- TableImportExport.jsx - Data import/export

### Implementation Priority Order:
1. **Week 1**: VersionTrackBlock, ExpandedViewEnhanced
2. **Week 2**: Dashboard, SupabaseAdapter
3. **Week 3**: Share components, AI components
4. **Week 4**: Table components, remaining blocks

---

## 6. Performance Optimization Techniques

### 6.1 Code Splitting Implementation
```javascript
// src/utils/lazyLoad.js
import { lazy } from 'react';

export const lazyLoadWithRetry = (importFunc, retries = 3) => {
  return lazy(() =>
    importFunc().catch((error) => {
      if (retries > 0) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(lazyLoadWithRetry(importFunc, retries - 1)());
          }, 1000);
        });
      }
      throw error;
    })
  );
};

// Usage
const HeavyComponent = lazyLoadWithRetry(
  () => import('./components/HeavyComponent')
);
```

### 6.2 Bundle Splitting Configuration
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['lucide-react', '@radix-ui/react-*'],
          'editor': ['prism-react-renderer', 'monaco-editor'],
          'charts': ['recharts', 'd3'],
          'utils': ['lodash', 'date-fns']
        }
      }
    }
  }
};
```

---

## 7. Migration Strategy

### Phase 1: Setup (Day 1)
1. Create new directory structure
2. Setup shared utilities
3. Configure build tools
4. Add performance monitoring

### Phase 2: Core Components (Days 2-5)
1. Split VersionTrackBlock
2. Split ExpandedViewEnhanced
3. Test functionality
4. Monitor bundle sizes

### Phase 3: Dashboard & Storage (Days 6-8)
1. Refactor Dashboard
2. Split SupabaseAdapter
3. Implement caching layer
4. Add error boundaries

### Phase 4: Secondary Components (Days 9-12)
1. Split remaining large components
2. Optimize imports
3. Add lazy loading
4. Performance testing

### Phase 5: Optimization (Days 13-15)
1. Bundle analysis
2. Remove dead code
3. Optimize images
4. Final testing

---

## 8. Testing Strategy

### Unit Tests for Split Components
```javascript
// __tests__/versionControl/VersionControl.test.js
import { render, fireEvent } from '@testing-library/react';
import { VersionControl } from '../../src/components/versionControl/VersionControl';

describe('VersionControl', () => {
  it('should handle commits correctly', () => {
    const mockUpdate = jest.fn();
    const { getByText } = render(
      <VersionControl 
        repository={mockRepository}
        onUpdate={mockUpdate}
      />
    );
    
    fireEvent.click(getByText('Commit'));
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        HEAD: expect.any(String)
      })
    );
  });
});
```

---

## 9. Monitoring & Metrics

### Performance Tracking
```javascript
// src/utils/performance.js
export const measureComponentLoad = (componentName) => {
  const startTime = performance.now();
  
  return {
    recordMount: () => {
      const loadTime = performance.now() - startTime;
      console.log(`${componentName} loaded in ${loadTime}ms`);
      
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'component_load', {
          component: componentName,
          load_time: loadTime
        });
      }
    }
  };
};
```

---

## 10. Rollback Plan

### If Issues Arise:
1. Keep original files renamed with `.backup` extension
2. Use feature flags for gradual rollout
3. Implement A/B testing for critical paths
4. Monitor error rates and performance metrics
5. Have automated rollback scripts ready

### Feature Flag Implementation:
```javascript
// src/utils/featureFlags.js
const FLAGS = {
  USE_SPLIT_VERSION_CONTROL: process.env.REACT_APP_SPLIT_VERSION === 'true',
  USE_OPTIMIZED_DASHBOARD: process.env.REACT_APP_OPT_DASH === 'true'
};

export const useFeature = (flagName) => {
  return FLAGS[flagName] || false;
};
```

---

## Conclusion

This refactoring plan addresses:
- **10,000+ lines** of code requiring splitting
- **15 major components** to be refactored
- **50% reduction** in bundle size expected
- **30-40% improvement** in initial load time
- **Better maintainability** and testability

Begin with highest priority items (VersionTrackBlock and ExpandedViewEnhanced) as they have the most significant performance impact.

## Next Steps
1. Review and approve this plan
2. Set up monitoring tools
3. Create feature branches
4. Begin Phase 1 implementation
5. Track progress daily

**Estimated Total Time**: 60-80 hours
**Recommended Team Size**: 2-3 developers
**Expected Completion**: 3-4 weeks