# Devlog Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Technology Stack](#technology-stack)
5. [Component Architecture](#component-architecture)
6. [Database Schema](#database-schema)
7. [Features](#features)
8. [API Structure](#api-structure)
9. [Development Setup](#development-setup)
10. [Best Practices](#best-practices)

---

## Project Overview

### What is Devlog?

**Devlog** is a sophisticated developer-focused knowledge management system that transforms the chaos of learning, debugging, and building into an interconnected knowledge system. It's built on the philosophy that every line of code, every debugging session, and every "aha!" moment deserves to be captured and connected.

### Core Philosophy

- **Block-Based System**: Everything is a block - from simple text notes to complex code snippets, AI conversations, and structured data
- **Speed-First Design**: Optimized for developer workflows with keyboard shortcuts, slash commands, and instant formatting
- **Interconnected Knowledge**: Documents link naturally through a personal knowledge graph using `[[document links]]`
- **Developer-Centric**: Built specifically for capturing code context, debugging sessions, and technical documentation

### Target Users

- Software developers documenting their learning journey
- Teams needing to preserve technical knowledge
- Developers who frequently work with AI assistants (ChatGPT, Claude, etc.)
- Anyone building a technical knowledge base

### Key Differentiators

1. **AI Conversation Preservation**: Never lose valuable AI assistant explanations
2. **Code-Aware Blocks**: Syntax highlighting, file path tracking, and collapsible sections
3. **Offline-First Architecture**: Works without internet, syncs when connected
4. **Infinite Canvas**: No limits on document structure or content organization

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  React 19 SPA + Vite + Tailwind CSS             │
│  ┌───────────────────────────────────────────┐  │
│  │  Components  │  Hooks  │  Utils  │  Pages │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │         Context Providers                  │  │
│  │  Auth │ Settings │ Sidebar │ Toast        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────┘
                      │
                      │ HTTPS/WSS
                      │
┌─────────────────────┴───────────────────────────┐
│                Backend Services                  │
│  ┌────────────────┐    ┌────────────────────┐  │
│  │   Supabase     │    │  Vercel Functions  │  │
│  │  PostgreSQL    │    │   API Endpoints    │  │
│  │  Auth + RLS    │    │   MCP Integration  │  │
│  └────────────────┘    └────────────────────┘  │
└──────────────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────┐
│              Storage Layer                       │
│  ┌────────────────┐    ┌────────────────────┐  │
│  │   IndexedDB    │    │  Supabase Storage  │  │
│  │  (Local Cache) │    │  (Cloud Persist)   │  │
│  └────────────────┘    └────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **React 19 with Vite**: Latest React features with fast HMR development
2. **Supabase Backend**: PostgreSQL with built-in auth and real-time subscriptions
3. **Hybrid Storage**: Cloud-first with IndexedDB fallback for offline support
4. **Row Level Security (RLS)**: Database-level security for multi-tenant isolation
5. **Component-Based Architecture**: Reusable, testable UI components
6. **Context-Based State Management**: React Context API for global state
7. **Vercel Deployment**: Serverless functions and edge deployment

---

## Directory Structure

```
/mnt/f/devlog-/
├── src/                       # Frontend source code
│   ├── components/            # React components (140+ files)
│   │   ├── blocks/           # Block-specific components
│   │   ├── HeroBackgroundAnimation/
│   │   ├── ProjectExplorer/
│   │   └── debug/            # Debug components
│   ├── pages/                # Route pages
│   │   ├── auth/            # Authentication pages
│   │   ├── compare/         # Comparison pages
│   │   ├── features/        # Feature showcase pages
│   │   ├── guides/          # User guides
│   │   └── settings/        # Settings pages
│   ├── hooks/                # Custom React hooks (21 files)
│   ├── contexts/             # React Context providers
│   ├── services/             # Service layer
│   ├── utils/                # Utility functions
│   ├── lib/                  # External libraries
│   ├── data/                 # Static data
│   ├── styles/               # Global styles
│   └── test/                 # Test files
├── api/                      # Backend API
│   ├── mcp/                 # MCP integration endpoints
│   ├── lib/                 # API utilities
│   └── _utils/              # Shared utilities
├── supabase/                 # Database configuration
│   └── migrations/          # SQL migrations (22 files)
├── docs/                     # Documentation
│   ├── api/                # API documentation
│   ├── billing/            # Billing documentation
│   ├── database/           # Database schema docs
│   ├── deployment/         # Deployment guides
│   ├── mcp/                # MCP integration docs
│   └── project/            # Project documentation
├── public/                   # Static assets
├── scripts/                  # Build and utility scripts
├── test-scripts/            # Testing scripts
├── migrations/              # Additional migrations
└── MCP/                     # MCP server configurations
```

### Key Directories

- **`src/components/`**: 140+ React components including blocks, UI elements, and page sections
- **`src/hooks/`**: 21 custom hooks for state management, data fetching, and UI interactions
- **`src/pages/`**: Route-based page components with nested feature pages
- **`supabase/migrations/`**: 22 SQL migration files tracking database evolution
- **`api/mcp/`**: Model Context Protocol integration for AI assistants

---

## Technology Stack

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | 19.1.0 | UI library |
| **Build Tool** | Vite | 6.3.5 | Fast HMR and bundling |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **Animation** | Framer Motion | 12.23.6 | Smooth animations |
| **Animation** | GSAP | 3.12.5 | Complex animations |
| **Routing** | React Router | 6.28.2 | Client-side routing |
| **State** | Zustand | 4.5.0 | State management |
| **DnD** | @dnd-kit | 6.1.0 | Drag and drop |
| **Math** | KaTeX | 0.16.9 | Math rendering |
| **Icons** | Lucide React | 0.513.0 | Icon library |
| **Code** | Prism React | 2.4.1 | Syntax highlighting |

### Backend Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| **Database** | Supabase/PostgreSQL | Primary database |
| **Auth** | Supabase Auth | Authentication |
| **Storage** | Supabase Storage | File storage |
| **Functions** | Vercel Functions | Serverless API |
| **Caching** | IndexedDB (Dexie) | Local storage |

### Development Tools

| Category | Technology | Purpose |
|----------|------------|---------|
| **Linting** | ESLint 9.25.0 | Code quality |
| **CSS Processing** | PostCSS | CSS transformations |
| **CSS Optimization** | LightningCSS | Fast CSS processing |
| **Monitoring** | Sentry | Error tracking |
| **Type Checking** | TypeScript (JSDoc) | Type safety |

---

## Component Architecture

### Core Component Categories

#### 1. Block Components
- **TextBlock**: Markdown-enabled text with live preview
- **CodeBlock**: Syntax-highlighted code with language detection
- **AIBlock**: Preserved AI conversations with formatting
- **TableBlock**: Structured data tables
- **FileTreeBlock**: Visual file structure representation
- **HeadingBlock**: H1-H6 headers with auto-ID generation

#### 2. Layout Components
- **Layout**: Main application wrapper
- **Dashboard**: Primary workspace view
- **ResponsiveLayout**: Adaptive mobile/desktop layouts
- **MobileOptimizedLayout**: Touch-optimized mobile views

#### 3. Editor Components
- **BlockControls**: Block manipulation controls
- **InlineActionBar**: Context-sensitive editing toolbar
- **FloatingToolbar**: Selection-based formatting tools
- **DocumentToolbar**: Document-level operations

#### 4. UI Components
- **ShareDialog**: Advanced sharing with multiple variants
- **CommandPalette**: Keyboard-driven navigation
- **VirtualizedGrid**: Performance-optimized grid rendering
- **ImageViewer**: Zoomable image display with controls

### Context Providers

```javascript
// Authentication Context
AuthContextOptimized
├── User management
├── Session handling
└── Supabase client

// Settings Context
SettingsContext
├── User preferences
├── Theme settings
└── Feature flags

// Sidebar Context
SidebarContext
├── Navigation state
├── Document tree
└── Folder management
```

### Component Communication

```
User Input → Component → Hook → Context/Service → API → Database
     ↑                                                        ↓
     └──────────── State Update ← Response ←─────────────────┘
```

---

## Database Schema

### Core Tables

#### 1. **users** (Supabase Auth)
- Standard Supabase auth schema
- Extended with profiles table for additional data

#### 2. **documents**
```sql
documents
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── folder_id (UUID, FK → folders)
├── title (TEXT)
├── preview (TEXT)
├── blocks (JSONB[])
├── tags (TEXT[])
├── is_favorite (BOOLEAN)
├── position (INTEGER)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

#### 3. **blocks**
```sql
blocks
├── id (UUID, PK)
├── document_id (UUID, FK → documents)
├── type (TEXT)
├── content (TEXT)
├── metadata (JSONB)
├── position (INTEGER)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

#### 4. **folders**
```sql
folders
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── parent_id (UUID, FK → folders)
├── name (TEXT)
├── color (TEXT)
├── icon (TEXT)
├── path (TEXT)
├── is_expanded (BOOLEAN)
├── is_favorite (BOOLEAN)
├── position (INTEGER)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

#### 5. **shared_documents**
```sql
shared_documents
├── id (UUID, PK)
├── document_id (UUID, FK → documents)
├── share_code (TEXT, UNIQUE)
├── password_hash (TEXT)
├── expires_at (TIMESTAMPTZ)
├── view_count (INTEGER)
├── max_views (INTEGER)
├── settings (JSONB)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

#### 6. **api_keys**
```sql
api_keys
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── name (TEXT)
├── key_hash (TEXT)
├── key_preview (TEXT)
├── permissions (JSONB)
├── last_used_at (TIMESTAMPTZ)
├── expires_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
└── revoked_at (TIMESTAMPTZ)
```

### Row Level Security (RLS)

All tables implement RLS policies:
- Users can only access their own data
- Shared documents have public read with optional password
- API keys are strictly user-scoped

### Database Functions

Key stored procedures:
- `save_document_blocks_optimized()`: Atomic document save
- `create_document_with_folder_check()`: Folder-aware document creation
- `generate_share_code()`: Unique share code generation
- `update_folder_path()`: Materialized path maintenance

---

## Features

### 1. Block-Based Editing System

**Implementation**: Component-based architecture with dynamic block types

**Features**:
- Live markdown preview
- Syntax highlighting for 20+ languages
- Drag-and-drop reordering
- Collapsible sections
- Inline image support
- Tag system with visual badges

### 2. AI Conversation Preservation

**Implementation**: Specialized AIBlock component with formatting preservation

**Features**:
- Maintains conversation structure
- Code block extraction
- Searchable AI responses
- Export capabilities

### 3. Document Linking & Knowledge Graph

**Implementation**: `[[document]]` syntax with real-time link resolution

**Features**:
- Bidirectional linking
- Link preview on hover
- Orphaned document detection
- Visual knowledge graph (planned)

### 4. Smart Sync System

**Implementation**: Hybrid storage with conflict resolution

```javascript
Cloud (Supabase) ←→ Sync Engine ←→ Local (IndexedDB)
                        ↓
                  Conflict Resolution
                        ↓
                   Merged State
```

**Features**:
- Offline-first operation
- Automatic background sync
- Conflict detection and resolution
- Sync status indicators

### 5. Advanced Search

**Implementation**: Full-text search with tag filtering

**Features**:
- Instant search across all documents
- Tag-based filtering
- Search within code blocks
- Search history

### 6. Responsive Design

**Implementation**: Adaptive layouts with touch optimization

**Features**:
- Desktop, tablet, and mobile layouts
- Touch gestures (swipe, pinch-zoom)
- Mobile-specific controls
- Progressive Web App support

### 7. Performance Optimization

**Implementation**: Virtual scrolling, lazy loading, and caching

**Features**:
- Virtual grid for large document lists
- Lazy component loading
- Image optimization
- Service worker caching

---

## API Structure

### Vercel API Functions

#### `/api/mcp/*` - MCP Integration Endpoints

```javascript
// List available MCP tools
GET /api/mcp/tools

// Execute MCP tool
POST /api/mcp/tools/:toolName
Body: { parameters: {...} }

// List MCP resources
GET /api/mcp/resources

// Read MCP resource
GET /api/mcp/resources/:resourceId
```

#### `/api/health` - Health Check

```javascript
GET /api/health
Response: {
  status: "healthy",
  timestamp: "2024-01-15T10:00:00Z",
  services: {
    database: "connected",
    storage: "connected"
  }
}
```

### Authentication

All API endpoints require authentication via:
1. Supabase JWT token (preferred)
2. API key (for MCP integration)

```javascript
Headers: {
  "Authorization": "Bearer <token>",
  "X-API-Key": "<api-key>" // Alternative
}
```

### Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per user
- Stored in `rate_limit_logs` table

---

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/devlog.git
cd devlog

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure environment variables
# Edit .env.local with your Supabase credentials
```

### Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sentry (Optional)
VITE_SENTRY_DSN=your-sentry-dsn

# MCP Configuration (Optional)
VITE_MCP_SERVER_URL=http://localhost:3000
```

### Local Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Database Setup

```bash
# Apply migrations (via Supabase Dashboard or CLI)
supabase db push

# Seed initial data (optional)
npm run seed
```

### Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Test mobile responsiveness
npm run test:mobile
```

---

## Best Practices

### Code Organization

#### 1. Component Structure
```javascript
// Component file structure
ComponentName.jsx
├── Import statements (grouped by type)
├── Component definition
├── PropTypes/TypeScript types
├── Styled components (if any)
└── Export statement
```

#### 2. Hook Patterns
```javascript
// Custom hook structure
function useCustomHook(initialValue) {
  // State declarations
  const [state, setState] = useState(initialValue);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Callbacks
  const handleAction = useCallback(() => {
    // Action logic
  }, [dependencies]);
  
  // Return values
  return { state, handleAction };
}
```

### Performance Optimization

#### 1. Component Optimization
- Use `React.memo` for expensive components
- Implement `useMemo` for complex calculations
- Apply `useCallback` for stable function references
- Lazy load route components

#### 2. Data Fetching
- Implement pagination for large datasets
- Use virtual scrolling for long lists
- Cache API responses in IndexedDB
- Debounce search inputs

#### 3. Bundle Optimization
- Code split by route
- Lazy load heavy dependencies
- Use dynamic imports for optional features
- Optimize images with responsive sizing

### Security Considerations

#### 1. Authentication
- Always validate JWT tokens
- Implement refresh token rotation
- Use secure HTTP-only cookies for sensitive data
- Enable MFA for user accounts

#### 2. Data Protection
- Sanitize all user inputs
- Use parameterized queries
- Implement RLS at database level
- Encrypt sensitive data at rest

#### 3. API Security
- Rate limit all endpoints
- Validate API key permissions
- Log suspicious activities
- Implement CORS properly

### Development Workflow

#### 1. Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/new-feature
# Make changes
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create PR for review
```

#### 2. Code Review Checklist
- [ ] Code follows style guide
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] Performance impact assessed
- [ ] Security implications reviewed
- [ ] Accessibility standards met

#### 3. Deployment Process
1. Merge to main branch
2. Automated tests run
3. Build process triggered
4. Deploy to Vercel
5. Run smoke tests
6. Monitor error rates

### Monitoring & Debugging

#### 1. Error Tracking
- Sentry integration for production errors
- Console logging for development
- Performance monitoring with Web Vitals
- User session replay for debugging

#### 2. Performance Monitoring
```javascript
// Performance tracking example
import { measurePerformance } from './utils/performance';

measurePerformance('component-render', () => {
  // Component logic
});
```

#### 3. Debug Tools
- React DevTools for component inspection
- Redux DevTools for state debugging
- Network tab for API monitoring
- Lighthouse for performance audits

---

## Conclusion

Devlog represents a sophisticated approach to developer knowledge management, combining modern web technologies with thoughtful UX design. The architecture prioritizes performance, offline capability, and developer experience while maintaining security and scalability.

### Key Strengths
- Robust offline-first architecture
- Flexible block-based content system
- Strong security with RLS
- Excellent developer experience
- Comprehensive feature set

### Future Enhancements
- Visual knowledge graph
- Collaborative editing
- Advanced AI integrations
- Plugin system
- Mobile applications

For questions or contributions, please refer to the project's GitHub repository or contact the development team.

---

*Last Updated: January 2025*
*Version: 1.0.0*