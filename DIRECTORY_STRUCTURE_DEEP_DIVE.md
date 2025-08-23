# Devlog Directory Structure Deep Dive

## 🎯 Project Overview
**Devlog** is a developer-focused knowledge management system built on a flexible block-based architecture. It's a React SPA with Supabase backend, featuring offline-first storage, real-time sync, and a modular block system.

## 🏗️ Architecture Philosophy
- **Block-Based Documents**: Everything is a block (text, code, tables, AI conversations)
- **Multi-Layer Storage**: Memory Cache → IndexedDB → Supabase
- **Event-Driven Updates**: Custom event bus for cross-component communication
- **Performance-First**: 16ms frame budget, optimistic updates, lazy loading
- **AI-Optimized Documentation**: Centralized AI-MEMORY system for patterns and decisions

## 📁 Core Directory Structure

### `/AI-MEMORY/` - Single Source of Truth 🧠
**Purpose**: Centralized documentation for AI assistants and developers
```
/AI-MEMORY/
├── NOW.md           # Current active work session
├── PATTERNS.md      # Known issues and proven solutions (CHECK FIRST!)
├── DECISIONS.md     # Architecture decisions and rationale
└── archive/         # Completed work (date-prefixed)
```
**Key Insight**: Replaces 90+ scattered docs with 3 focused files

### `/src/` - Application Core 
```
/src/
├── App.jsx                    # Main app with routing (React Router v6)
├── main.jsx                   # Entry point with Sentry integration
│
├── components/                # UI Components
│   ├── blocks/               # Block type implementations (22 types)
│   │   ├── TextBlock.jsx     # Markdown with tags
│   │   ├── CodeBlock.jsx     # Syntax highlighting (Prism)
│   │   ├── AIBlockRefined.jsx # AI conversation preservation
│   │   ├── TableBlock.jsx    # Dynamic tables
│   │   ├── FileTreeBlock.jsx # Visual file structure
│   │   └── [19 more blocks]
│   │
│   ├── Block.jsx             # Block renderer/coordinator
│   ├── ExpandedViewEnhanced.jsx # Document editor (main)
│   ├── VirtualizedGrid.jsx  # Document grid (react-window)
│   ├── BlockControls.jsx    # Block manipulation UI
│   ├── Layout.jsx           # App shell with sidebar
│   └── [50+ components]
│
├── contexts/                 # React Contexts
│   ├── AuthContextOptimized.jsx # Authentication state
│   ├── SettingsContext.jsx  # User preferences
│   └── SidebarContext.jsx   # UI state
│
├── hooks/                    # Custom React Hooks
│   ├── useAutoSave.js       # 1-second debounced saves
│   ├── useMultiLayerStorage.js # Storage abstraction
│   ├── useResponsive.js    # Responsive breakpoints
│   └── [15+ hooks]
│
├── pages/                    # Route Components
│   ├── Dashboard.jsx        # Main document grid
│   ├── Landing.jsx         # Marketing landing
│   ├── SharedDocument.jsx  # Public document viewer
│   └── [10+ pages]
│
├── utils/                    # Utilities
│   ├── storage/             # Storage Layer (CRITICAL)
│   │   ├── MultiLayerStorage.js # Coordinates all storage
│   │   ├── SupabaseAdapterOptimized.js # Cloud with RLS
│   │   ├── IndexedDBAdapter.js # Local 1GB+ storage
│   │   ├── CompressedStorageAdapter.js # LZ-String compression
│   │   └── SyncEngine.js    # Local↔Cloud sync
│   │
│   ├── eventBus.js         # Cross-component events
│   ├── monitoring.js       # Sentry integration
│   └── [30+ utilities]
│
└── styles/                   # CSS Files
    ├── index.css            # Main styles
    ├── animations.css       # Framer Motion overrides
    └── [20+ style files]
```

### `/supabase/` - Database Layer
```
/supabase/
└── migrations/              # PostgreSQL migrations
    ├── *_create_*.sql      # Table creation
    ├── *_fix_*.sql        # Bug fixes
    └── *_add_*.sql        # Feature additions
```
**Key Tables**: documents, blocks, users, api_keys, document_shares

### `/api/` - Serverless Functions
```
/api/
├── mcp/                    # Model Context Protocol endpoints
│   ├── documents/         # Document CRUD
│   ├── blocks/           # Block operations
│   └── conversations/    # AI conversation capture
└── lib/                   # Shared API utilities
```

