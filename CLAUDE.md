# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Check AI-MEMORY First
**CRITICAL**: Before ANY work, check the `/AI-MEMORY/` directory:
1. **PATTERNS.md** - Known issues and proven solutions (check FIRST)
2. **NOW.md** - Current active work and session context
3. **DECISIONS.md** - Why architecture choices were made
4. **rules.md** - Mandatory debugging protocols

The AI-MEMORY system replaces scattered documentation with a single source of truth.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview

# Run tests (if configured)
npm test
```

## High-Level Architecture

### Core Concept: Block-Based Document System
Devlog is a developer-focused knowledge management system built around a flexible block-based architecture. Each document consists of various block types (text, code, heading, AI conversation, table, file tree, etc.) that can be reordered, converted, and interconnected.

### Key Architectural Components

#### 1. Storage Architecture (Multi-Layer)
- **Memory Cache** → **IndexedDB** → **Supabase**
- Hybrid storage with cloud-first (Supabase) and offline-first (IndexedDB) fallback
- Automatic compression using LZ-String for 50-80% space savings
- Storage adapters in `src/utils/storage/`:
  - `SupabaseAdapterOptimized.js` - Cloud storage with Row Level Security
  - `IndexedDBAdapter.js` - Local storage with 1GB+ capacity
  - `CompressedStorageAdapter.js` - Automatic compression layer
  - `MultiLayerStorage.js` - Coordinates between all storage layers
  - `SyncEngine.js` - Handles sync between local and cloud

#### 2. Block System
- Block types defined in `src/components/blocks/`
- Each block type has specific metadata stored in JSONB
- Position-based ordering for blocks within documents
- Block rendering coordinated through `src/components/Block.jsx`
- Common block types:
  - TextBlock - Markdown with tag support
  - CodeBlock - Syntax highlighting with file paths
  - FileTreeBlock - Visual project structure
  - AIConversationBlock - Preserved chat conversations
  - TableBlock - Dynamic tables with markdown cells
  - HeadingBlock - Three levels of headings

#### 3. Performance Optimizations
- **Virtualization**: React-window for list rendering
- **Lazy Loading**: Components loaded on demand
- **Optimistic Updates**: Instant UI feedback before database sync
- **Debounced Saves**: Prevents overwrites during rapid typing (1 second delay)
- **Background Operations**: All storage operations are async
- **5-Second Cache**: Document preloading and fast back navigation
- **Single Query Loading**: All blocks fetched in one database call

#### 4. State Management
- No centralized state management library (no Redux/MobX)
- React hooks for local state management
- Custom hooks in `src/hooks/` for shared logic
- Event-driven updates using `src/utils/eventBus.js`
- Zustand for minimal global state where needed

#### 5. Bulletproof Architecture (6-Layer Defense)
- **Global Error Boundaries** - Catches all React errors with recovery UI
- **Data Integrity Layer** - SHA-256 checksums, automatic corruption repair
- **Distributed Lock Manager** - Prevents race conditions across tabs
- **Transaction System** - ACID-like guarantees for complex operations
- **Network Circuit Breaker** - Prevents cascade failures
- **Recovery Manager** - Auto-saves every 30 seconds, crash detection

## Important Development Practices

### Critical: Follow rules.md Protocol
The `rules.md` file contains comprehensive debugging protocols and strategic development rules that MUST be followed. Key highlights:
- **Container Rule**: Always check parent/container before component
- **Measurement Manifesto**: Profile and measure before optimizing
- **Collaborative Loop Protocol**: Add logs, test, share terminal.md when stuck
- **Performance Budgets**: 16ms for animations, 100ms for interactions
- **Effect Chain Mapping**: Map complete chain from trigger to symptom

### Performance Budgets
- Animation frame: 16ms (60fps)
- User input response: 100ms maximum
- Page load: 3 seconds maximum
- Database query: 100ms maximum

### Auto-Save System
- Changes saved after 1 second of inactivity
- Local backup created before every save
- 3 retry attempts with exponential backoff
- Backups in both memory and localStorage

## Project Structure

```
src/
├── main.jsx                    # App entry point
├── App.jsx                     # Main app component with routing
│
├── components/
│   ├── blocks/                 # Block type components (actively used)
│   │   ├── TextBlock.jsx       # Markdown text with tags
│   │   ├── CodeBlock.jsx       # Syntax highlighted code
│   │   ├── HeadingBlock.jsx    # Document headings
│   │   ├── TableBlock.jsx      # Dynamic tables
│   │   ├── FileTreeBlock.jsx   # Visual file structure
│   │   ├── TodoBlock.jsx       # Task lists
│   │   ├── ImageBlock.jsx      # Image display
│   │   ├── InlineImageBlock.jsx # Inline image blocks
│   │   ├── AIBlockRefined.jsx  # AI conversation blocks (used as AIBlock)
│   │   ├── OptimizedVersionTrackBlock.jsx  # Version tracking
│   │   └── OptimizedIssueTrackerBlock.jsx  # Issue tracking
│   │
│   ├── Block.jsx               # Main block renderer/coordinator
│   ├── ExpandedViewEnhanced.jsx # Document editor (main)
│   ├── VirtualizedGrid.jsx     # Virtualized document grid
│   ├── Layout.jsx              # App layout wrapper
│   ├── ErrorBoundary.jsx       # Global error handling
│   ├── BlockErrorBoundary.jsx  # Block-level error handling
│   ├── AuthElite.jsx           # Authentication UI
│   ├── CommandPalette.jsx      # Command palette UI
│   ├── BlockTypeSelector.jsx   # Block type selector
│   ├── AddBlockRow.jsx         # Add block UI
│   ├── BlockControls.jsx       # Block control buttons
│   ├── DragOverlay.jsx         # Drag and drop overlay
│   ├── FloatingElements.jsx    # Floating UI elements (used in HeroSectionV3)
│   │
│   ├── Landing Page Components:
│   │   ├── LogoMinimal.jsx     # Minimal logo component
│   │   ├── HeroSectionV3.jsx   # Hero section for landing
│   │   ├── ProblemSection.jsx  # Problem section component
│   │   ├── HowItWorksVideo.jsx # How it works video section
│   │   ├── NoiseOverlay.jsx    # Noise overlay effect
│   │   └── LandingPerformanceMonitor.jsx # Landing page performance
│   │
│   ├── Mobile Components (actively used):
│   │   ├── MobileDocumentViewer.jsx # Mobile document viewer
│   │   ├── MobileBlockControls.jsx  # Mobile block controls
│   │   └── MobileAddBlockRow.jsx    # Mobile add block UI
│   │
│   ├── ProjectExplorer/        # Project explorer feature
│   │   ├── ProjectExplorer.jsx # Main explorer component
│   │   ├── TreeNode.jsx        # Tree node component
│   │   ├── SearchBar.jsx       # Search bar component
│   │   └── ContextMenu.jsx     # Context menu
│   │
│   ├── debug/                  # Debug components
│   │   └── AuthDebugConsole.jsx # Auth debug console (used in AuthDesktop)
│   │
│   ├── HeroBackgroundAnimation/
│   │   ├── EliteGradient.jsx   # Main gradient animation
│   │   └── index.jsx           # Export file
│   └── [other UI components]
│
├── pages/                      # Route pages
│   ├── Dashboard.jsx           # Dashboard page
│   ├── Landing.jsx             # Landing page
│   ├── SharedDocument.jsx      # Shared document viewer
│   ├── SettingsClaude.jsx      # Settings page
│   ├── Privacy.jsx             # Privacy policy page
│   ├── Terms.jsx               # Terms of service page
│   ├── Upgrade.jsx             # Upgrade page
│   ├── auth/
│   │   └── callback.jsx        # Auth callback handler
│   ├── settings/
│   │   └── api.jsx             # API settings (lazy loaded)
│   ├── features/
│   │   └── AIConversationSaver.jsx # AI conversation feature (lazy loaded)
│   ├── compare/
│   │   ├── NotionAlternative.jsx   # Notion comparison (lazy loaded)
│   │   └── DevLogVsNotion.jsx      # DevLog vs Notion (lazy loaded)
│   └── guides/
│       └── AIConversationManagement.jsx # AI management guide (lazy loaded)
│
├── contexts/                   # React contexts
│   ├── AuthContextOptimized.jsx # Authentication context (main)
│   ├── SettingsContext.jsx     # User settings
│   ├── SidebarContext.jsx      # Sidebar state
│   └── DemoModeContext.jsx     # Demo mode context
│
├── hooks/                      # Custom React hooks
│   ├── useAutoSave.js          # Auto-save functionality
│   ├── useOptimizedBlockLoader.js # Block loading optimization
│   ├── usePaginatedBlockLoader.js # Paginated block loading
│   ├── useMultiLayerStorage.js # Storage layer hook
│   ├── useResponsive.js        # Responsive design hook
│   ├── useDocumentOrganization.js # Document organization
│   ├── useMemoryManagement.js  # Memory management for blocks
│   ├── useToast.jsx            # Toast notifications
│   ├── useIntersectionObserver.js # Intersection observer
│   ├── usePerformance.js       # Performance monitoring
│   ├── useScrollAnimation.js   # Scroll animations (used in Landing)
│   ├── useBlockLazyLoading.js  # Block lazy loading
│   └── [other hooks]
│
├── services/                   # Business logic
│   ├── shareService.js         # Document sharing
│   └── sophisticatedShareService.js # Advanced sharing features
│
├── utils/
│   ├── storage/                # Storage layer
│   │   ├── storageWrapper.js   # Main storage interface (USED)
│   │   ├── MultiLayerStorage.js # Coordinates all storage
│   │   ├── SupabaseAdapterOptimized.js # Cloud storage
│   │   ├── IndexedDBAdapter.js # Local storage
│   │   ├── CompressedStorageAdapter.js # Compression
│   │   ├── SyncEngine.js       # Sync coordination
│   │   └── LRUCache.js         # Memory cache
│   │
│   ├── integrity/              # Data integrity checks
│   ├── locking/                # Multi-tab locking
│   ├── network/                # Network utilities
│   ├── recovery/               # Crash recovery (RecoveryManager.js)
│   ├── transactions/           # Transaction management (TransactionManager.js)
│   │
│   ├── eventBus.js             # Event-driven communication
│   ├── sanitization.js         # Input sanitization
│   ├── monitoring.js           # Performance monitoring
│   ├── blockSerializer.js      # Block serialization
│   ├── extractLinks.js         # Extract document links (backlinks)
│   ├── imageUploader.js        # Image upload utilities
│   ├── activityData.js         # Activity data generation
│   ├── performance.js          # Performance utilities (throttle, etc.)
│   ├── serviceWorker.js        # Service worker registration
│   ├── clearAuthStorage.js     # Auth storage cleanup
│   ├── animationPerformance.js # Animation performance monitoring
│   ├── mobilePerformance.js    # Mobile performance utilities
│   └── [other utilities]
│
├── styles/                     # CSS files
│   ├── index.css               # Main styles
│   ├── animations.css          # Animation styles
│   ├── auth-elite.css          # Auth page styles
│   ├── glassmorphism.css       # Glass effect styles
│   └── [other style files]
│
└── Root Config Files:
    ├── vite.config.js          # Vite configuration
    ├── tailwind.config.js      # Tailwind CSS config
    ├── postcss.config.js       # PostCSS config
    ├── eslint.config.js        # ESLint configuration
    ├── package.json            # Dependencies and scripts
    └── .env.example            # Environment variables example
