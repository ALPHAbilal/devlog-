# Active: RxDB live:true channel error

**Started**: 2025-01-11

## Symptom
- `Cannot read properties of undefined (reading 'channel')` after replication "Started"

## Attempts
1. Schema check → ✅ Tables have `_modified`, `_deleted`, data exists (392 docs)
2. WebSocket test channel → ✅ SUBSCRIBED works
3. Set `live: false` → Testing now

## Next
- If `live: false` works → Issue is Realtime channel creation in RxDB plugin
- Check RxDB plugin version compatibility with Supabase v2.46.2
