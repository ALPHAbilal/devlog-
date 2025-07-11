# 🚀 Enterprise Transformation Masterplan for Devlog

> **Created**: January 2025  
> **Target**: 10,000+ concurrent users with 99.9% uptime  
> **Timeline**: 24 weeks  
> **Status**: 🟡 Implementation Ready

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Phase 0: Emergency Fixes](#phase-0-emergency-fixes-immediate)
4. [Phase 1: Foundation](#phase-1-foundation-weeks-1-4)
5. [Phase 2: Performance](#phase-2-performance-weeks-5-8)
6. [Phase 3: API Development](#phase-3-api-development-weeks-9-12)
7. [Phase 4: Enterprise Features](#phase-4-enterprise-features-weeks-13-20)
8. [Phase 5: Scale & Compliance](#phase-5-scale--compliance-weeks-21-24)
9. [Monitoring & Verification](#monitoring--verification)
10. [Success Metrics](#success-metrics)

---

## Executive Summary

### Current State (Live Analysis via Supabase MCP)
- **Users**: 3 active users
- **Documents**: 5 documents
- **Blocks**: 16 blocks
- **Database Size**: 12 MB
- **Status**: Development/Prototype phase

### Critical Issues Identified
1. ⚠️ **Data Loss Risk**: `save_document_blocks` uses DELETE-then-INSERT pattern
2. ⚠️ **Security**: SECURITY DEFINER view vulnerability, no leaked password protection
3. ⚠️ **Performance**: Missing indexes on backup tables, unused indexes
4. ⚠️ **Scale**: Direct database access limits to ~50 concurrent users
5. ⚠️ **Testing**: 0% test coverage

### Investment Required
- **Development**: ~$1M (team of 10 for 6 months)
- **Infrastructure**: ~$33K/month ongoing
- **Total First Year**: ~$1.4M

---

## Current State Analysis

### Database Schema Review
Based on MCP analysis of the production database:

```sql
-- Current Tables Structure
- profiles (3 records, RLS enabled)
- documents (5 records, RLS enabled, soft deletes)
- blocks (16 records, RLS enabled, soft deletes)
- document_links (0 records, RLS enabled)
- images (0 records, RLS enabled)
- settings (0 records, RLS enabled)
- document_versions (0 records, version control ready)
- document_cache (16 records, performance optimization)
```

### Security Assessment
```
✅ Strengths:
- RLS enabled on all tables
- OAuth with PKCE flow
- Comprehensive backup system

❌ Weaknesses:
- SECURITY DEFINER view (user_documents_with_block_count)
- Leaked password protection disabled
- No rate limiting at database level
```

### Performance Analysis
```
✅ Optimizations Found:
- Session caching implemented
- Request deduplication
- Document cache table
- Proper indexes on foreign keys

❌ Issues:
- Unused indexes consuming resources
- No connection pooling configured
- Missing indexes on backup tables
```

---

## Phase 0: Emergency Fixes (Immediate)

### 🔴 Critical: Fix Data Loss Bug

**Current Issue**: The `save_document_blocks` function can lose data between DELETE and INSERT operations.

**Solution**: Implement atomic transaction with soft deletes

```sql
-- Step 1: Create improved save function with transactions
CREATE OR REPLACE FUNCTION save_document_blocks_atomic(
  p_document_id UUID,
  p_blocks JSONB,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_existing_count INTEGER;
BEGIN
  -- Get user ID
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
      AND user_id = v_user_id 
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;

  -- Start transaction
  BEGIN
    -- Count existing blocks for validation
    SELECT COUNT(*) INTO v_existing_count
    FROM blocks 
    WHERE document_id = p_document_id 
      AND deleted_at IS NULL;

    -- Prevent accidental data loss
    IF jsonb_array_length(p_blocks) = 0 AND v_existing_count > 0 THEN
      RAISE WARNING 'Attempting to save empty blocks array for document with % existing blocks', v_existing_count;
      -- Return existing blocks instead of deleting
      SELECT jsonb_agg(row_to_json(b.*)) INTO v_result
      FROM blocks b
      WHERE document_id = p_document_id 
        AND deleted_at IS NULL
      ORDER BY position;
      RETURN v_result;
    END IF;

    -- Soft delete existing blocks
    UPDATE blocks 
    SET deleted_at = NOW(),
        updated_at = NOW()
    WHERE document_id = p_document_id 
      AND deleted_at IS NULL;

    -- Insert new blocks if any
    IF jsonb_array_length(p_blocks) > 0 THEN
      INSERT INTO blocks (
        id, document_id, type, content, position,
        metadata, language, file_path, user_id
      )
      SELECT 
        COALESCE((block->>'id')::UUID, gen_random_uuid()),
        p_document_id,
        block->>'type',
        COALESCE(block->>'content', ''),
        (block->>'position')::INTEGER,
        COALESCE((block->'metadata')::JSONB, '{}'::JSONB),
        block->>'language',
        block->>'file_path',
        v_user_id
      FROM jsonb_array_elements(p_blocks) AS block;
    END IF;

    -- Update document timestamp
    UPDATE documents 
    SET updated_at = NOW() 
    WHERE id = p_document_id;

    -- Return saved blocks
    SELECT jsonb_agg(row_to_json(b.*) ORDER BY position) INTO v_result
    FROM blocks b
    WHERE document_id = p_document_id 
      AND deleted_at IS NULL;

    RETURN COALESCE(v_result, '[]'::JSONB);

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback happens automatically
      RAISE;
  END;
END;
$$;

-- Step 2: Grant execute permissions
GRANT EXECUTE ON FUNCTION save_document_blocks_atomic TO authenticated;

-- Step 3: Create wrapper for backward compatibility
CREATE OR REPLACE FUNCTION save_document_blocks_safe(doc_id UUID, blocks JSONB)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM save_document_blocks_atomic(doc_id, blocks);
END;
$$;
```

### 🔴 Fix Security Vulnerabilities

```sql
-- Step 1: Fix SECURITY DEFINER view
DROP VIEW IF EXISTS public.user_documents_with_block_count;

CREATE VIEW public.user_documents_with_block_count AS
SELECT 
  d.id,
  d.title,
  d.created_at,
  d.updated_at,
  COUNT(b.id) as block_count
FROM documents d
LEFT JOIN blocks b ON d.id = b.document_id AND b.deleted_at IS NULL
WHERE d.user_id = auth.uid() AND d.deleted_at IS NULL
GROUP BY d.id;

-- Step 2: Enable RLS on the view
ALTER VIEW public.user_documents_with_block_count OWNER TO authenticated;

-- Step 3: Add rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_limit INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count recent actions
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_log
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check limit
  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Log action
  INSERT INTO rate_limit_log (user_id, action, created_at)
  VALUES (p_user_id, p_action, NOW());
  
  RETURN TRUE;
END;
$$;

-- Step 4: Create rate limit table
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_user_action_time 
ON rate_limit_log(user_id, action, created_at DESC);

-- Step 5: Add cleanup job for old entries
CREATE OR REPLACE FUNCTION cleanup_rate_limit_log()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM rate_limit_log
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;
```

### 🔴 Implement Memory-Safe Caching

Create a new file `src/utils/LRUCache.js`:

```javascript
export class LRUCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.maxMemoryMB = options.maxMemoryMB || 50;
    this.cache = new Map();
    this.accessOrder = [];
    this.memoryUsage = 0;
    this.hits = 0;
    this.misses = 0;
  }

  estimateSize(value) {
    // Rough estimation of object size
    const str = JSON.stringify(value);
    return str.length * 2; // 2 bytes per character
  }

  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      this.updateAccess(key);
      return this.cache.get(key);
    }
    this.misses++;
    return null;
  }

  set(key, value) {
    const size = this.estimateSize(value);
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldValue = this.cache.get(key);
      this.memoryUsage -= this.estimateSize(oldValue);
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }
    
    // Evict if needed
    while (
      (this.cache.size >= this.maxSize || 
       this.memoryUsage + size > this.maxMemoryMB * 1024 * 1024) && 
      this.accessOrder.length > 0
    ) {
      this.evictOldest();
    }
    
    // Add new entry
    this.cache.set(key, value);
    this.accessOrder.push(key);
    this.memoryUsage += size;
  }

  evictOldest() {
    const oldest = this.accessOrder.shift();
    if (oldest && this.cache.has(oldest)) {
      const value = this.cache.get(oldest);
      this.memoryUsage -= this.estimateSize(value);
      this.cache.delete(oldest);
    }
  }

  updateAccess(key) {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
    this.memoryUsage = 0;
  }

  getStats() {
    const hitRate = this.hits + this.misses > 0 
      ? (this.hits / (this.hits + this.misses) * 100).toFixed(2)
      : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsageMB: (this.memoryUsage / 1024 / 1024).toFixed(2),
      maxMemoryMB: this.maxMemoryMB,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`
    };
  }
}

// Replace the old SessionCache with LRU implementation
export class SessionCache extends LRUCache {
  constructor() {
    super({
      maxSize: 100,
      maxMemoryMB: 50
    });
    
    // Monitor memory usage
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      setInterval(() => {
        const memoryMB = window.performance.memory.usedJSHeapSize / 1024 / 1024;
        if (memoryMB > 100) {
          console.warn('High memory usage detected:', memoryMB.toFixed(2), 'MB');
          // Clear 25% of cache if memory is high
          const entriesToRemove = Math.floor(this.cache.size * 0.25);
          for (let i = 0; i < entriesToRemove; i++) {
            this.evictOldest();
          }
        }
      }, 30000); // Check every 30 seconds
    }
  }
}
```

### 🔴 Add Input Sanitization

Install DOMPurify:
```bash
npm install isomorphic-dompurify
```

Create `src/utils/sanitization.js`:

```javascript
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeConfig = {
  text: {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'code', 'pre', 'br'],
    ALLOWED_ATTR: []
  },
  markdown: {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'code', 'pre', 'br', 'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  },
  code: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }
};

export function sanitizeInput(input, type = 'text') {
  if (!input) return '';
  
  const config = sanitizeConfig[type] || sanitizeConfig.text;
  
  // Additional protection against script injection
  const cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return DOMPurify.sanitize(cleaned, config);
}

export function sanitizeBlock(block) {
  if (!block) return block;
  
  const sanitized = { ...block };
  
  // Sanitize based on block type
  switch (block.type) {
    case 'text':
    case 'heading':
      sanitized.content = sanitizeInput(block.content, 'markdown');
      break;
    case 'code':
      // Code blocks should not be sanitized to preserve formatting
      sanitized.content = block.content || '';
      break;
    case 'ai':
      // Sanitize AI messages
      if (block.messages && Array.isArray(block.messages)) {
        sanitized.messages = block.messages.map(msg => ({
          ...msg,
          content: sanitizeInput(msg.content, 'markdown')
        }));
      }
      break;
    default:
      sanitized.content = sanitizeInput(block.content, 'text');
  }
  
  return sanitized;
}

export function sanitizeDocument(doc) {
  if (!doc) return doc;
  
  return {
    ...doc,
    title: sanitizeInput(doc.title, 'text'),
    blocks: doc.blocks ? doc.blocks.map(sanitizeBlock) : []
  };
}
```

---

## Phase 1: Foundation (Weeks 1-4)

### Testing Framework Setup

#### 1. Install Testing Dependencies

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
npm install --save-dev @playwright/test
npm install --save-dev msw @faker-js/faker
```

#### 2. Configure Vitest

Create `vitest.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
});
```

#### 3. Create Test Setup

Create `src/test/setup.js`:

```javascript
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({ data: [], error: null })),
      delete: vi.fn(() => ({ data: [], error: null })),
    })),
  })),
}));
```

#### 4. Create First Critical Tests

Create `src/utils/__tests__/LRUCache.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from '../LRUCache';

describe('LRUCache', () => {
  let cache;

  beforeEach(() => {
    cache = new LRUCache({ maxSize: 3, maxMemoryMB: 1 });
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should evict oldest entries when size limit reached', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key4')).toBe('value4');
  });

  it('should update LRU order on access', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    
    // Access key1 to make it recently used
    cache.get('key1');
    
    // Add new item, key2 should be evicted
    cache.set('key4', 'value4');
    
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeNull();
  });

  it('should track memory usage', () => {
    const stats = cache.getStats();
    expect(stats.memoryUsageMB).toBe('0.00');
    
    cache.set('key1', 'x'.repeat(1000));
    const newStats = cache.getStats();
    expect(parseFloat(newStats.memoryUsageMB)).toBeGreaterThan(0);
  });

  it('should calculate hit rate correctly', () => {
    cache.set('key1', 'value1');
    
    cache.get('key1'); // hit
    cache.get('key2'); // miss
    cache.get('key1'); // hit
    
    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('66.67%');
  });
});
```

Create `src/utils/__tests__/sanitization.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizeBlock } from '../sanitization';

describe('Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("XSS")</script> World';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello  World');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>';
      const result = sanitizeInput(input, 'markdown');
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick');
    });

    it('should preserve allowed tags', () => {
      const input = '<b>Bold</b> and <i>italic</i>';
      const result = sanitizeInput(input, 'text');
      expect(result).toContain('<b>Bold</b>');
      expect(result).toContain('<i>italic</i>');
    });
  });

  describe('sanitizeBlock', () => {
    it('should sanitize text blocks', () => {
      const block = {
        type: 'text',
        content: 'Hello <script>alert(1)</script> World'
      };
      const result = sanitizeBlock(block);
      expect(result.content).toBe('Hello  World');
    });

    it('should not sanitize code blocks', () => {
      const block = {
        type: 'code',
        content: '<script>console.log("This is code")</script>'
      };
      const result = sanitizeBlock(block);
      expect(result.content).toBe('<script>console.log("This is code")</script>');
    });

    it('should sanitize AI message content', () => {
      const block = {
        type: 'ai',
        messages: [
          { role: 'user', content: 'Hello <script>alert(1)</script>' },
          { role: 'assistant', content: 'Hi <b>there</b>' }
        ]
      };
      const result = sanitizeBlock(block);
      expect(result.messages[0].content).toBe('Hello ');
      expect(result.messages[1].content).toBe('Hi <b>there</b>');
    });
  });
});
```

### CI/CD Pipeline Setup

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test -- --coverage
    
    - name: Run E2E tests
      run: npx playwright test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/coverage-final.json
    
    - name: Build
      run: npm run build
    
    - name: Check bundle size
      run: |
        npm install -g bundlesize
        bundlesize

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security audit
      run: npm audit
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Monitoring Setup

#### 1. Install Sentry

```bash
npm install @sentry/react @sentry/tracing
```

#### 2. Configure Sentry

Create `src/utils/monitoring.js`:

```javascript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initMonitoring() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
      ],
      tracesSampleRate: 0.1, // 10% of transactions
      environment: import.meta.env.MODE,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        return event;
      },
    });
  }
}

export function logError(error, context = {}) {
  console.error(error);
  
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

export function logPerformance(metric, value, tags = {}) {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: metric,
      level: 'info',
      data: { value, ...tags },
    });
  }
}
```

---

## Phase 2: Performance (Weeks 5-8)

### Database Performance Optimization

#### 1. Create Missing Indexes

```sql
-- Performance indexes for common queries
CREATE INDEX idx_blocks_document_position 
ON blocks(document_id, position) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_documents_user_updated 
ON documents(user_id, updated_at DESC) 
WHERE deleted_at IS NULL;

-- Full-text search indexes
CREATE INDEX idx_documents_search 
ON documents 
USING gin(to_tsvector('english', title || ' ' || COALESCE(array_to_string(tags, ' '), '')));

CREATE INDEX idx_blocks_search 
ON blocks 
USING gin(to_tsvector('english', content));

-- JSONB indexes for metadata queries
CREATE INDEX idx_blocks_metadata 
ON blocks USING gin(metadata);

CREATE INDEX idx_documents_metadata 
ON documents USING gin(metadata);

-- Remove unused indexes identified by MCP
DROP INDEX IF EXISTS idx_document_versions_created_by;
DROP INDEX IF EXISTS idx_backup_metadata_created_by;
```

#### 2. Query Optimization Functions

```sql
-- Optimized document search with pagination
CREATE OR REPLACE FUNCTION search_documents_optimized(
  p_query TEXT,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  preview TEXT,
  tags TEXT[],
  score REAL,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH search_results AS (
    SELECT 
      d.id,
      d.title,
      d.tags,
      d.updated_at,
      COALESCE(d.metadata->>'preview', LEFT(
        (SELECT string_agg(content, ' ' ORDER BY position) 
         FROM blocks b 
         WHERE b.document_id = d.id 
           AND b.deleted_at IS NULL 
         LIMIT 3), 200
      )) as preview,
      ts_rank(
        to_tsvector('english', d.title || ' ' || COALESCE(array_to_string(d.tags, ' '), '')),
        plainto_tsquery('english', p_query)
      ) as rank
    FROM documents d
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
      AND to_tsvector('english', d.title || ' ' || COALESCE(array_to_string(d.tags, ' '), ''))
        @@ plainto_tsquery('english', p_query)
  )
  SELECT 
    id,
    title,
    preview,
    tags,
    rank as score,
    updated_at
  FROM search_results
  ORDER BY rank DESC, updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Materialized view for dashboard stats
CREATE MATERIALIZED VIEW user_dashboard_stats AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT b.id) as block_count,
  COUNT(DISTINCT CASE WHEN d.is_template THEN d.id END) as template_count,
  COUNT(DISTINCT unnest(d.tags)) as unique_tags,
  MAX(d.updated_at) as last_activity,
  SUM(LENGTH(b.content)) as total_content_size
FROM auth.users u
LEFT JOIN documents d ON u.id = d.user_id AND d.deleted_at IS NULL
LEFT JOIN blocks b ON d.id = b.document_id AND b.deleted_at IS NULL
GROUP BY u.id;

CREATE UNIQUE INDEX idx_user_dashboard_stats_user_id 
ON user_dashboard_stats(user_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_user_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
END;
$$;
```

#### 3. Connection Pooling Configuration

Create `supabase/pooler.config`:

```yaml
# PgBouncer configuration for connection pooling

[databases]
devlog = host=db.zqcjipwiznesnbgbocnu.supabase.co port=5432 dbname=postgres

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 100
max_user_connections = 100
stats_period = 60
admin_users = postgres
auth_type = md5
ignore_startup_parameters = extra_float_digits
server_reset_query = DISCARD ALL
server_check_query = select 1
server_check_delay = 10
application_name_add_host = 1
```

### Redis Caching Layer

#### 1. Install Redis Client

```bash
npm install redis ioredis
```

#### 2. Create Redis Cache Manager

Create `src/utils/redisCache.js`:

```javascript
import Redis from 'ioredis';
import { logError } from './monitoring';

class RedisCache {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;

    try {
      this.client = new Redis({
        host: import.meta.env.VITE_REDIS_HOST || 'localhost',
        port: import.meta.env.VITE_REDIS_PORT || 6379,
        password: import.meta.env.VITE_REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        this.connected = true;
        console.log('Redis connected');
      });

      this.client.on('error', (err) => {
        logError(err, { service: 'redis' });
      });

      await this.client.ping();
    } catch (error) {
      logError(error, { service: 'redis', action: 'connect' });
      this.connected = false;
    }
  }

  async get(key) {
    if (!this.connected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logError(error, { service: 'redis', action: 'get', key });
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.connected) return false;

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logError(error, { service: 'redis', action: 'set', key });
      return false;
    }
  }

  async delete(key) {
    if (!this.connected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logError(error, { service: 'redis', action: 'delete', key });
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (!this.connected) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      logError(error, { service: 'redis', action: 'invalidatePattern', pattern });
      return false;
    }
  }

  generateKey(type, id, ...args) {
    return `devlog:${type}:${id}:${args.join(':')}`;
  }
}

export const redisCache = new RedisCache();

// Cache wrapper for Supabase queries
export async function cachedQuery(key, queryFn, ttl = 3600) {
  // Try cache first
  const cached = await redisCache.get(key);
  if (cached) return cached;

  // Execute query
  const result = await queryFn();
  
  // Cache result
  await redisCache.set(key, result, ttl);
  
  return result;
}
```

---

## Phase 3: API Development (Weeks 9-12)

### API Gateway Architecture

#### 1. Install API Dependencies

```bash
npm install express express-rate-limit helmet cors compression
npm install jsonwebtoken bcrypt
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/express nodemon
```

#### 2. Create API Server

Create `server/index.js`:

```javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';
import { logger } from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.js';
import documentsRoutes from './routes/documents.js';
import blocksRoutes from './routes/blocks.js';
import webhooksRoutes from './routes/webhooks.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  skipSuccessfulRequests: true,
});

app.use('/api/auth/', authLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', authenticate, documentsRoutes);
app.use('/api/blocks', authenticate, blocksRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
});
```

#### 3. Create API Routes

Create `server/routes/documents.js`:

```javascript
import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { documentService } from '../services/documentService.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get user's documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Unauthorized
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('tags').optional().isArray(),
  ],
  cacheMiddleware(60), // Cache for 1 minute
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { page = 1, limit = 20, search, tags } = req.query;
      const offset = (page - 1) * limit;

      const result = await documentService.getDocuments(
        req.user.id,
        { limit, offset, search, tags }
      );

      res.json({
        data: result.documents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 */
router.get('/:id',
  [param('id').isUUID()],
  cacheMiddleware(300), // Cache for 5 minutes
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const document = await documentService.getDocument(
        req.params.id,
        req.user.id
      );

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Create new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_template:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Document created
 *       400:
 *         description: Invalid input
 */
router.post('/',
  [
    body('title').trim().notEmpty().isLength({ max: 255 }),
    body('tags').optional().isArray(),
    body('is_template').optional().isBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const document = await documentService.createDocument(
        req.user.id,
        req.body
      );

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

### GraphQL Layer

#### 1. Install GraphQL Dependencies

```bash
npm install @apollo/server graphql graphql-tag
npm install dataloader graphql-depth-limit graphql-rate-limit
```

#### 2. Create GraphQL Schema

Create `server/graphql/schema.js`:

```javascript
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    email: String!
    profile: Profile
    documents(
      limit: Int = 20
      offset: Int = 0
      search: String
      tags: [String]
    ): DocumentConnection!
  }

  type Profile {
    id: ID!
    username: String
    displayName: String
    avatarUrl: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Document {
    id: ID!
    title: String!
    tags: [String]!
    isTemplate: Boolean!
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    blocks(limit: Int = 50, offset: Int = 0): BlockConnection!
    preview: String
    stats: DocumentStats!
  }

  type DocumentStats {
    blockCount: Int!
    contentLength: Int!
    linkCount: Int!
    lastActivity: DateTime
  }

  type Block {
    id: ID!
    type: BlockType!
    content: String!
    position: Int!
    metadata: JSON
    language: String
    filePath: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum BlockType {
    text
    heading
    code
    ai
    table
    filetree
    todo
    template
    image
    inline_image
  }

  type DocumentConnection {
    edges: [DocumentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type DocumentEdge {
    node: Document!
    cursor: String!
  }

  type BlockConnection {
    edges: [BlockEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type BlockEdge {
    node: Block!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type Query {
    me: User
    document(id: ID!): Document
    documents(
      limit: Int = 20
      offset: Int = 0
      search: String
      tags: [String]
      orderBy: DocumentOrderBy = UPDATED_AT_DESC
    ): DocumentConnection!
    searchDocuments(
      query: String!
      limit: Int = 20
      offset: Int = 0
    ): DocumentConnection!
  }

  enum DocumentOrderBy {
    CREATED_AT_ASC
    CREATED_AT_DESC
    UPDATED_AT_ASC
    UPDATED_AT_DESC
    TITLE_ASC
    TITLE_DESC
  }

  type Mutation {
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document!
    deleteDocument(id: ID!): Boolean!
    saveBlocks(documentId: ID!, blocks: [BlockInput!]!): [Block!]!
  }

  input CreateDocumentInput {
    title: String!
    tags: [String]
    isTemplate: Boolean
    metadata: JSON
  }

  input UpdateDocumentInput {
    title: String
    tags: [String]
    isTemplate: Boolean
    metadata: JSON
  }

  input BlockInput {
    id: ID
    type: BlockType!
    content: String!
    position: Int!
    metadata: JSON
    language: String
    filePath: String
  }

  type Subscription {
    documentUpdated(id: ID!): Document!
    blockUpdated(documentId: ID!): Block!
  }
`;
```

### Webhook System

Create `server/services/webhookService.js`:

```javascript
import crypto from 'crypto';
import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import { Queue } from 'bullmq';

export class WebhookService {
  constructor() {
    this.queue = new Queue('webhooks', {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    });
  }

  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  validateSignature(payload, signature, secret) {
    const expected = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  async sendWebhook(webhook, event, data) {
    const payload = {
      id: crypto.randomUUID(),
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const signature = this.generateSignature(payload, webhook.secret);

    await this.queue.add('send', {
      url: webhook.url,
      payload,
      headers: {
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'Content-Type': 'application/json',
      },
      webhookId: webhook.id,
      attempt: 1,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async triggerEvent(userId, event, data) {
    try {
      // Get active webhooks for user
      const { data: webhooks, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .in('events', [event, '*']);

      if (error) throw error;

      // Send webhooks in parallel
      await Promise.all(
        webhooks.map(webhook => this.sendWebhook(webhook, event, data))
      );

      logger.info(`Triggered ${webhooks.length} webhooks for event ${event}`);
    } catch (error) {
      logger.error('Failed to trigger webhooks', { error, event, userId });
    }
  }
}

export const webhookService = new WebhookService();
```

---

## Phase 4: Enterprise Features (Weeks 13-20)

### Multi-Tenancy Implementation

#### 1. Database Schema for Multi-Tenancy

```sql
-- Create organizations table
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization members
CREATE TABLE organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing tables
ALTER TABLE documents ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE blocks ADD COLUMN organization_id UUID;

-- Create indexes
CREATE INDEX idx_documents_organization ON documents(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organization_members_user ON organization_members(user_id);

-- Update RLS policies for multi-tenancy
CREATE POLICY "Users can view their organization's documents"
  ON documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Function to get user's current organization
CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Get from app context or default to personal org
  org_id := current_setting('app.current_organization_id', true)::UUID;
  
  IF org_id IS NULL THEN
    -- Get user's personal organization
    SELECT id INTO org_id
    FROM organizations
    WHERE owner_id = auth.uid()
      AND slug = 'personal-' || auth.uid()::TEXT
    LIMIT 1;
  END IF;
  
  RETURN org_id;
END;
$$;
```

#### 2. Organization Management API

Create `server/services/organizationService.js`:

```javascript
export class OrganizationService {
  async createOrganization(userId, data) {
    const { name, slug } = data;
    
    // Validate slug uniqueness
    const existing = await this.getOrganizationBySlug(slug);
    if (existing) {
      throw new Error('Organization slug already exists');
    }
    
    // Create organization
    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        owner_id: userId,
        settings: {
          features: this.getDefaultFeatures(data.plan || 'free'),
        },
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Add owner as member
    await this.addMember(org.id, userId, 'owner', userId);
    
    return org;
  }
  
  async addMember(organizationId, userId, role, invitedBy) {
    // Check permissions
    const hasPermission = await this.checkPermission(
      invitedBy,
      organizationId,
      'members:invite'
    );
    
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }
    
    // Add member
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
        invited_by: invitedBy,
      });
    
    if (error) throw error;
    
    // Send invitation email
    await this.sendInvitationEmail(userId, organizationId, invitedBy);
  }
  
  getDefaultFeatures(plan) {
    const features = {
      free: {
        maxUsers: 5,
        maxDocuments: 100,
        maxStorageGB: 1,
        apiAccess: false,
        sso: false,
        audit: false,
      },
      pro: {
        maxUsers: 50,
        maxDocuments: 1000,
        maxStorageGB: 10,
        apiAccess: true,
        sso: false,
        audit: true,
      },
      enterprise: {
        maxUsers: -1, // Unlimited
        maxDocuments: -1,
        maxStorageGB: -1,
        apiAccess: true,
        sso: true,
        audit: true,
        customDomain: true,
      },
    };
    
    return features[plan] || features.free;
  }
}
```

### SSO/SAML Implementation

#### 1. Install SAML Dependencies

```bash
npm install passport passport-saml
npm install @node-saml/passport-saml
```

#### 2. SAML Configuration

Create `server/auth/saml.js`:

```javascript
import { Strategy as SamlStrategy } from '@node-saml/passport-saml';
import passport from 'passport';
import { organizationService } from '../services/organizationService.js';

export function configureSAML(app) {
  // Configure SAML strategy for each organization
  const loadSamlConfig = async (organizationId) => {
    const org = await organizationService.getOrganization(organizationId);
    
    if (!org.settings?.saml) {
      throw new Error('SAML not configured for organization');
    }
    
    return new SamlStrategy({
      callbackUrl: `${process.env.APP_URL}/api/auth/saml/${organizationId}/callback`,
      entryPoint: org.settings.saml.entryPoint,
      issuer: org.settings.saml.issuer,
      cert: org.settings.saml.cert,
      identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
      validateInResponseTo: true,
      disableRequestedAuthnContext: true,
    }, async (profile, done) => {
      try {
        // Map SAML attributes to user
        const email = profile.email || profile.mail;
        const name = profile.displayName || profile.name;
        
        // Find or create user
        let user = await userService.findByEmail(email);
        
        if (!user) {
          user = await userService.createFromSSO({
            email,
            name,
            provider: 'saml',
            providerId: profile.nameID,
          });
        }
        
        // Add to organization if not member
        await organizationService.ensureMember(
          organizationId,
          user.id,
          'member'
        );
        
        done(null, user);
      } catch (error) {
        done(error);
      }
    });
  };
  
  // SAML routes
  app.get('/api/auth/saml/:orgId/login', async (req, res, next) => {
    try {
      const strategy = await loadSamlConfig(req.params.orgId);
      passport.authenticate(strategy, {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  app.post('/api/auth/saml/:orgId/callback', async (req, res, next) => {
    try {
      const strategy = await loadSamlConfig(req.params.orgId);
      passport.authenticate(strategy, {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}
```

### Advanced RBAC System

#### 1. Permissions Schema

```sql
-- Create permissions table
CREATE TABLE permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  UNIQUE(resource, action)
);

-- Create roles table
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Create role permissions mapping
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create user role assignments
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, role_id, organization_id)
);

-- Insert default permissions
INSERT INTO permissions (resource, action, description) VALUES
  ('documents', 'create', 'Create new documents'),
  ('documents', 'read', 'View documents'),
  ('documents', 'update', 'Edit documents'),
  ('documents', 'delete', 'Delete documents'),
  ('documents', 'share', 'Share documents with others'),
  ('organization', 'manage', 'Manage organization settings'),
  ('members', 'invite', 'Invite new members'),
  ('members', 'remove', 'Remove members'),
  ('members', 'manage_roles', 'Assign roles to members'),
  ('billing', 'view', 'View billing information'),
  ('billing', 'manage', 'Manage billing and subscriptions'),
  ('api', 'access', 'Access API endpoints'),
  ('webhooks', 'manage', 'Manage webhooks');

-- Function to check permissions
CREATE OR REPLACE FUNCTION check_permission(
  p_user_id UUID,
  p_organization_id UUID,
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  -- Check if user has permission through roles
  SELECT EXISTS(
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND ur.organization_id = p_organization_id
      AND p.resource = p_resource
      AND p.action = p_action
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO has_permission;
  
  -- Check if user is organization owner (has all permissions)
  IF NOT has_permission THEN
    SELECT EXISTS(
      SELECT 1
      FROM organizations
      WHERE id = p_organization_id
        AND owner_id = p_user_id
    ) INTO has_permission;
  END IF;
  
  RETURN has_permission;
END;
$$;
```

#### 2. RBAC Middleware

Create `server/middleware/rbac.js`:

```javascript
export function requirePermission(resource, action) {
  return async (req, res, next) => {
    try {
      const { organizationId } = req.params;
      const userId = req.user.id;
      
      const hasPermission = await checkUserPermission(
        userId,
        organizationId,
        resource,
        action
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Missing permission: ${resource}:${action}`,
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(roleName) {
  return async (req, res, next) => {
    try {
      const { organizationId } = req.params;
      const userId = req.user.id;
      
      const hasRole = await checkUserRole(
        userId,
        organizationId,
        roleName
      );
      
      if (!hasRole) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Missing role: ${roleName}`,
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Usage in routes
router.post('/api/organizations/:organizationId/members',
  authenticate,
  requirePermission('members', 'invite'),
  async (req, res) => {
    // Handle member invitation
  }
);
```

### Audit Trail System

#### 1. Audit Schema

```sql
-- Create audit log table
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioning for scale
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Indexes for querying
CREATE INDEX idx_audit_logs_org_created 
ON audit_logs(organization_id, created_at DESC);

CREATE INDEX idx_audit_logs_user_created 
ON audit_logs(user_id, created_at DESC);

CREATE INDEX idx_audit_logs_resource 
ON audit_logs(resource_type, resource_id);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields JSONB;
BEGIN
  -- Determine action
  IF TG_OP = 'DELETE' THEN
    old_data := row_to_json(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := row_to_json(OLD);
    new_data := row_to_json(NEW);
    -- Calculate changed fields
    SELECT jsonb_object_agg(key, value)
    INTO changed_fields
    FROM (
      SELECT key, new_data->key as value
      FROM jsonb_object_keys(new_data) AS key
      WHERE old_data->key IS DISTINCT FROM new_data->key
    ) changes;
  ELSIF TG_OP = 'INSERT' THEN
    old_data := NULL;
    new_data := row_to_json(NEW);
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    changes,
    metadata
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', old_data,
      'new', new_data,
      'changed_fields', changed_fields
    ),
    jsonb_build_object(
      'schema', TG_TABLE_SCHEMA,
      'table', TG_TABLE_NAME
    )
  );
  
  RETURN NEW;
END;
$$;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_documents
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_organization_members
AFTER INSERT OR UPDATE OR DELETE ON organization_members
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

---

## Phase 5: Scale & Compliance (Weeks 21-24)

### Kubernetes Deployment

#### 1. Create Kubernetes Manifests

Create `k8s/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: devlog
```

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devlog-api
  namespace: devlog
spec:
  replicas: 3
  selector:
    matchLabels:
      app: devlog-api
  template:
    metadata:
      labels:
        app: devlog-api
    spec:
      containers:
      - name: api
        image: devlog/api:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: devlog-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: devlog-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: devlog-api-service
  namespace: devlog
spec:
  selector:
    app: devlog-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
```

Create `k8s/hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: devlog-api-hpa
  namespace: devlog
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: devlog-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Multi-Region Setup

#### 1. Database Replication Script

```sql
-- Setup for multi-region with Supabase
-- Note: This would be configured through Supabase dashboard

-- Create read replica configuration
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Connect to read replica
CREATE SERVER us_west_replica
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'replica-us-west.supabase.co', port '5432', dbname 'postgres');

CREATE USER MAPPING FOR current_user
  SERVER us_west_replica
  OPTIONS (user 'replica_user', password 'replica_password');

-- Create foreign tables for read operations
CREATE SCHEMA IF NOT EXISTS replica_us_west;

IMPORT FOREIGN SCHEMA public
  FROM SERVER us_west_replica
  INTO replica_us_west;

-- Function to route reads to nearest replica
CREATE OR REPLACE FUNCTION get_nearest_replica()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  client_ip INET;
  region TEXT;
BEGIN
  -- Get client IP
  client_ip := inet_client_addr();
  
  -- Determine region based on IP
  -- This is simplified - in production use GeoIP
  IF client_ip << '10.0.0.0/8' THEN
    region := 'us-east';
  ELSIF client_ip << '172.16.0.0/12' THEN
    region := 'us-west';
  ELSE
    region := 'eu-west';
  END IF;
  
  RETURN region;
END;
$$;
```

### Compliance Implementation

#### 1. GDPR Compliance

```sql
-- Data retention policies
CREATE TABLE data_retention_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  delete_strategy TEXT CHECK (delete_strategy IN ('hard', 'soft', 'anonymize')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User consent tracking
CREATE TABLE user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Right to be forgotten
CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB := '{}';
  doc_count INTEGER;
  block_count INTEGER;
BEGIN
  -- Start transaction
  BEGIN
    -- Delete blocks
    DELETE FROM blocks
    WHERE user_id = p_user_id;
    GET DIAGNOSTICS block_count = ROW_COUNT;
    
    -- Delete documents
    DELETE FROM documents
    WHERE user_id = p_user_id;
    GET DIAGNOSTICS doc_count = ROW_COUNT;
    
    -- Delete images
    DELETE FROM images
    WHERE user_id = p_user_id;
    
    -- Delete settings
    DELETE FROM settings
    WHERE user_id = p_user_id;
    
    -- Anonymize profile
    UPDATE profiles
    SET 
      username = 'deleted_' || substring(id::text, 1, 8),
      display_name = 'Deleted User',
      avatar_url = NULL
    WHERE id = p_user_id;
    
    -- Log the deletion
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      metadata
    ) VALUES (
      p_user_id,
      'DELETE_USER_DATA',
      'user',
      p_user_id,
      jsonb_build_object(
        'documents_deleted', doc_count,
        'blocks_deleted', block_count,
        'requested_at', NOW()
      )
    );
    
    result := jsonb_build_object(
      'success', true,
      'documents_deleted', doc_count,
      'blocks_deleted', block_count
    );
    
    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END;
END;
$$;

-- Data export for portability
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  user_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (
      SELECT row_to_json(p.*)
      FROM profiles p
      WHERE p.id = p_user_id
    ),
    'documents', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'document', row_to_json(d.*),
          'blocks', (
            SELECT jsonb_agg(row_to_json(b.*))
            FROM blocks b
            WHERE b.document_id = d.id
              AND b.deleted_at IS NULL
            ORDER BY b.position
          )
        )
      )
      FROM documents d
      WHERE d.user_id = p_user_id
        AND d.deleted_at IS NULL
    ),
    'settings', (
      SELECT jsonb_agg(row_to_json(s.*))
      FROM settings s
      WHERE s.user_id = p_user_id
    ),
    'exported_at', NOW()
  ) INTO user_data;
  
  RETURN user_data;
END;
$$;
```

---

## Monitoring & Verification

### Performance Monitoring Queries

```sql
-- Real-time performance dashboard
CREATE OR REPLACE FUNCTION get_performance_metrics()
RETURNS TABLE (
  metric TEXT,
  value NUMERIC,
  unit TEXT,
  status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Database size
  RETURN QUERY
  SELECT 
    'database_size'::TEXT,
    pg_database_size(current_database())::NUMERIC,
    'bytes'::TEXT,
    CASE 
      WHEN pg_database_size(current_database()) > 10737418240 THEN 'warning'
      ELSE 'ok'
    END;
  
  -- Active connections
  RETURN QUERY
  SELECT 
    'active_connections'::TEXT,
    COUNT(*)::NUMERIC,
    'connections'::TEXT,
    CASE 
      WHEN COUNT(*) > 80 THEN 'critical'
      WHEN COUNT(*) > 50 THEN 'warning'
      ELSE 'ok'
    END
  FROM pg_stat_activity
  WHERE state = 'active';
  
  -- Slow queries
  RETURN QUERY
  SELECT 
    'slow_queries'::TEXT,
    COUNT(*)::NUMERIC,
    'queries'::TEXT,
    CASE 
      WHEN COUNT(*) > 10 THEN 'critical'
      WHEN COUNT(*) > 5 THEN 'warning'
      ELSE 'ok'
    END
  FROM pg_stat_statements
  WHERE mean_exec_time > 1000; -- Queries taking > 1 second
  
  -- Cache hit ratio
  RETURN QUERY
  SELECT 
    'cache_hit_ratio'::TEXT,
    ROUND(
      sum(heap_blks_hit) / 
      NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100
    )::NUMERIC,
    'percent'::TEXT,
    CASE 
      WHEN ROUND(
        sum(heap_blks_hit) / 
        NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100
      ) < 90 THEN 'warning'
      ELSE 'ok'
    END
  FROM pg_statio_user_tables;
  
  -- Transaction rate
  RETURN QUERY
  SELECT 
    'transaction_rate'::TEXT,
    ROUND(
      (sum(xact_commit + xact_rollback) - lag(sum(xact_commit + xact_rollback)) 
      OVER (ORDER BY 1)) / 60
    )::NUMERIC,
    'tps'::TEXT,
    'ok'::TEXT
  FROM pg_stat_database
  WHERE datname = current_database()
  GROUP BY datname;
END;
$$;

-- Security audit query
CREATE OR REPLACE FUNCTION security_audit()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for tables without RLS
  RETURN QUERY
  SELECT 
    'Tables without RLS'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'fail' ELSE 'pass' END,
    STRING_AGG(tablename, ', ')
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN (
      SELECT tablename 
      FROM pg_policies
    )
  GROUP BY 1, 2;
  
  -- Check for users with excessive permissions
  RETURN QUERY
  SELECT 
    'Users with CREATEDB'::TEXT,
    CASE WHEN COUNT(*) > 1 THEN 'warning' ELSE 'pass' END,
    COUNT(*)::TEXT || ' users'
  FROM pg_user
  WHERE usecreatedb = true;
  
  -- Check for unencrypted connections
  RETURN QUERY
  SELECT 
    'Unencrypted connections'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'fail' ELSE 'pass' END,
    COUNT(*)::TEXT || ' connections'
  FROM pg_stat_ssl
  WHERE NOT ssl;
  
  -- Check password policy
  RETURN QUERY
  SELECT 
    'Password policy'::TEXT,
    CASE 
      WHEN current_setting('password_encryption') = 'scram-sha-256' THEN 'pass'
      ELSE 'fail'
    END,
    'Using ' || current_setting('password_encryption');
END;
$$;
```

### Health Check Endpoints

Create `server/monitoring/health.js`:

```javascript
export async function healthCheck(req, res) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.APP_VERSION || '1.0.0',
    checks: {},
  };

  try {
    // Database check
    const dbStart = Date.now();
    await supabase.from('documents').select('count').limit(1);
    checks.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    checks.checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
    checks.status = 'unhealthy';
  }

  try {
    // Redis check
    const redisStart = Date.now();
    await redisCache.client.ping();
    checks.checks.redis = {
      status: 'healthy',
      responseTime: Date.now() - redisStart,
    };
  } catch (error) {
    checks.checks.redis = {
      status: 'unhealthy',
      error: error.message,
    };
    checks.status = 'degraded';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  checks.checks.memory = {
    status: memUsage.heapUsed / memUsage.heapTotal > 0.9 ? 'warning' : 'healthy',
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
  };

  res.status(checks.status === 'healthy' ? 200 : 503).json(checks);
}
```

---

## Success Metrics

### Key Performance Indicators

```sql
-- Create KPI tracking table
CREATE TABLE kpi_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- KPI calculation function
CREATE OR REPLACE FUNCTION calculate_kpis()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  kpis JSONB;
BEGIN
  SELECT jsonb_build_object(
    'reliability', jsonb_build_object(
      'uptime_percentage', 99.9, -- Would come from monitoring
      'error_rate', (
        SELECT COUNT(*)::FLOAT / NULLIF(COUNT(*), 0) * 100
        FROM audit_logs
        WHERE action LIKE 'ERROR%'
          AND created_at > NOW() - INTERVAL '24 hours'
      ),
      'mttr_minutes', 30 -- Mean time to recovery
    ),
    'performance', jsonb_build_object(
      'avg_response_time_ms', (
        SELECT AVG(response_time)
        FROM api_metrics
        WHERE created_at > NOW() - INTERVAL '1 hour'
      ),
      'p95_response_time_ms', (
        SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time)
        FROM api_metrics
        WHERE created_at > NOW() - INTERVAL '1 hour'
      ),
      'concurrent_users', (
        SELECT COUNT(DISTINCT user_id)
        FROM user_sessions
        WHERE last_activity > NOW() - INTERVAL '5 minutes'
      )
    ),
    'business', jsonb_build_object(
      'total_users', (SELECT COUNT(*) FROM profiles),
      'active_users_30d', (
        SELECT COUNT(DISTINCT user_id)
        FROM documents
        WHERE updated_at > NOW() - INTERVAL '30 days'
      ),
      'documents_created_today', (
        SELECT COUNT(*)
        FROM documents
        WHERE created_at > CURRENT_DATE
      ),
      'storage_used_gb', (
        SELECT SUM(file_size) / 1073741824.0
        FROM images
      )
    ),
    'quality', jsonb_build_object(
      'test_coverage', 90, -- Would come from CI/CD
      'security_score', 'A',
      'code_quality', 'A'
    )
  ) INTO kpis;
  
  -- Store metrics
  INSERT INTO kpi_metrics (metric_name, metric_value, metric_unit, metadata)
  SELECT 
    key as metric_name,
    (value->>'value')::NUMERIC as metric_value,
    value->>'unit' as metric_unit,
    value->'metadata' as metadata
  FROM jsonb_each(kpis);
  
  RETURN kpis;
END;
$$;
```

### Success Criteria Verification

```javascript
// Automated success verification script
export async function verifyEnterpriseReadiness() {
  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  // Test concurrent users
  try {
    const loadTest = await runLoadTest({
      users: 10000,
      duration: '5m',
      rampUp: '1m',
    });
    
    if (loadTest.errorRate < 0.1 && loadTest.p95ResponseTime < 100) {
      results.passed.push('Load test: 10,000 concurrent users');
    } else {
      results.failed.push('Load test failed performance targets');
    }
  } catch (error) {
    results.failed.push(`Load test error: ${error.message}`);
  }

  // Test uptime
  const uptime = await getUptimePercentage(30); // Last 30 days
  if (uptime >= 99.9) {
    results.passed.push(`Uptime: ${uptime}%`);
  } else {
    results.failed.push(`Uptime below target: ${uptime}%`);
  }

  // Test security
  const securityAudit = await runSecurityAudit();
  if (securityAudit.score === 'A') {
    results.passed.push('Security audit passed');
  } else {
    results.warnings.push(`Security score: ${securityAudit.score}`);
  }

  // Test data integrity
  const integrityCheck = await verifyDataIntegrity();
  if (integrityCheck.issues === 0) {
    results.passed.push('Data integrity verified');
  } else {
    results.failed.push(`Data integrity issues: ${integrityCheck.issues}`);
  }

  return results;
}
```

---

## Implementation Tracking

### Phase Completion Checklist

#### ✅ Phase 0: Emergency Fixes
- [ ] Deploy atomic save_document_blocks function
- [ ] Implement LRU cache with memory limits
- [ ] Add input sanitization across all inputs
- [ ] Enable rate limiting
- [ ] Set up basic monitoring

#### ⏳ Phase 1: Foundation
- [ ] Configure test framework
- [ ] Write critical unit tests
- [ ] Set up CI/CD pipeline
- [ ] Integrate error tracking
- [ ] Deploy monitoring dashboard

#### 🔜 Phase 2: Performance
- [ ] Create database indexes
- [ ] Configure connection pooling
- [ ] Deploy Redis cache
- [ ] Optimize queries
- [ ] Set up CDN

#### 📅 Phase 3: API Development
- [ ] Build REST API
- [ ] Implement GraphQL
- [ ] Create webhook system
- [ ] Document with OpenAPI
- [ ] Deploy API gateway

#### 📅 Phase 4: Enterprise Features
- [ ] Implement multi-tenancy
- [ ] Add SSO/SAML
- [ ] Deploy RBAC
- [ ] Create audit system
- [ ] Build admin dashboard

#### 📅 Phase 5: Scale & Compliance
- [ ] Deploy to Kubernetes
- [ ] Set up multi-region
- [ ] Implement compliance
- [ ] Security hardening
- [ ] Load testing

---

## Next Steps

### Immediate Actions (This Week)

1. **Deploy Emergency Fixes**
   ```bash
   # Run the atomic save function migration
   supabase migration new fix_atomic_saves
   # Copy the SQL from Phase 0
   supabase db push
   ```

2. **Implement Caching Fix**
   - Replace SessionCache with LRUCache
   - Test memory limits
   - Deploy to production

3. **Add Security Patches**
   - Install DOMPurify
   - Implement sanitization
   - Add rate limiting

### This Month

1. Set up comprehensive testing
2. Deploy monitoring infrastructure
3. Begin API development
4. Plan enterprise features

### Success Milestones

- **Month 1**: Zero data loss, 80% test coverage
- **Month 2**: <100ms response time, 1000 concurrent users
- **Month 3**: API v1 launched, webhooks active
- **Month 4**: Multi-tenancy deployed, SSO ready
- **Month 5**: 99.9% uptime achieved
- **Month 6**: First enterprise customer onboarded

---

*This document is a living guide. Update progress weekly and adjust timelines as needed.*