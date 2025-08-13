# Devlog Directory Structure - Deep Dive

## Project Overview
**Devlog (Journey Log Compass)** - A block-based documentation platform for developers
- **Tech Stack**: React 19, Vite, Supabase, Tailwind CSS
- **Architecture**: Multi-layer storage with cloud/local fallback
- **Key Feature**: Block-based documents with real-time sync

## Root Directory Structure

### Configuration Files
```
├── package.json              # Node project config (journey-log-compass)
├── vite.config.js           # Vite bundler configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── eslint.config.js         # ESLint linting rules
├── vitest.config.js         # Vitest test configuration
├── vercel.json              # Vercel deployment config
├── .mcp.json                # MCP (Model Context Protocol) config
├── CLAUDE.md                # AI assistant instructions
└── CLAUDE_DESKTOP_CONFIG.json # Claude Desktop integration
```

### Documentation Hierarchy
```
docs/                        # Production documentation
├── billing/                 # Billing and subscription docs
├── errors/                  # Error handling documentation
├── mcp/                     # MCP integration docs (7 subdirs)
└── *.md files              # Core feature documentation

docs-dev/                    # Developer documentation
├── architecture/            # System architecture docs
├── fixes/                   # Bug fixes and patches
├── guides/                  # Development guides
└── sql-fixes/              # Database migration fixes

docs-marketing/              # Marketing materials
└── REDDIT_LAUNCH_CHECKLIST.md # Launch strategy

docs-research/               # Research and planning
├── features/                # Feature research
├── pricing/                 # Pricing analysis
└── prompts/                 # AI prompt templates
```

## Source Code Organization (`/src`)

### Core Application Structure
```
src/
├── main.jsx                 # Application entry point
├── App.jsx                  # Root component
├── index.css                # Global styles
└── instrument.js            # Sentry monitoring setup
```

### Component Architecture (`/src/components`)

#### Block System Components
```
blocks/                      # Document block types
├── TextBlock.jsx           # Markdown text with tags
├── CodeBlock.jsx           # Syntax-highlighted code
├── HeadingBlock.jsx        # Document headings
├── TableBlock.jsx          # Dynamic tables
├── AIBlock.jsx             # AI conversation blocks
├── FileTreeBlock.jsx       # Project structure visualization
├── TodoBlock.jsx           # Task lists
├── ImageBlock.jsx          # Image galleries
├── InlineImageBlock.jsx    # Inline images
└── IssueTrackerBlock.jsx   # Issue tracking
```

#### Hero & Landing Components
```
HeroBackgroundAnimation/     # Landing page animations
├── EliteGradient.jsx       # Premium gradient effects
├── KnowledgeConstellation.jsx # Particle constellation
├── MemoryErosion.jsx       # Memory fade effect
├── QuantumDocumentationField.jsx # Quantum field animation
└── workers/                # Web Workers for performance
```

#### Core UI Components
```
components/
├── ExpandedViewEnhanced.jsx # Main document editor
├── Block.jsx               # Block container wrapper
├── BlockControls.jsx       # Block manipulation controls
├── AddBlockRow.jsx         # Block type selector
├── DocumentToolbar.jsx     # Document actions toolbar
├── SaveIndicator.jsx       # Auto-save status
├── RealtimeIndicator.jsx   # Sync status indicator
└── CommandPalette.jsx      # Keyboard shortcuts (Cmd+K)
```

#### Mobile-Optimized Components
```
Mobile*.jsx files:          # 20+ mobile-specific components
├── MobileDocumentViewer.jsx
├── MobileBottomSheet.jsx
├── MobileFloatingActionButton.jsx
└── MobileOptimizedLayout.jsx
```

### Context Providers (`/src/contexts`)
```
├── AuthContext.jsx         # Supabase authentication
├── DemoModeContext.jsx     # Demo/trial mode management
├── SettingsContext.jsx     # User preferences
└── SidebarContext.jsx      # Sidebar state management
```

