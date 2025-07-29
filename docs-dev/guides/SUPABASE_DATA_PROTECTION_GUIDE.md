# Supabase Data Protection & Recovery Guide

## 🚨 Critical: Data Loss Prevention Strategy

This guide provides comprehensive approaches to protect user data during Supabase infrastructure changes.

## Current Data Status
- Documents: 6
- Blocks: 2  
- Users: 1

**Note**: Block data was significantly reduced from previous state, indicating data loss during migrations.

## 1. Automated Backup System

### A. Pre-Migration Backup Script
Create this script to run before ANY infrastructure changes:

```sql
-- Create timestamped backup tables
DO $$
DECLARE
    backup_suffix TEXT := TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
BEGIN
    -- Backup all critical tables
    EXECUTE format('CREATE TABLE documents_backup_%s AS SELECT * FROM documents', backup_suffix);
    EXECUTE format('CREATE TABLE blocks_backup_%s AS SELECT * FROM blocks', backup_suffix);
    EXECUTE format('CREATE TABLE profiles_backup_%s AS SELECT * FROM profiles', backup_suffix);
    EXECUTE format('CREATE TABLE document_links_backup_%s AS SELECT * FROM document_links', backup_suffix);
    EXECUTE format('CREATE TABLE images_backup_%s AS SELECT * FROM images', backup_suffix);
    EXECUTE format('CREATE TABLE settings_backup_%s AS SELECT * FROM settings', backup_suffix);
    
    -- Create backup metadata
    CREATE TABLE IF NOT EXISTS backup_metadata (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        backup_date TIMESTAMP DEFAULT NOW(),
        backup_suffix TEXT,
        table_counts JSONB,
        reason TEXT
    );
    
    INSERT INTO backup_metadata (backup_suffix, table_counts, reason)
    VALUES (
        backup_suffix,
        jsonb_build_object(
            'documents', (SELECT COUNT(*) FROM documents),
            'blocks', (SELECT COUNT(*) FROM blocks),
            'profiles', (SELECT COUNT(*) FROM profiles),
            'document_links', (SELECT COUNT(*) FROM document_links),
            'images', (SELECT COUNT(*) FROM images),
            'settings', (SELECT COUNT(*) FROM settings)
        ),
        'Pre-migration backup'
    );
    
    RAISE NOTICE 'Backup completed with suffix: %', backup_suffix;
END $$;
```

### B. Automated Recovery Function
```sql
CREATE OR REPLACE FUNCTION restore_from_backup(p_backup_suffix TEXT)
RETURNS TABLE(
    table_name TEXT,
    restored_count BIGINT,
    status TEXT
) AS $$
DECLARE
    v_table RECORD;
    v_count BIGINT;
BEGIN
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';
    
    -- Restore each table
    FOR v_table IN 
        SELECT unnest(ARRAY['documents', 'blocks', 'profiles', 'document_links', 'images', 'settings']) AS name
    LOOP
        BEGIN
            -- Clear current table
            EXECUTE format('TRUNCATE TABLE %I CASCADE', v_table.name);
            
            -- Restore from backup
            EXECUTE format('INSERT INTO %I SELECT * FROM %I_backup_%s', 
                v_table.name, v_table.name, p_backup_suffix);
            
            -- Get count
            EXECUTE format('SELECT COUNT(*) FROM %I', v_table.name) INTO v_count;
            
            RETURN QUERY SELECT v_table.name, v_count, 'Success'::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT v_table.name, 0::BIGINT, SQLERRM;
        END;
    END LOOP;
    
    -- Re-enable triggers
    SET session_replication_role = 'origin';
END;
$$ LANGUAGE plpgsql;
```

## 2. Client-Side Backup System

### A. Export Functionality
Add this to your application for user-initiated backups:

```javascript
// utils/backupManager.js
export class BackupManager {
  static async createFullBackup(supabase, userId) {
    try {
      // Fetch all user data
      const [documents, blocks, settings, images, links] = await Promise.all([
        supabase.from('documents').select('*').eq('user_id', userId),
        supabase.from('blocks').select('*').eq('user_id', userId),
        supabase.from('settings').select('*').eq('user_id', userId),
        supabase.from('images').select('*').eq('user_id', userId),
        supabase.from('document_links').select('*').eq('user_id', userId)
      ]);

      const backup = {
        version: '1.0',
        created_at: new Date().toISOString(),
        user_id: userId,
        data: {
          documents: documents.data || [],
          blocks: blocks.data || [],
          settings: settings.data || [],
          images: images.data || [],
          document_links: links.data || []
        },
        counts: {
          documents: documents.data?.length || 0,
          blocks: blocks.data?.length || 0,
          settings: settings.data?.length || 0,
          images: images.data?.length || 0,
          document_links: links.data?.length || 0
        }
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devlog-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      return backup;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  static async restoreFromBackup(supabase, backupFile) {
    try {
      const backup = JSON.parse(await backupFile.text());
      
      // Validate backup format
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup format');
      }

      // Restore in correct order (respecting foreign keys)
      const results = {
        documents: { success: 0, failed: 0 },
        blocks: { success: 0, failed: 0 },
        settings: { success: 0, failed: 0 },
        images: { success: 0, failed: 0 },
        document_links: { success: 0, failed: 0 }
      };

      // 1. Restore documents first
      for (const doc of backup.data.documents) {
        try {
          await supabase.from('documents').upsert(doc, { onConflict: 'id' });
          results.documents.success++;
        } catch (e) {
          results.documents.failed++;
        }
      }

      // 2. Restore blocks
      for (const block of backup.data.blocks) {
        try {
          await supabase.from('blocks').upsert(block, { onConflict: 'id' });
          results.blocks.success++;
        } catch (e) {
          results.blocks.failed++;
        }
      }

      // 3. Restore other tables
      for (const table of ['settings', 'images', 'document_links']) {
        for (const item of backup.data[table]) {
          try {
            await supabase.from(table).upsert(item, { onConflict: 'id' });
            results[table].success++;
          } catch (e) {
            results[table].failed++;
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }
}
```

### B. Add UI Components
```jsx
// components/BackupRestore.jsx
import { useState } from 'react';
import { BackupManager } from '../utils/backupManager';
import { supabase } from '../lib/supabase';

export function BackupRestore({ userId }) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await BackupManager.createFullBackup(supabase, userId);
      alert('Backup created successfully!');
    } catch (error) {
      alert('Backup failed: ' + error.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('This will restore data from the backup. Continue?')) return;

    setIsRestoring(true);
    try {
      const results = await BackupManager.restoreFromBackup(supabase, file);
      alert(`Restore completed:\n${JSON.stringify(results, null, 2)}`);
    } catch (error) {
      alert('Restore failed: ' + error.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Data Backup & Restore</h3>
      
      <div className="space-y-4">
        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isBackingUp ? 'Creating Backup...' : 'Download Backup'}
        </button>

        <div>
          <label className="block text-sm font-medium mb-2">
            Restore from Backup
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleRestore}
            disabled={isRestoring}
            className="block w-full text-sm text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
```

## 3. Migration Safety Checklist

### Before ANY Migration:
1. **Create database backup** using the script above
2. **Export user data** to JSON files
3. **Test on staging** environment first
4. **Document current counts** of all tables
5. **Have rollback plan** ready

### Safe Migration Pattern:
```sql
-- 1. Start transaction
BEGIN;

-- 2. Create backup
DO $$
DECLARE
    backup_suffix TEXT := TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
BEGIN
    EXECUTE format('CREATE TABLE blocks_backup_%s AS SELECT * FROM blocks', backup_suffix);
    RAISE NOTICE 'Backup created: blocks_backup_%', backup_suffix;
END $$;

-- 3. Check current count
SELECT COUNT(*) AS before_count FROM blocks;

-- 4. Run your migration
-- YOUR MIGRATION CODE HERE

-- 5. Verify count after
SELECT COUNT(*) AS after_count FROM blocks;

-- 6. If counts don't match or data looks wrong:
ROLLBACK;
-- Otherwise:
-- COMMIT;
```

## 4. Continuous Data Protection

