# Phase 4: Data Layer (Repository Pattern)

> **Goal**: Create unified data layer using TanStack Query + Dexie, replacing 5+ overlapping caches.

**Status**: Overview Only - Will generate detailed plan when starting this phase.

---

## Best Practices for This Phase

### Single Source of Truth Rules
1. **One cache, one truth** - TanStack Query is THE cache
2. **Components never access Supabase directly** - Always through repository
3. **Dexie is for offline, not caching** - Persistence, not performance
4. **Invalidate, don't update manually** - Let Query refetch
5. **Optimistic updates via Query** - Not manual setState

### Repository Pattern Rules
1. **Repository is async** - Always returns Promise
2. **Repository handles errors** - Components get clean data or error
3. **Repository is stateless** - No internal state, use Query cache
4. **Repository is testable** - Easy to mock for tests
5. **Repository abstracts source** - Components don't know Supabase vs Dexie

### Offline-First Rules
1. **Write to Dexie first** - Instant local persistence
2. **Queue for Supabase** - Background sync when online
3. **Handle conflicts** - Last-write-wins or merge strategy
4. **Show sync status** - User knows when synced
5. **Work fully offline** - No features require network

### TanStack Query Rules
1. **Queries for reads** - `useQuery` for fetching
2. **Mutations for writes** - `useMutation` for changes
3. **Invalidate after mutation** - Keep cache fresh
4. **Stale time = 5 min** - Documents don't change often
5. **Cache time = 30 min** - Keep data for back navigation

### Data Integrity Rules
1. **Validate on read** - Zod parse from Supabase
2. **Validate on write** - Zod parse before Supabase
3. **IDs are UUIDs** - Never sequential, always random
4. **Timestamps are ISO strings** - Consistent format
5. **Soft delete with deleted_at** - Never hard delete

### Migration Rules
1. **Replace one cache at a time** - sessionCache first
2. **Feature flag new data layer** - Toggle back if issues
3. **Monitor cache hit rate** - Should improve, not regress
4. **Test offline thoroughly** - Airplane mode testing

---

## Objectives

1. Create `DocumentRepository` (abstracts Supabase + Dexie)
2. Create `BlockRepository` (abstracts block storage)
3. Replace sessionCache with TanStack Query
4. Replace optimizedBlockLoader with repository
5. Implement single cache coordinator
6. Offline-first with background sync

---

## Architecture (Preview)

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│                                                          │
│   useDocument(id)      useBlocks(docId)                 │
└────────────┬─────────────────────┬──────────────────────┘
             │                     │
             ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Repository Layer                       │
│                                                          │
│   DocumentRepository         BlockRepository             │
│   - getDocument()           - getBlocks()               │
│   - saveDocument()          - updateBlock()             │
│   - deleteDocument()        - deleteBlock()             │
└────────────┬─────────────────────┬──────────────────────┘
             │                     │
     ┌───────┴───────┐     ┌──────┴──────┐
     ▼               ▼     ▼             ▼
┌─────────┐    ┌─────────┐    ┌─────────────┐
│TanStack │    │  Dexie  │    │  Supabase   │
│ Query   │    │ (Local) │    │  (Remote)   │
│(Cache)  │    │         │    │             │
└─────────┘    └─────────┘    └─────────────┘
```

---

## What Gets Replaced

| Current | Replaced By |
|---------|-------------|
| sessionCache | TanStack Query cache |
| optimizedBlockLoader cache | TanStack Query cache |
| MultiLayerStorage memoryCache | TanStack Query cache |
| usePaginatedBlockLoader | useBlocks() hook |
| useOptimizedBlockLoader | useBlocks() hook |
| useIndexedDBCache | Dexie reactive queries |

---

## High-Level Steps

1. Create `entities/Document/Document.repository.ts`
2. Create `entities/Block/Block.repository.ts`
3. Create TanStack Query hooks (`useDocument`, `useBlocks`)
4. Create Dexie schema for local storage
5. Implement sync logic (local-first, background sync)
6. Create migration from old caches
7. Test offline functionality

---

## Success Criteria

### Automated
- [ ] All document operations use repository
- [ ] All block operations use repository
- [ ] TanStack Query DevTools shows cache hits
- [ ] `npm run test` passes repository tests
- [ ] No references to old cache code

### Manual
- [ ] App works offline (Dexie)
- [ ] Changes sync when online (Supabase)
- [ ] No stale data issues
- [ ] Performance same or better

---

## Estimated Duration

~2 weeks

---

## Depends On

- Phase 3 complete (Block types defined)

---

## Detailed Plan

*To be generated when this phase starts.*

---

*Phase 4 of Document Page Architecture Refactor*