### Custom Hooks (`/src/hooks`)
```
Performance Hooks:
├── useOptimizedBlockLoader.js # Single-query block loading
├── usePaginatedBlockLoader.js # 50+ blocks pagination
├── useAutoSave.js          # Debounced auto-save (3s)
├── usePerformance.js       # Performance monitoring

UI/UX Hooks:
├── useResponsive.js        # Responsive breakpoints
├── useSwipeNavigation.js   # Mobile swipe gestures
├── useTouchGestures.js     # Touch interactions
├── useIntersectionObserver.js # Lazy loading
└── useViewportAwarePosition.js # Smart positioning
```

### Pages & Routes (`/src/pages`)
```
├── Dashboard.jsx           # Main document grid
├── Landing.jsx             # Marketing landing page
├── SharedDocument.jsx      # Public document viewer
├── Settings*.jsx           # Settings pages
├── auth/callback.jsx       # OAuth callback handler
├── compare/                # Competitor comparisons
├── features/               # Feature showcases
└── guides/                 # User guides
```

## Storage Architecture (`/src/utils/storage`)

### Multi-Layer Storage System
```
1. SupabaseAdapter.js       # Primary: Cloud storage with RLS
2. IndexedDBAdapter.js      # Fallback: 1GB+ local storage
3. storageWrapper.js        # Orchestrator: Handles fallback logic
```

### Key Storage Features
- **Compression**: LZ-String for IndexedDB storage
- **Caching**: 5-second cache for navigation
- **Integrity**: SHA-256 checksums for data validation
- **Transactions**: ACID-like guarantees with rollback

## Utility Systems (`/src/utils`)

### Data Management
```
├── autoSaveManager.js      # Auto-save orchestration
├── documentSaveManager.js  # Document persistence
├── blockStreamer.js        # Block streaming for large docs
├── optimizedBlockLoader.js # Optimized block queries
└── paginatedBlockLoader.js # Pagination for 50+ blocks
```

### System Resilience
```
integrity/
└── DataIntegrityManager.js # SHA-256 checksums, snapshots

locking/
└── LockManager.js          # Cross-tab race prevention

network/
└── CircuitBreaker.js       # Network failure handling

recovery/
└── RecoveryManager.js      # Crash recovery, auto-save
```

### Performance Optimization
```
├── LRUCache.js             # Least Recently Used cache
├── performanceMonitor.js   # Real-time performance metrics
├── animationPerformance.js # Animation frame optimization
├── mobilePerformance.js    # Mobile-specific optimizations
└── rateLimiter.js          # API rate limiting
```

## API & Backend (`/api`)

### MCP Integration
```
api/mcp/                    # Model Context Protocol API
├── blocks/                 # Block operations
├── conversations/          # AI conversation handling
├── documents/              # Document operations
└── health.js              # Health check endpoint
```

### MCP Clients
```
devlog-mcp-client/          # NPM package for MCP client
devlog-mcp-remote/          # Cloudflare Worker remote MCP
journey-log-mcp/            # Core MCP server implementation
```

## Database Structure

### Core Tables (Supabase/PostgreSQL)
```sql
documents                   # Document metadata
├── id (UUID)
├── title
├── tags (JSONB)
└── user_id

blocks                      # Document content blocks
├── id (UUID)
├── document_id (FK)
├── type (ENUM)
├── content (TEXT)
├── metadata (JSONB)        # Block-specific data
└── position (INT)

document_shares             # Sharing system
├── share_code (UNIQUE)
├── permissions (TEXT[])
└── expires_at (TIMESTAMP)
```

### Key Database Features
- **Row Level Security (RLS)**: User data isolation
- **Soft Deletes**: `deleted_at` column pattern
- **Atomic Saves**: PostgreSQL function `save_document_blocks_v3`
- **JSONB Storage**: Extensible metadata fields

