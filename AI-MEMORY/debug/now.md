# Active: None

Last resolved: Documents disappearing after Settings navigation (2026-01-18)

## Resolved: Documents Disappear After Settings Navigation - 2026-01-18

**Symptom**: Navigating to Settings and back caused documents to disappear from sidebar (only tab documents remained). Folders survived.

**Cause**: `useRxDocuments` (use-documents.ts:99-102) cleared documents array when `user?.id` was undefined:
```typescript
if (!db || !collection || !enabled || !user?.id) {
  setDocuments([]);  // <-- BUG: cleared on auth loading
}
```
On Dashboard remount, auth context takes a moment to provide `user.id`, causing a flash of empty documents.

**Fix**: Split the condition - don't clear documents when waiting for auth:
```typescript
if (!db || !collection || !enabled) {
  return; // Don't clear
}
if (!user?.id) {
  return; // Wait for auth, keep existing data
}
```

**Files**: `src/shared/db/hooks/use-documents.ts`, `src/shared/db/hooks/use-folders.ts`

**Check First**: When RxDB hooks clear data unexpectedly, check if auth dependency is causing premature clear.

---

Last resolved before: Folder disappearing on move to subfolder (2026-01-16)
