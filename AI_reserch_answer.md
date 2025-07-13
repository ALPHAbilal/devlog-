# Implementing secure document sharing in Supabase applications with Row Level Security

When implementing document sharing in a Supabase application, the fundamental challenge is that Row Level Security (RLS) policies designed to protect documents can inadvertently block legitimate shared access. Based on comprehensive research of implementation patterns, security considerations, and real-world examples, this report provides actionable solutions for your specific use case.

## The core problem: RLS blocking valid shares

Your current RLS policy restricts document access to owners only:

```sql
-- Current restrictive policy
ON documents FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL)
```

This creates a conflict where `checkShareAccess` validates the share successfully, but `getSharedDocument` fails because RLS blocks the subsequent document query. The solution requires modifying your security architecture to accommodate both ownership and sharing patterns while maintaining robust security.

## Three proven implementation approaches

### Approach 1: Modified RLS policies with share validation

The most straightforward solution involves updating your RLS policies to check both ownership and valid shares. This approach maintains security within the database layer while enabling shared access.

```sql
-- Enhanced RLS policy that checks both ownership and shares
CREATE POLICY "documents_access_policy" ON documents
  FOR SELECT TO authenticated
  USING (
    -- Owner access
    user_id = auth.uid() AND deleted_at IS NULL
    OR
    -- Shared access (authenticated users)
    id IN (
      SELECT document_id 
      FROM document_shares 
      WHERE share_code = current_setting('app.share_code', true)
        AND (expires_at IS NULL OR expires_at > now())
        AND is_active = true
    )
  );

-- Anonymous access policy
CREATE POLICY "anonymous_shared_documents" ON documents
  FOR SELECT TO anon
  USING (
    id IN (
      SELECT document_id 
      FROM document_shares 
      WHERE share_code = current_setting('app.share_code', true)
        AND allow_anonymous = true
        AND (expires_at IS NULL OR expires_at > now())
        AND is_active = true
    )
  );
```

To use this approach, your client code needs to set the share code in the session:

```javascript
// Set share code before querying
const { data: document } = await supabase
  .rpc('set_config', { key: 'app.share_code', value: shareCode })
  .then(() => supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()
  );
```

**Pros**: Simple implementation, leverages existing RLS infrastructure, good performance with proper indexes
**Cons**: Requires session variable management, complex policies can impact query performance
**Security**: High - maintains database-level security
**Performance**: Good with proper indexing

### Approach 2: SECURITY DEFINER functions for controlled access

A more sophisticated approach uses PostgreSQL's SECURITY DEFINER functions to bypass RLS in a controlled manner. This provides fine-grained control over access logic while maintaining security.

```sql
CREATE OR REPLACE FUNCTION get_shared_document(
  p_share_code TEXT,
  p_password TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  share_record RECORD;
  document_data JSON;
BEGIN
  -- Validate share code format
  IF p_share_code IS NULL OR LENGTH(p_share_code) < 10 THEN
    RAISE EXCEPTION 'Invalid share code';
  END IF;
  
  -- Get share details with document
  SELECT ds.*, d.id, d.title, d.content, d.user_id, d.created_at
  INTO share_record
  FROM document_shares ds
  JOIN documents d ON ds.document_id = d.id
  WHERE ds.share_code = p_share_code
    AND ds.is_active = true
    AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
    AND d.deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share not found or expired';
  END IF;
  
  -- Check password if required
  IF share_record.password_hash IS NOT NULL THEN
    IF p_password IS NULL OR NOT verify_password(p_password, share_record.password_hash) THEN
      RAISE EXCEPTION 'Invalid password';
    END IF;
  END IF;
  
  -- Check permissions
  IF auth.uid() IS NULL AND NOT share_record.allow_anonymous THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Log access for analytics
  INSERT INTO share_analytics (document_id, share_code, accessed_at, accessed_by)
  VALUES (share_record.id, p_share_code, NOW(), auth.uid());
  
  -- Return document data based on permissions
  document_data := json_build_object(
    'id', share_record.id,
    'title', share_record.title,
    'created_at', share_record.created_at,
    'permissions', share_record.permissions
  );
  
  -- Include content for view permissions and above
  IF share_record.permissions IN ('view', 'comment', 'edit') THEN
    document_data := document_data || json_build_object('content', share_record.content);
  END IF;
  
  RETURN document_data;
END;
$$;

-- Restrict function execution
REVOKE EXECUTE ON FUNCTION get_shared_document FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_shared_document TO authenticated, anon;
```

Client implementation:
```javascript
const { data, error } = await supabase
  .rpc('get_shared_document', { 
    p_share_code: shareCode,
    p_password: password 
  });
```

**Pros**: Fine-grained access control, supports complex business logic, built-in audit trail
**Cons**: Requires careful security implementation, function maintenance overhead
**Security**: Excellent when properly implemented
**Performance**: Good, but adds function call overhead

### Approach 3: Hybrid approach with share access tables

This approach uses a materialized share access pattern that maintains a dedicated table for users who have access to documents, simplifying RLS policies while maintaining performance.

