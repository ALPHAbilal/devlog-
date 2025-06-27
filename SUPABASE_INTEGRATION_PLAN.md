# Supabase Integration Plan for Journey Log Compass

## Overview
This plan outlines the migration from local storage (IndexedDB/localStorage) to Supabase, maintaining backwards compatibility while adding cloud sync capabilities.

## Database Schema Design

### Key Design Decisions

1. **Separate Blocks Table**: Instead of storing blocks as JSONB in documents, we use a separate table for better performance and querying capabilities.

2. **Search Optimization**: Generated `tsvector` columns for full-text search on both documents and blocks.

3. **Tag Storage**: Tags stored as PostgreSQL arrays with GIN indexes for efficient querying.

4. **Image Handling**: Separate images table for now, with future migration to Supabase Storage.

5. **Version Tracking**: Built into the blocks table with `version_of` field.

### Tables Structure

- **profiles**: User profiles extending Supabase Auth
- **documents**: Main document metadata
- **blocks**: Individual blocks with type-specific metadata in JSONB
- **document_links**: Tracks [[Document]] style links
- **images**: Temporary storage for base64 images

## Implementation Steps

### Phase 1: Setup and Authentication
1. Install dependencies
2. Configure Supabase client
3. Implement authentication flow
4. Create user profile on first login

### Phase 2: Data Layer Refactoring
1. Create Supabase data adapter matching current storage interface
2. Implement CRUD operations for documents and blocks
3. Add real-time subscriptions for live updates

### Phase 3: Migration System
1. Create migration utility to transfer IndexedDB data
2. Implement progress tracking
3. Handle large documents in chunks
4. Verify data integrity

### Phase 4: Storage Removal
1. Remove IndexedDB and localStorage implementations
2. Update all components to use Supabase
3. Remove compression logic (handled by Supabase)

### Phase 5: Enhanced Features
1. Implement real-time collaboration (future)
2. Add document sharing capabilities
3. Optimize search with PostgreSQL features

## Code Changes Required

### 1. Environment Configuration
```javascript
// .env.local
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase Client Setup
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### 3. Storage Adapter Pattern
```javascript
// src/utils/storage/SupabaseAdapter.js
export class SupabaseAdapter {
  async getDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        blocks (
          *
        )
      `)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return this.transformToLegacyFormat(data)
  }
  
  async saveDocument(doc) {
    // Implementation
  }
  
  // ... other methods
}
```

### 4. Authentication Context
```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Auth state management
  }, [])
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 5. Migration Utility
```javascript
// src/utils/migration/IndexedDBToSupabase.js
export class MigrationManager {
  async migrate() {
    // 1. Check if migration needed
    // 2. Read from IndexedDB
    // 3. Transform data
    // 4. Upload to Supabase
    // 5. Mark migration complete
  }
}
```

## Security Considerations

1. **RLS Policies**: All tables have user-scoped RLS policies
2. **Authentication**: Required for all operations
3. **Data Validation**: Client and server-side validation
4. **API Keys**: Use environment variables, never commit

## Performance Optimizations

1. **Indexes**: Strategic indexes on frequently queried columns
2. **Search**: PostgreSQL full-text search instead of client-side
3. **Pagination**: Implement for large document lists
4. **Caching**: Consider React Query or SWR for client-side caching

## Backwards Compatibility

1. **Feature Detection**: Check Supabase availability
2. **Gradual Migration**: Support both storage methods temporarily
3. **Data Export**: Allow users to export their data
4. **Offline Mode**: Implement with PowerSync or similar (future)

## Testing Strategy

1. **Unit Tests**: Test Supabase adapter methods
2. **Integration Tests**: Test full CRUD operations
3. **Migration Tests**: Verify data integrity
4. **Performance Tests**: Ensure acceptable response times

## Rollout Plan

1. **Development**: Complete implementation
2. **Beta Testing**: Limited users with migration
3. **Monitoring**: Track performance and errors
4. **Full Release**: Gradual rollout with fallback option

## Future Enhancements

1. **Offline Support**: Integrate PowerSync or WatermelonDB
2. **Real-time Collaboration**: Multiple users editing
3. **File Storage**: Migrate images to Supabase Storage
4. **Advanced Search**: Leverage PostgreSQL capabilities
5. **Analytics**: Track usage patterns

## Success Metrics

- Migration completion rate > 95%
- Page load time < 2s
- Search response time < 500ms
- Zero data loss during migration
- User satisfaction maintained or improved