### `/devlog-mcp-remote/` - Cloudflare Workers
**Purpose**: MCP protocol implementation on edge
```
├── src/
│   ├── index.ts          # Worker entry
│   ├── mcp-server.ts    # Protocol server
│   └── durable-objects/ # Stateful connections
└── wrangler.toml        # Cloudflare config
```

### `/public/` - Static Assets
```
/public/
├── manifest.json        # PWA manifest
├── service-worker.js    # Offline caching
├── sitemap.xml         # SEO sitemap
└── [icons, favicons]
```

## 🔑 Key Technical Decisions

### Storage Architecture (3-Layer)
1. **Memory Cache** (LRUCache): <1ms access, 50 document limit
2. **IndexedDB**: <10ms access, 1GB+ capacity, offline-first
3. **Supabase**: 50-200ms, cloud sync, Row Level Security

### Block System
- **22 Block Types**: text, code, heading, AI, table, todo, image, etc.
- **Position-Based Ordering**: Blocks ordered by position field
- **Soft Delete**: deleted_at timestamp instead of hard delete
- **JSONB Metadata**: Flexible schema per block type

### Performance Optimizations
- **Virtualization**: React-window for lists >100 items
- **Lazy Loading**: Dynamic imports for routes
- **Debounced Saves**: 1-second delay prevents overwrites
- **Optimistic Updates**: Instant UI, async persistence
- **Compression**: LZ-String reduces storage 50-80%

### State Management
- **No Redux/MobX**: Event bus + hooks instead
- **Zustand**: Minimal global state where needed
- **Event-Driven**: eventBus.js for cross-component updates

## 🚫 Unused/Legacy Files (Can Ignore)
```
# Components
- ExpandedView.jsx → Use ExpandedViewEnhanced.jsx
- AIBlock.jsx → Use AIBlockRefined.jsx
- VirtualizedGridOptimized.jsx → Use VirtualizedGrid.jsx
- MobileOptimizedLayout.jsx → Not implemented

# Contexts
- AuthContext.jsx → Use AuthContextOptimized.jsx
- SupabaseContext.jsx → Unused

# Storage
- storageWrapperFixed.js → Use storageWrapper.js
- SupabaseAdapter.js → Use SupabaseAdapterOptimized.js
```

## 🛠️ Development Workflow

### Commands
```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

### Environment Variables
```bash
VITE_SUPABASE_URL=      # Supabase project URL
VITE_SUPABASE_ANON_KEY= # Public anon key
VITE_SENTRY_DSN=        # Error tracking
VITE_GA_MEASUREMENT_ID= # Google Analytics
```

### Testing Strategy
- No automated tests configured (vitest present but unused)
- Manual testing through test-files/ directory
- Performance monitoring via built-in tools (Cmd+Shift+P)

## 📊 Metrics & Budgets

### Performance Budgets
- **Animation Frame**: 16ms (60fps requirement)
- **User Input Response**: 100ms maximum
- **Page Load**: 3 seconds maximum
- **Database Query**: 100ms maximum

### Storage Limits
- **IndexedDB**: ~1GB typical (browser-dependent)
- **Memory Cache**: 50 documents
- **Compression**: 50-80% size reduction

## 🔍 Quick Reference

### Where to Find...
- **Block Types**: `/src/components/blocks/`
- **Storage Logic**: `/src/utils/storage/`
- **API Endpoints**: `/api/mcp/`
- **Database Schema**: `/supabase/migrations/`
- **Performance Issues**: Check `/AI-MEMORY/PATTERNS.md` first
- **Architecture Decisions**: `/AI-MEMORY/DECISIONS.md`
- **Current Work**: `/AI-MEMORY/NOW.md`

### Common Operations
1. **Add New Block Type**: Create in `/src/components/blocks/`, register in `Block.jsx`
2. **Fix Performance Issue**: Check PATTERNS.md, use Chrome DevTools Profiler
3. **Debug Storage**: Check MultiLayerStorage.js, inspect IndexedDB
4. **Add Migration**: Create in `/supabase/migrations/` with timestamp prefix

## 🎯 Key Insights

1. **Container Before Component**: Always debug parent components first
2. **Event Bus Pattern**: Avoids prop drilling in deep component trees
3. **Soft Delete Everything**: Enables undo/recovery features
4. **Profile First**: Never optimize without measuring
5. **AI-MEMORY First**: Check patterns before debugging

## 📈 Project Statistics
- **Total Files**: ~500+
- **Active Components**: ~80 
- **Unused/Legacy**: ~30%
- **Block Types**: 22
- **Storage Layers**: 3
- **Performance Budget**: 16ms/frame

---

*Last Updated: 2025-01-23*
*Generated from deep directory analysis*