```

### Unused/Legacy Files (can be ignored)

#### Components
- `src/Test.jsx` - Test component (unused)
- `src/components/EnhancedInteractiveDemo.jsx` - Old demo (unused)
- `src/components/DocumentEditor-SmartSync-Example.jsx` - Example file
- `src/components/ExpandedView.jsx` - Replaced by ExpandedViewEnhanced.jsx
- `src/components/DocumentTOC.jsx` - Table of contents (unused)
- `src/components/FloatingControlsTrigger.jsx` - Floating controls (unused)
- `src/components/VirtualizedGridOptimized.jsx` - Optimized grid (unused, VirtualizedGrid.jsx is used)
- `src/components/VirtualizedExpandedView.jsx` - Virtualized view (unused)
- `src/components/InteractiveDocumentDemo*.jsx` - Demo components (unused)
- `src/components/AnimationPerformanceMonitor.jsx` - Animation monitor (unused)
- `src/components/MobileOptimizedLayout.jsx` - Mobile layout (unused)
- Other mobile components in `src/components/Mobile*.jsx` that aren't listed above

#### Block Components
- `src/components/blocks/AIBlock.jsx` - Replaced by AIBlockRefined.jsx
- `src/components/blocks/AIBlockDebug.jsx` - Debug version (unused)
- `src/components/blocks/ResponsiveCodeBlock.jsx` - Not actively used
- `src/components/blocks/TextBlockEnhanced.jsx` - Not used (TextBlock.jsx is used)
- `src/components/blocks/GitGraphBranching.jsx` - Git graph visualization (unused)
- `src/components/blocks/TimelineBranch.jsx` - Timeline branch (unused)
- `src/components/blocks/IssueTrackerBlock.jsx` - Replaced by OptimizedIssueTrackerBlock.jsx

#### Contexts
- `src/contexts/AuthContext.jsx` - Replaced by AuthContextOptimized.jsx
- `src/contexts/SupabaseContext.jsx` - Supabase context (unused)

#### Utilities
- `src/utils/storage/storageWrapperFixed.js` - Fixed storage wrapper (unused)
- `src/utils/storage/eventAwareStorageWrapper.js` - Event aware wrapper (unused)
- `src/utils/storage/useStorage.js` - Storage hook (unused)
- `src/utils/storage/SupabaseAdapter.js` - Old Supabase adapter (replaced by Optimized)
- `src/utils/blockStreamer.js` - Block streaming (unused)
- `src/utils/paginatedBlockLoader.js` - Pagination loader (unused)
- `src/utils/optimizedBlockLoader.js` - Old optimization (unused)
- `src/utils/folderCache.js` - Folder caching (unused)
- `src/utils/documentSaveManager.js` - Save manager (unused)
- `src/utils/dataExport.js` - Data export utilities (unused)
- `src/utils/domHelpers.js` - DOM helpers (unused)
- `src/utils/debugHelpers.js` - Debug helpers (only used in debug console)

#### Hooks
- `src/hooks/use3DCard.js` - 3D card effect (unused)
- `src/hooks/useBatchLoader.js` - Batch loading (may be used indirectly)
- `src/hooks/useHover.js` - Hover detection (unused)
- `src/hooks/useFolders.js` - Folder management (may be used indirectly)
- `src/hooks/useDatabaseUsage.js` - Database usage tracking (unused)
- `src/hooks/useOptimizedMouseTracking.js` - Mouse tracking (unused)
- `src/hooks/useOptimizedStorage.js` - Optimized storage (unused)

#### Hero Animation Components
- Most files in `src/components/HeroBackgroundAnimation/` except:
  - `EliteGradient.jsx` - Main gradient animation (used)
  - `index.jsx` - Export file (used)

## Testing & Debugging

### Performance Monitoring
- Built-in performance monitor: `Cmd/Ctrl + Shift + P`
- System health monitor: `Cmd/Ctrl + Shift + H`
- Animation performance tracking in `src/utils/animationPerformance.js`

### Common Debugging Scenarios
1. **Block rendering issues**: Check `BlockErrorBoundary.jsx` and parent container
2. **Storage issues**: Check IndexedDB/Supabase adapters and network status
3. **Performance issues**: Profile with DevTools, check for re-renders
4. **State issues**: Check event bus and hook dependencies
5. **Save issues**: Check SyncEngine and storage adapter chain

### Test Files
- Unit tests in `src/utils/__tests__/`
- Test runner: Vitest (import statements present but may need configuration)
- Key test files:
  - `src/utils/__tests__/sanitization.test.js` - Input sanitization tests
  - `src/utils/__tests__/LRUCache.test.js` - Cache implementation tests
  - Note: No test script configured in package.json

## Key Dependencies
- **React 19** with Strict Mode
- **Vite** for build tooling
- **Supabase** for cloud storage and auth
- **Framer Motion** for animations
- **React Window** for virtualization
- **Prism React Renderer** for syntax highlighting
- **DND Kit** for drag and drop
- **LZ-String** for compression
- **Zustand** for minimal global state

## Environment Configuration
- Uses Vite environment variables
- Supabase credentials required for cloud features
- Sentry integration for error tracking in production

## Database Schema (Supabase)
- **documents** table: Stores document metadata
- **blocks** table: Stores individual blocks with JSONB data
- Row Level Security (RLS) ensures data isolation per user
- Atomic save operations via PostgreSQL functions

## Development Tips
1. **Always run `npm run lint` before committing** - catches common issues
2. **Test with 10x expected data** - ensure scalability
3. **Check container components first** when debugging
4. **Use existing libraries** before writing custom solutions
5. **Add strategic logging** when debugging unclear issues
6. **Follow the 16ms frame budget** for smooth animations
7. **Use the event bus** for cross-component communication
8. **Check AI-MEMORY and rules.md** for patterns and protocols

## AI-MEMORY Documentation System

The `/AI-MEMORY/` directory is the single source of truth for AI assistants and developers:

### Structure:
```
/AI-MEMORY/
├── NOW.md           # Current active work (update as you work)
├── PATTERNS.md      # Known issues and proven fixes (check first!)
├── DECISIONS.md     # Architecture decisions and rationale
└── archive/         # Completed work (auto-dated files)
```

### Usage Protocol:
1. **Starting Work**: Check PATTERNS.md first for known issues
2. **During Work**: Update NOW.md with progress and discoveries
3. **Finding Issues**: Add new patterns to PATTERNS.md immediately
4. **Architecture Changes**: Document reasoning in DECISIONS.md
5. **Completing Work**: Archive NOW.md with date prefix

### Key Benefits:
- **Fast Discovery**: 3 files instead of 90+ scattered docs
- **Pattern Matching**: Prevents repeated debugging
- **Context Preservation**: Explains why code exists
- **Status Tracking**: NOW.md shows current work instantly

This system follows Rule 33 from rules.md but with better organization.