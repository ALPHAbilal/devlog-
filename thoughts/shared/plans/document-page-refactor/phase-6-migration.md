# Phase 6: Strangler Fig Migration

> **Goal**: Safely swap new architecture in, remove old code, complete the refactor.

**Status**: Overview Only - Will generate detailed plan when starting this phase.

---

## Best Practices for This Phase

### Feature Flag Rules
1. **Simple boolean flags** - `useNewEditor()` returns true/false
2. **LocalStorage for persistence** - Easy to toggle during testing
3. **Flag per feature, not file** - One flag controls entire new system
4. **Default to old code** - New code is opt-in until stable
5. **Remove flags after migration** - Don't leave dead flags

### Gradual Rollout Rules
1. **Developers first** - Internal testing before anyone else
2. **Fix all issues before expanding** - No known bugs during rollout
3. **Monitor error rates** - Watch Sentry/logs during rollout
4. **Quick rollback capability** - One setting change to revert
5. **2+ weeks stable before deletion** - Don't delete old code too fast

### Parallel Running Rules
1. **Both systems must work** - Old and new simultaneously
2. **Shared data layer** - Both use same repository/Supabase
3. **No data migration needed** - Same schema, different UI
4. **Test switching back and forth** - Toggle should be seamless
5. **Document differences** - Track any behavior changes

### Code Deletion Rules
1. **Only delete after 2+ weeks stable** - Patience prevents disasters
2. **Delete in dependency order** - Leaf files first
3. **Run full test suite after each deletion** - Catch breaking changes
4. **Git preserves history** - Delete confidently, can recover
5. **Update imports before deletion** - Fix references first

### Rollback Strategy Rules
1. **Feature flag is primary rollback** - Instant, no deploy needed
2. **Keep old code working** - Don't break it during transition
3. **Database is shared** - No schema changes during migration
4. **Test rollback explicitly** - Actually test switching back
5. **Document rollback steps** - Anyone can rollback if needed

### Cleanup Rules
1. **Remove feature flag code** - After old code deleted
2. **Remove dual-render logic** - Keep only new path
3. **Update documentation** - Remove references to old code
4. **Run dead code detection** - Catch orphaned files
5. **Final dependency audit** - Ensure clean import graph

---

## Objectives

1. Create feature flag for new document editor
2. Wire new components alongside old
3. Test with flag enabled
4. Gradual rollout
5. Remove old code
6. Final cleanup

---

## Strangler Fig Strategy

```
                    BEFORE                              AFTER

┌─────────────────────────┐            ┌─────────────────────────┐
│    Dashboard.jsx        │            │    Dashboard.tsx        │
│         │               │            │         │               │
│         ▼               │            │         ▼               │
│  ExpandedViewEnhanced   │   ──────►  │   DocumentEditor        │
│     (2,570 lines)       │            │     (<200 lines)        │
│         │               │            │         │               │
│         ▼               │            │         ▼               │
│    Old Block System     │            │   New Block System      │
│    (no contracts)       │            │   (TypeScript)          │
│         │               │            │         │               │
│         ▼               │            │         ▼               │
│   5+ Cache Layers       │            │   Repository Layer      │
└─────────────────────────┘            └─────────────────────────┘
```

---

## Migration Path

### Step 1: Feature Flag
```typescript
// app/providers/FeatureFlags.tsx
const useNewEditor = () => {
  // Start with false, enable for testing
  return localStorage.getItem('newEditor') === 'true';
};
```

### Step 2: Dual Render
```tsx
// pages/Dashboard.tsx
const Dashboard = () => {
  const useNew = useNewEditor();

  return useNew
    ? <DocumentEditor {...props} />     // New
    : <ExpandedViewEnhanced {...props} /> // Old (temporary)
};
```

### Step 3: Testing & Rollout
- Enable for developers first
- Fix any issues found
- Enable for beta users
- Fix any issues found
- Enable for everyone

### Step 4: Remove Old Code
- Delete ExpandedViewEnhanced.jsx
- Delete old hooks
- Delete old cache code
- Clean up imports

---

## High-Level Steps

1. Create feature flag system
2. Wire new editor alongside old
3. Test extensively with flag on
4. Fix issues discovered
5. Enable for all users
6. Remove old ExpandedViewEnhanced
7. Remove old cache files
8. Remove old hooks
9. Final cleanup pass
10. Update documentation

---

## Success Criteria

### Automated
- [ ] Build succeeds without old files
- [ ] All tests pass
- [ ] No references to deleted files
- [ ] TypeScript coverage at 100%
- [ ] Dependency Cruiser shows clean architecture

### Manual
- [ ] All features work identically
- [ ] Performance same or better
- [ ] No user-reported issues
- [ ] Clean codebase with no dead code

---

## Files to Remove (After Migration)

```bash
# Old components
src/components/ExpandedViewEnhanced.jsx
src/components/ExpandedView.jsx  # if still exists

# Old hooks (replaced by repository)
src/hooks/usePaginatedBlockLoader.js
src/hooks/useOptimizedBlockLoader.js
src/hooks/useIndexedDBCache.js

# Old caches (replaced by TanStack Query)
src/utils/sessionCache.js
src/utils/optimizedBlockLoader.js
src/utils/storage/MultiLayerStorage.js  # if fully replaced

# Old utilities
src/utils/smartSync.js  # if replaced by repository
```

---

## Rollback Plan

If issues arise after enabling new editor:

1. Set feature flag to false (instant rollback)
2. Fix issues in new code
3. Re-enable flag
4. Only delete old code after 2+ weeks stable

---

## Estimated Duration

~1 week (after new code is fully working)

---

## Depends On

- Phase 5 complete (new components built and tested)

---

## Detailed Plan

*To be generated when this phase starts.*

---

*Phase 6 of Document Page Architecture Refactor*
