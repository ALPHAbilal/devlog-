# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Read rules.md First
**CRITICAL**: Before working on this codebase, read the `rules.md` file which contains mandatory debugging protocols and strategic development rules learned from actual debugging sessions. These rules will prevent common mistakes and save significant time.

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

#### 2. Block System
- Block types defined in `src/components/blocks/`
- Each block type has specific metadata stored in JSONB
- Position-based ordering for blocks within documents
- Block rendering coordinated through `src/components/Block.jsx`

#### 3. Performance Optimizations
- **Virtualization**: React-window for list rendering
- **Lazy Loading**: Components loaded on demand
- **Optimistic Updates**: Instant UI feedback before database sync
- **Debounced Saves**: Prevents overwrites during rapid typing
- **Background Operations**: All storage operations are async

#### 4. State Management
- No centralized state management library (no Redux/MobX)
- React hooks for local state management
- Custom hooks in `src/hooks/` for shared logic
- Event-driven updates using `src/utils/eventBus.js`

## Important Development Practices

### Critical: Follow rules.md Protocol
The `rules.md` file contains comprehensive debugging protocols and strategic development rules that MUST be followed. Key highlights:
- **Container Rule**: Always check parent/container before component
- **Measurement Manifesto**: Profile and measure before optimizing
- **Collaborative Loop Protocol**: Add logs, test, share terminal.md when stuck
- **Performance Budgets**: 16ms for animations, 100ms for interactions
- Detailed debugging checklists and error patterns

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
├── components/
│   ├── blocks/          # Individual block type components
│   ├── Block.jsx        # Main block renderer
│   └── ...             # UI components
├── hooks/              # Custom React hooks
├── pages/              # Route components
├── services/           # Business logic services
├── utils/
│   ├── storage/        # Storage adapters
│   └── ...            # Utility functions
└── main.jsx           # App entry point
```

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

## Key Dependencies
- **React 19** with Strict Mode
- **Vite** for build tooling
- **Supabase** for cloud storage and auth
- **Framer Motion** for animations
- **React Window** for virtualization
- **Prism React Renderer** for syntax highlighting
- **DND Kit** for drag and drop

## Environment Configuration
- Uses Vite environment variables
- Supabase credentials required for cloud features
- Sentry integration for error tracking in production

## Development Tips
1. **Always run `npm run lint` before committing** - catches common issues
2. **Test with 10x expected data** - ensure scalability
3. **Check container components first** when debugging
4. **Use existing libraries** before writing custom solutions
5. **Add strategic logging** when debugging unclear issues
6. **Follow the 16ms frame budget** for smooth animations