# Supabase 406 Error Debug Request

## Problem Description
We have a React app integrated with Supabase that's experiencing 406 (Not Acceptable) errors when trying to fetch/save documents. The authentication works, but API calls to the database fail.

## Error Details

### From Browser Console:
```
GET https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/documents?select=id&id=eq.d687d205-517b-4330-9eaf-43a844f0d2d0&user_id=eq.8eac28e6-0127-40d1-ba55-c10cbe52a32b 406 (Not Acceptable)
```

### From Supabase Logs:
1. **Successful requests**:
   - GET /rest/v1/documents returns 200
   - PATCH /rest/v1/documents returns 200
   - DELETE /rest/v1/blocks returns 204

2. **Failed request**:
   - POST /rest/v1/blocks with `columns=%22id%22%2C%22document_id%22...` returns 400
   - The columns parameter has URL-encoded quotes (%22)

3. **Critical error**:
   ```
   ERROR: invalid input syntax for type uuid: "1751013354338"
   ```

## Current Setup

### Supabase Client Configuration:
```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'journey-log-auth',
    debug: true
  },
  db: {
    schema: 'public'
  }
})
```

### Package Versions:
- @supabase/supabase-js: 2.45.0 (package.json) but logs show 2.70.0
- React: 19.1.0
- Vite: 6.3.5

### Database Schema:
- documents table with UUID primary key
- blocks table with UUID primary key
- Both have RLS policies enabled

## Questions for Investigation:

1. **406 Error Causes**: Why are some GET requests returning 406 (Not Acceptable)? Is this related to:
   - Missing headers (Accept, Content-Type)?
   - API version mismatch?
   - RLS policy issues?
   - Supabase client configuration?

2. **Columns Parameter Issue**: Why is the POST request including `columns=%22id%22...` with encoded quotes? This seems incorrect for Supabase's PostgREST API.

3. **UUID vs Timestamp**: The error shows a timestamp being used as UUID. Where might this be happening? The app code uses `crypto.randomUUID()`.

4. **Version Mismatch**: Package.json shows 2.45.0 but logs show GoTrueClient 2.70.0. Could this cause compatibility issues?

5. **Working vs Failing Requests**: Why do some requests work (PATCH, DELETE) while others fail (some GETs, POST)?

## What We Need:

1. Common causes and solutions for Supabase 406 errors
2. Proper headers configuration for Supabase JS client
3. Explanation of the "columns" parameter issue in POST requests
4. Best practices for Supabase client initialization with React 19
5. Debugging techniques for Supabase API issues

## Additional Context:
- The app was working with local storage before Supabase integration
- Authentication works correctly
- The issue appears to be specifically with database operations
- Using Row Level Security (RLS) with user_id checks