```sql
-- Share access tracking table
CREATE TABLE user_document_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  document_id UUID REFERENCES documents(id),
  access_level TEXT CHECK (access_level IN ('view', 'comment', 'edit')),
  granted_via TEXT, -- 'owner', 'share', 'team'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simplified RLS policy
CREATE POLICY "document_access_via_access_table" ON documents
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND
    id IN (
      SELECT document_id 
      FROM user_document_access 
      WHERE user_id = auth.uid()
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Function to grant access via share
CREATE OR REPLACE FUNCTION grant_share_access(
  p_share_code TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  share_record RECORD;
BEGIN
  -- Validate share
  SELECT * INTO share_record
  FROM document_shares
  WHERE share_code = p_share_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
    
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Grant access
  INSERT INTO user_document_access (
    user_id, 
    document_id, 
    access_level, 
    granted_via,
    expires_at
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    share_record.document_id,
    share_record.permissions,
    'share',
    share_record.expires_at
  ) ON CONFLICT (user_id, document_id) 
  DO UPDATE SET 
    access_level = EXCLUDED.access_level,
    expires_at = EXCLUDED.expires_at;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Pros**: Excellent read performance, simple RLS policies, supports complex permission hierarchies
**Cons**: Requires maintaining access records, potential for stale data
**Security**: Good with proper maintenance
**Performance**: Excellent for reads

## Security considerations for anonymous access

Supporting anonymous users requires additional security measures:

1. **Token Security**: Generate cryptographically secure share codes with at least 256 bits of entropy:
```sql
CREATE OR REPLACE FUNCTION generate_secure_share_code()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;
```

2. **Rate Limiting**: Implement rate limiting to prevent share enumeration:
```sql
CREATE OR REPLACE FUNCTION check_share_rate_limit(p_share_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM share_access_log 
  WHERE share_code = p_share_code
    AND client_ip = inet_client_addr()
    AND created_at > NOW() - INTERVAL '1 hour';
    
  RETURN request_count < 100; -- 100 requests per hour limit
END;
$$ LANGUAGE plpgsql;
```

3. **Access Logging**: Maintain comprehensive audit logs for security monitoring:
```sql
CREATE TABLE share_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  share_code TEXT,
  client_ip INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Performance optimization strategies

Regardless of the approach chosen, performance optimization is crucial:

1. **Critical Indexes**:
```sql
CREATE INDEX idx_document_shares_lookup ON document_shares(share_code, is_active, expires_at);
CREATE INDEX idx_user_document_access_lookup ON user_document_access(user_id, document_id, expires_at);
CREATE INDEX idx_documents_owner ON documents(user_id) WHERE deleted_at IS NULL;
```

2. **Query Optimization**: Use EXISTS instead of IN for better performance in RLS policies:
```sql
-- More efficient
EXISTS (SELECT 1 FROM document_shares WHERE ...)
-- Less efficient
id IN (SELECT document_id FROM document_shares WHERE ...)
```

3. **Connection Pooling**: For high-traffic applications, implement connection pooling to manage database connections efficiently.

## Handling different share permissions

Implement a hierarchical permission system that scales with your needs:

```sql
CREATE TYPE permission_level AS ENUM ('view', 'comment', 'edit', 'admin');

-- Permission checking function
CREATE OR REPLACE FUNCTION has_document_permission(
  p_document_id UUID,
  p_required_level permission_level
)
RETURNS BOOLEAN AS $$
DECLARE
  user_level permission_level;
BEGIN
  -- Get user's permission level
  SELECT GREATEST(
    CASE WHEN d.user_id = auth.uid() THEN 'admin'::permission_level END,
    MAX(ds.permissions::permission_level)
  ) INTO user_level
  FROM documents d
  LEFT JOIN document_shares ds ON d.id = ds.document_id 
    AND ds.user_id = auth.uid()
    AND ds.is_active = true
  WHERE d.id = p_document_id;
  
  RETURN user_level >= p_required_level;
END;
$$ LANGUAGE plpgsql;
```

## Common pitfalls to avoid

1. **Insufficient RLS Coverage**: Always create policies for all operations (SELECT, INSERT, UPDATE, DELETE)
2. **Predictable Share Codes**: Never use sequential or predictable patterns
3. **Missing Expiration Checks**: Always validate expiration timestamps in policies
4. **Ignoring Anonymous Access**: Design policies specifically for the anon role
5. **Poor Error Handling**: Use generic error messages to prevent information leakage

## Recommended implementation for your use case

Given your specific requirements (React + Supabase, client-only, existing share validation logic), I recommend **Approach 2: SECURITY DEFINER functions** for the following reasons:

1. **Minimal changes to existing code**: Your `checkShareAccess` logic can be incorporated into the function
2. **Supports all requirements**: Handles authenticated/anonymous users, different permissions, and password protection
3. **Best security**: Centralized validation logic with proper error handling
4. **Good performance**: Single database round-trip for document access
5. **Future flexibility**: Easy to add new features like analytics or rate limiting

The implementation would involve creating the SECURITY DEFINER function as shown above, then updating your client code to use the function instead of direct table queries. This approach maintains your existing share validation logic while solving the RLS blocking issue.

By implementing these patterns with proper security measures, indexing, and monitoring, you can create a robust document sharing system that balances security, performance, and user experience while working seamlessly with Supabase's Row Level Security model.