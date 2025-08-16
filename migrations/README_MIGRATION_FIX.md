# Migration Fix Instructions

## Issue with Original Security Migration

The original `20250131_002_fix_security_vulnerabilities.sql` file had an error because it referenced `metadata->>'role'` in the profiles table, but the profiles table doesn't have a metadata column.

## Solution

Use the corrected migration file: `20250131_002_fix_security_vulnerabilities_corrected.sql`

### What Changed:

1. **Removed metadata reference** - The RLS policy no longer tries to check `metadata->>'role'`
2. **Created proper admin_users table** - Instead of storing roles in metadata, we now have a dedicated table for admin users
3. **Added helper function** - `is_admin()` function to easily check if a user is an admin

### How to Apply:

1. **If you haven't run the original migration yet:**
   ```sql
   -- Just run the corrected version
   -- Copy contents of 20250131_002_fix_security_vulnerabilities_corrected.sql
   -- Paste and execute in Supabase SQL Editor
   ```

2. **If you partially ran the original and it failed:**
   ```sql
   -- First, clean up any partial objects that might have been created
   DROP VIEW IF EXISTS public.user_documents_with_block_count;
   DROP TABLE IF EXISTS user_sessions CASCADE;
   DROP TABLE IF EXISTS security_audit_log CASCADE;
   DROP TABLE IF EXISTS ip_rate_limit CASCADE;
   
   -- Then run the corrected migration
   -- Copy contents of 20250131_002_fix_security_vulnerabilities_corrected.sql
   -- Paste and execute in Supabase SQL Editor
   ```

### To Make a User Admin:

After running the migration, you can make yourself an admin:

```sql
-- Replace 'your-user-id' with your actual user ID
-- You can find your user ID in the Supabase Dashboard under Authentication > Users
INSERT INTO admin_users (user_id, granted_by) 
VALUES ('your-user-id', 'your-user-id');
```

### Verification:

Run this to verify the migration succeeded:

```sql
-- Check if tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('admin_users', 'user_sessions', 'security_audit_log', 'ip_rate_limit');

-- Check if view was created correctly
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'user_documents_with_block_count';

-- Test admin check function
SELECT is_admin();  -- Should return false unless you added yourself as admin
```

## Success Indicators:

- ✅ No error about "metadata column does not exist"
- ✅ All security tables created successfully
- ✅ View created without SECURITY DEFINER
- ✅ Rate limiting functions available
- ✅ Admin system functional