## Build & Deployment

### Build Process
```bash
npm run build               # Vite production build
├── Outputs to dist/
├── Tree-shakes unused code
├── Minifies & chunks assets
└── Generates source maps
```

### Deployment Targets
```
vercel.json                 # Vercel configuration
├── Serverless functions
├── Edge middleware
└── Redirects & rewrites

Cloudflare Workers          # MCP remote endpoints
Supabase                    # Database & Auth
```

## Development Workflow

### Key Commands
```bash
npm run dev                 # Start dev server (port 5173)
npm run build              # Production build
npm run lint               # ESLint checking
npm run preview            # Preview production build
npx vitest                 # Run tests
```

### Environment Variables
```env
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_ANON_KEY     # Public anon key
SENTRY_DSN                 # Error monitoring (optional)
```

## Critical Files Reference

### Most Important Files
1. `src/components/ExpandedViewEnhanced.jsx` - Main editor (1000+ lines)
2. `src/utils/storage/SupabaseAdapter.js` - Database operations
3. `src/components/Block.jsx` - Block rendering logic
4. `src/utils/autoSaveManager.js` - Auto-save system
5. `src/pages/Dashboard.jsx` - Document management

### Configuration Files
1. `CLAUDE.md` - AI assistant instructions
2. `.mcp.json` - MCP server configuration
3. `vercel.json` - Deployment configuration
4. `package.json` - Dependencies & scripts

## Architecture Patterns

### 1. Block Transform Pattern
All block data flows through transform functions:
```javascript
// Must update in 3 places when adding block types:
SupabaseAdapter.js → extractBlockData() & transformBlockFromDB()
optimizedBlockLoader.js → transformBlockFromDB()
blockStreamer.js → transformBlockFromDB()
```

### 2. Storage Fallback Pattern
```javascript
Try Supabase → Catch → Try IndexedDB → Catch → LocalStorage
```

### 3. Auto-Save Pattern
```javascript
User types → 3s debounce → Local backup → Atomic save → Retry on fail
```

### 4. Component Composition Pattern
```javascript
Page → Layout → Container → Block → SubComponents
```

## Performance Optimizations

1. **Virtual Scrolling**: Document grid handles 1000s of items
2. **Code Splitting**: Lazy load heavy components
3. **Skeleton Loading**: Content-aware placeholders
4. **Debounced Saves**: Prevent rapid cascades
5. **Web Workers**: Offload heavy computations
6. **LRU Cache**: Memory-efficient caching
7. **Event-Driven**: No polling, uses listeners

## Security Features

1. **Supabase RLS**: Row-level security
2. **Auth Session**: JWT stored in localStorage
3. **CSRF Protection**: Token validation
4. **Input Sanitization**: DOMPurify for XSS prevention
5. **Password Hashing**: Bcrypt for share links
6. **Audit Logging**: Track document access

## Monitoring & Debugging

### Keyboard Shortcuts
- `Cmd/Ctrl + Shift + P` - Performance monitor
- `Cmd/Ctrl + Shift + H` - System health monitor
- `Cmd/Ctrl + K` - Command palette

### Debug Components
```
src/components/debug/
├── AuthDebugConsole.jsx
├── BlockControlsDebugger.jsx
└── OpacityForensics.jsx
```

## Recent Updates (January 2025)

1. **MCP Integration**: Model Context Protocol for AI assistants
2. **Document Sharing**: Enterprise sharing with permissions
3. **Multi-Image Support**: Gallery support in ImageBlock
4. **Performance Fixes**: Optimized block loading & transforms
5. **Mobile Optimization**: 20+ mobile-specific components

## Directory Size Summary

- **Total Files**: ~400+ files
- **Components**: 100+ React components
- **Utilities**: 40+ utility modules
- **Styles**: 30+ CSS files
- **Documentation**: 50+ markdown files
- **Tests**: Test setup configured (Vitest)