### A. Regular Automated Backups
```sql
-- Create a function to run daily backups
CREATE OR REPLACE FUNCTION create_daily_backup()
RETURNS void AS $$
DECLARE
    backup_suffix TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    old_backup_date DATE := CURRENT_DATE - INTERVAL '7 days';
BEGIN
    -- Create new backups
    EXECUTE format('CREATE TABLE IF NOT EXISTS documents_backup_%s AS SELECT * FROM documents', backup_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS blocks_backup_%s AS SELECT * FROM blocks', backup_suffix);
    
    -- Clean up old backups (keep last 7 days)
    FOR i IN 0..30 LOOP
        BEGIN
            EXECUTE format('DROP TABLE IF EXISTS documents_backup_%s', TO_CHAR(old_backup_date - i, 'YYYYMMDD'));
            EXECUTE format('DROP TABLE IF EXISTS blocks_backup_%s', TO_CHAR(old_backup_date - i, 'YYYYMMDD'));
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors for non-existent tables
            NULL;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule this with pg_cron or external scheduler
```

### B. Change Tracking
```sql
-- Add audit columns to track changes
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMP DEFAULT NOW();
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create audit log
CREATE TABLE IF NOT EXISTS data_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Create triggers to track changes
CREATE OR REPLACE FUNCTION log_data_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO data_audit_log (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), OLD.user_id);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO data_audit_log (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), NEW.user_id);
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO data_audit_log (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER blocks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON blocks
FOR EACH ROW EXECUTE FUNCTION log_data_changes();
```

## 5. Emergency Recovery Procedures

### If Data Loss Occurs:

1. **Check backup_metadata table** for available backups
```sql
SELECT * FROM backup_metadata ORDER BY backup_date DESC;
```

2. **List all backup tables**
```sql
SELECT tablename FROM pg_tables 
WHERE tablename LIKE '%_backup_%' 
ORDER BY tablename;
```

3. **Restore from specific backup**
```sql
SELECT * FROM restore_from_backup('20250130_123456');
```

4. **Manual recovery if automated fails**
```sql
-- Example: Restore blocks from backup
INSERT INTO blocks 
SELECT * FROM blocks_backup_20250130_123456
ON CONFLICT (id) DO NOTHING;
```

## 6. Best Practices

1. **Never run DELETE without WHERE clause**
2. **Always use transactions for DDL operations**
3. **Test migrations on copy of production data**
4. **Keep backups for at least 30 days**
5. **Document all infrastructure changes**
6. **Monitor row counts after migrations**
7. **Use soft deletes when possible**
8. **Implement point-in-time recovery**

## 7. Monitoring Data Integrity

```sql
-- Create a monitoring function
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details JSONB
) AS $$
BEGIN
    -- Check 1: Orphaned blocks
    RETURN QUERY
    SELECT 
        'orphaned_blocks'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END,
        jsonb_build_object('count', COUNT(*))
    FROM blocks b
    LEFT JOIN documents d ON b.document_id = d.id
    WHERE d.id IS NULL;

    -- Check 2: Document block counts
    RETURN QUERY
    SELECT 
        'document_block_mismatch'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END,
        jsonb_build_object('documents', COUNT(*))
    FROM documents d
    WHERE d.block_count != (
        SELECT COUNT(*) FROM blocks b WHERE b.document_id = d.id
    );

    -- Check 3: Data changes in last 24h
    RETURN QUERY
    SELECT 
        'recent_data_changes'::TEXT,
        'INFO'::TEXT,
        jsonb_build_object(
            'blocks_changed', (SELECT COUNT(*) FROM blocks WHERE updated_at > NOW() - INTERVAL '24 hours'),
            'documents_changed', (SELECT COUNT(*) FROM documents WHERE updated_at > NOW() - INTERVAL '24 hours')
        );
END;
$$ LANGUAGE plpgsql;

-- Run integrity checks
SELECT * FROM check_data_integrity();
```

## Implementation Priority

1. **Immediate**: Implement pre-migration backup script
2. **High**: Add client-side backup/restore functionality  
3. **Medium**: Set up automated daily backups
4. **Medium**: Implement audit logging
5. **Low**: Add monitoring dashboard

This comprehensive approach ensures user data is protected even during major infrastructure changes.