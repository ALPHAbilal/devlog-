# RxDB + Supabase Bugs

## loadInitial returns undefined - 2025-01-11
**Symptom**: `Cannot read properties of undefined (reading 'then')` in Dashboard
**Cause**: `useRxDocuments.loadInitial()` returned void, Dashboard called `.then()`
**Fix**: `return Promise.resolve()` in loadInitial, loadMore, reset
**Check First**: Does hook return Promise for API compat with legacy code?

## profiles.single() 406 error - 2025-01-11
**Symptom**: `PGRST116: JSON object requested, multiple (or no) rows returned`
**Cause**: `.single()` expects exactly 1 row, user has no profile
**Fix**: Change `.single()` to `.maybeSingle()` in settings-provider.tsx
**Check First**: Use `.maybeSingle()` when row may not exist

## WebSocket Lazy Init - 2025-01-11
**Symptom**: `Cannot read 'channel' of undefined` on replication start
**Cause**: Supabase v2 WebSocket doesn't exist until first `.subscribe()`
**Fix**: Call `supabase.channel().subscribe()` BEFORE `replicateSupabase()`
**Check First**: Is `ensureSupabaseRealtimeReady()` called before replication?

## Dead Library Constructor - 2025-01-09
**Symptom**: `Cannot read 'push' of undefined` in rxdb-supabase
**Cause**: `rxdb-supabase` npm package is dead (RxDB 14 only, abandoned 2023)
**Fix**: Use official `rxdb/plugins/replication-supabase` (v16.19.0+)
**Check First**: Never use `rxdb-supabase`, always official plugin

## Null vs Undefined - 2025-01-11
**Symptom**: RxDB schema validation fails on Supabase data
**Cause**: Supabase returns `null`, RxDB expects `undefined`
**Fix**: `pull.modifier` that converts `null` → `delete doc[key]`
**Check First**: Does pull.modifier handle nulls?

## Replications Show Inactive - 2025-01-11
**Symptom**: Logs show "Inactive" immediately after "Started"
**Cause**: Normal - means no pending changes to sync
**Fix**: Not a bug. Active only when syncing data.
**Check First**: Check if data actually exists to sync

## live:true channel error - 2025-01-11 (IN PROGRESS)
**Symptom**: `Cannot read 'channel' of undefined` after "Started"
**Cause**: RxDB plugin internal issue with Supabase Realtime
**Fix**: Testing with `live: false` to isolate
**Check First**: Does `live: false` allow data to pull successfully?
