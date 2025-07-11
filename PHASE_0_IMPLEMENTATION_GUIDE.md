# Phase 0 Implementation Guide - Emergency Fixes

## 🚀 Quick Start Commands

### 1. Install New Dependencies

```bash
# Install security and monitoring dependencies
npm install isomorphic-dompurify @sentry/react @sentry/tracing

# Install testing dependencies (for next phase)
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

### 2. Apply Database Migrations

```bash
# Option A: Using Supabase CLI
supabase migration new fix_data_loss_atomic_saves
# Copy contents from migrations/20250131_001_fix_data_loss_atomic_saves.sql
supabase db push

supabase migration new fix_security_vulnerabilities  
# Copy contents from migrations/20250131_002_fix_security_vulnerabilities.sql
supabase db push

# Option B: Direct SQL execution in Supabase Dashboard
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Copy and paste each migration file
# 3. Run the SQL
```

### 3. Deploy Code Changes

```bash
# Commit the changes
git add .
git commit -m "fix: critical data loss bug and security vulnerabilities

- Implement atomic save operations with transaction support
- Fix memory leaks with LRU cache implementation  
- Add input sanitization to prevent XSS attacks
- Add rate limiting to prevent abuse
- Fix SECURITY DEFINER vulnerability"

# Deploy to production
npm run build
# Deploy via your hosting service (Vercel, Netlify, etc.)
```

## 📋 Verification Steps

### 1. Verify Database Fixes

Run these queries in Supabase SQL Editor:

```sql
-- Check if atomic save function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'save_document_blocks_atomic';

-- Check if rate limiting is working
SELECT check_rate_limit(auth.uid(), 'test_action', 5, 1);

-- Check if security tables exist
SELECT tablename 
FROM pg_tables 
WHERE tablename IN ('rate_limit_log', 'user_sessions', 'security_audit_log');

-- Verify SECURITY DEFINER view was fixed
SELECT viewname, definition 
FROM pg_views 
WHERE viewname = 'user_documents_with_block_count'
  AND definition NOT LIKE '%SECURITY DEFINER%';
```

### 2. Test Memory Management

Open browser console and run:

```javascript
// Check cache stats
sessionCache.getStats()

// Test memory limits
for(let i = 0; i < 200; i++) {
  sessionCache.cacheDocument({ id: `test-${i}`, title: `Test ${i}`, content: 'x'.repeat(10000) })
}
sessionCache.getStats() // Should show evictions
```

### 3. Test Input Sanitization

```javascript
// In browser console
import { sanitizeInput } from './src/utils/sanitization.js'

// Test XSS prevention
sanitizeInput('<script>alert("XSS")</script>Hello') // Should return "Hello"
sanitizeInput('<img src=x onerror=alert(1)>') // Should return safe HTML
```

## 🔄 Rollback Procedures

If issues arise, here's how to rollback:

### Database Rollback

```sql
-- Rollback atomic save function
DROP FUNCTION IF EXISTS save_document_blocks_atomic CASCADE;
DROP FUNCTION IF EXISTS save_document_blocks_safe CASCADE;
DROP FUNCTION IF EXISTS save_document_blocks CASCADE;
ALTER FUNCTION save_document_blocks_old RENAME TO save_document_blocks;

-- Rollback security fixes
DROP TABLE IF EXISTS rate_limit_log CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS security_audit_log CASCADE;
DROP TABLE IF EXISTS ip_rate_limit CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit CASCADE;
DROP FUNCTION IF EXISTS validate_password_strength CASCADE;
```

### Code Rollback

```bash
# Revert to previous commit
git revert HEAD
git push

# Or restore specific files
git checkout HEAD~1 -- src/utils/sessionCache.js
git checkout HEAD~1 -- src/utils/LRUCache.js
```

## 📊 Success Metrics

Monitor these metrics after deployment:

1. **Data Integrity**
   - Zero data loss incidents
   - All saves complete successfully
   - No empty blocks arrays being saved

2. **Performance**
   - Memory usage stays under 100MB
   - Cache hit rate > 80%
   - No browser crashes

3. **Security**
   - Zero XSS vulnerabilities
   - Rate limiting prevents abuse
   - No unauthorized access

## 🚨 Common Issues & Solutions

### Issue: Migration fails with "function already exists"

```sql
-- Drop existing function first
DROP FUNCTION IF EXISTS save_document_blocks_atomic CASCADE;
-- Then run migration again
```

### Issue: Import errors for sanitization

```javascript
// Make sure to install the dependency
npm install isomorphic-dompurify

// If still having issues, try:
npm install dompurify jsdom
```

### Issue: Cache not working

```javascript
// Clear old cache data
localStorage.clear()
sessionStorage.clear()

// Restart the application
window.location.reload()
```

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify all migrations ran successfully
4. Ensure all dependencies are installed

## ✅ Completion Checklist

- [ ] All database migrations applied successfully
- [ ] New dependencies installed
- [ ] Code deployed to production
- [ ] Verification queries return expected results
- [ ] No errors in browser console
- [ ] Memory usage is stable
- [ ] Input sanitization working
- [ ] Rate limiting active

Once all items are checked, Phase 0 is complete! 🎉