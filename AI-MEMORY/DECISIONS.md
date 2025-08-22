# DECISIONS - Why Things Are This Way
> Before changing code, understand why it exists. Every complexity has a reason.

## 🏗️ Architecture Decisions

### 2025-01: Multi-Layer Storage Architecture
**Decision**: Memory Cache → IndexedDB → Supabase (3 layers)
**Why**: 
- Offline-first requirement for reliability
- Supabase downtime shouldn't break app
- IndexedDB provides 1GB+ local storage
**Tradeoff**: Added complexity vs 99.9% uptime
**Alternative Considered**: Direct Supabase only (rejected: too fragile)
**Impact**: 50ms latency for cache hits vs 200ms+ for network
**Files**: src/utils/storage/MultiLayerStorage.js

### 2025-01: Remove Virtualization from Document Viewer
**Decision**: Removed react-window virtualization
**Why**: 
- Typical documents have only 17 blocks
- Virtualization caused 8x re-renders
- Overhead exceeded benefit for small lists
**Metrics**: 
- Before: 8 re-renders per block update
- After: 1 re-render per block update
**Alternative**: Lazy loading with IntersectionObserver
**Files**: src/components/VirtualizedGrid.jsx (kept but unused)

### 2024-12: Event Bus for Cross-Component Communication
**Decision**: Custom event bus instead of Redux/Context
**Why**: 
- Avoids prop drilling for deeply nested components
- No need for centralized state management
- Lighter weight than Redux (2KB vs 30KB)
**Tradeoff**: Less predictable than Redux DevTools
**Pattern**: Pub/sub for document updates, block changes
**Files**: src/utils/eventBus.js

### 2024-11: Soft Delete for Blocks
**Decision**: Use deleted_at timestamp instead of hard delete
**Why**: 
- Undo/redo functionality planned
- Audit trail requirements
- Prevents accidental data loss
**Implementation**: Filter deleted_at IS NULL in queries
**Migration**: 20250131_fix_delete_blocks_issue.sql
**Impact**: +5% storage but enables recovery

## 🎨 UI/UX Decisions

### 2025-01: Custom Block Controls vs Library
**Decision**: Built custom block controls instead of using library
**Why**: 
- Specific hover/click interaction requirements
- Need fine control over positioning
- Libraries didn't support our exact UX
**Complexity**: 500+ lines of custom positioning logic
**Alternative Rejected**: Floating UI (too heavy, wrong interactions)
**Files**: src/components/BlockControls.jsx

### 2024-12: Framer Motion for Animations
**Decision**: Framer Motion over CSS animations
**Why**: 
- Gesture support needed for drag/drop
- Spring physics for natural feel
- Easier choreographed animations
**Bundle Impact**: +80KB gzipped
**Alternative**: CSS only (rejected: too limiting)
**Usage**: Layout animations, page transitions

### 2024-11: Tailwind CSS for Styling
**Decision**: Tailwind utilities over CSS-in-JS
**Why**: 
- Faster development iteration
- Smaller bundle with PurgeCSS
- Better IDE support
**Tradeoff**: HTML verbosity vs maintainability
**Result**: 70% reduction in CSS size
**Config**: tailwind.config.js with custom design tokens

## 🔒 Security Decisions

### 2025-01: Row Level Security (RLS) in Supabase
**Decision**: Database-level security vs application-level
**Why**: 
- Defense in depth principle
- Prevents API key exposure vulnerabilities
- Compliance with security best practices
**Implementation**: Every table has RLS policies
**Performance**: ~5ms overhead per query
**Files**: supabase/migrations/*_rls_*.sql

### 2024-12: API Key Management
**Decision**: Separate API keys from auth tokens
**Why**: 
- Different lifecycle (keys are long-lived)
- Different permissions model
- Easier to revoke/rotate
**Storage**: Encrypted in database, hashed for lookups
**Pattern**: Bearer token in Authorization header
**Files**: src/lib/api-auth.js

## ⚡ Performance Decisions

### 2025-01: 16ms Frame Budget Enforcement
**Decision**: Strict 16ms budget for all animations
**Why**: 
- 60fps requirement for smooth UX
- Mobile devices struggle above this
- User perception threshold
**Monitoring**: Performance.now() measurements
**Action**: Defer or optimize if over budget
**Files**: src/utils/animationPerformance.js

### 2024-12: LZ-String Compression
**Decision**: Compress all IndexedDB storage
**Why**: 
- 50-80% size reduction for text
- Extends storage quota significantly
- Fast enough for real-time (5ms for 100KB)
**Library**: LZ-String (6KB gzipped)
**Alternative**: Native compression API (rejected: browser support)
**Files**: src/utils/storage/CompressedStorageAdapter.js

### 2024-11: Debounced Auto-Save
**Decision**: 1-second debounce for saves
**Why**: 
- Prevents overwhelming the server
- Reduces race conditions
- Better for collaborative editing
**Pattern**: Trailing edge debounce
**User Feedback**: Save indicator shows pending state
**Files**: src/hooks/useAutoSave.js

## 🔧 Development Decisions

### 2025-01: Vite over Create React App
**Decision**: Migrated to Vite from CRA
**Why**: 
- 10x faster HMR (200ms vs 2s)
- Better tree shaking
- Native ESM support
**Migration Effort**: 2 days
**Result**: Dev server starts in 500ms vs 10s
**Config**: vite.config.js

### 2024-12: No TypeScript (Controversial)
**Decision**: Keep JavaScript instead of migrating to TS
**Why**: 
- Rapid prototyping phase
- Team not fully TS-experienced
- JSDoc provides enough type hints
**Tradeoff**: Runtime errors vs development speed
**Future**: May migrate once stable
**Mitigation**: Extensive JSDoc comments

### 2024-11: Monolithic Repo Structure
**Decision**: Single repo vs microservices
**Why**: 
- Easier deployment for small team
- Simpler local development
- Shared code without packages
**Tradeoff**: Scalability vs simplicity
**Future Split Point**: 100K+ users
**Structure**: /src for frontend, /api for backend

## 🚀 Deployment Decisions

### 2025-01: Vercel for Hosting
**Decision**: Vercel over AWS/GCP
**Why**: 
- Automatic preview deployments
- Built-in CDN and edge functions
- GitHub integration out of box
**Cost**: $20/month vs $100+ for equivalent AWS
**Limitations**: 50MB function size limit
**Config**: vercel.json

### 2024-12: Cloudflare Workers for MCP
**Decision**: Workers for MCP protocol implementation
**Why**: 
- WebSocket support at edge
- Durable Objects for state
- Global distribution
**Alternative**: Node.js server (rejected: scaling complexity)
**Files**: devlog-mcp-remote/

## 📝 Documentation Decisions

### 2025-01: AI-MEMORY System
**Decision**: Centralized AI/human documentation in /AI-MEMORY/
**Why**: 
- Previous system had 90+ scattered files
- Poor discoverability for AI assistants
- No clear status tracking
**Structure**: NOW.md (active) + PATTERNS.md + DECISIONS.md
**Migration**: Archive old docs to /AI-MEMORY/archive/
**Result**: 10x faster AI problem resolution

---

## 📋 Decision Template

When adding a new decision:

```markdown
### YYYY-MM: [Decision Name]
**Decision**: [What was decided]
**Why**: [Business/technical reasoning]
**Tradeoff**: [What we gave up]
**Alternative**: [What else was considered]
**Impact**: [Measurable result]
**Files**: [Where implemented]
```

Keep decisions **immutable** - don't edit past decisions, add new ones to reverse.