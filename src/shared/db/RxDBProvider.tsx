// src/shared/db/RxDBProvider.tsx
/**
 * React Context Provider for RxDB
 *
 * Initializes database on mount, provides to all children.
 * Uses custom hooks for React 19 compatibility.
 * Manages Supabase replication lifecycle.
 */

import React, { useEffect, useState, useRef, type ReactNode } from 'react';
import { RxDBProvider as RxDBContextProvider } from './rxdb-hooks.tsx';
import { getDatabase, type DevlogDatabase } from './rxdb';
import { startAllReplications, stopAllReplications, clearSyncState } from './rxdb-replication';
import { runMigration, isMigrationNeeded } from './migration';
import { useAuth } from '@/app/providers';

import type { RxReplicationState } from 'rxdb';

// Type for replication instances from official RxDB Supabase plugin
type ReplicationMap = Map<string, RxReplicationState<any, any>>;

interface Props {
  children: ReactNode;
}

export function DatabaseProvider({ children }: Props) {
  const [db, setDb] = useState<DevlogDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const replicationsRef = useRef<ReplicationMap>(new Map());

  // Initialize database
  useEffect(() => {
    let mounted = true;

    const initDb = async () => {
      try {
        console.log('[DatabaseProvider] Initializing RxDB...');
        const database = await getDatabase();

        if (mounted) {
          setDb(database);
          console.log('[DatabaseProvider] RxDB ready');
        }
      } catch (err) {
        console.error('[DatabaseProvider] Failed to initialize RxDB:', err);
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    initDb();

    return () => {
      mounted = false;
    };
  }, []);

  // Manage replication based on auth state
  useEffect(() => {
    if (!db) return;

    let mounted = true;

    const manageReplication = async () => {
      if (user?.id) {
        // User is logged in - run migration and start replications
        if (replicationsRef.current.size === 0) {
          try {
            // Run migration if needed (first time after RxDB installed)
            if (isMigrationNeeded()) {
              console.log('[DatabaseProvider] Running data migration...');
              const result = await runMigration(db, user.id);
              if (result.success) {
                console.log('[DatabaseProvider] Migration successful:', result.migrated);
              }
            }

            // Start replications
            console.log('[DatabaseProvider] Starting replications for user:', user.id);
            const replications = await startAllReplications(db, user.id);
            if (mounted) {
              replicationsRef.current = replications;
              console.log('[DatabaseProvider] Replications started');

              // Health check: Wait a bit and verify data is being pulled
              setTimeout(async () => {
                if (!mounted) return;
                try {
                  const docCount = await db.documents.count().exec();
                  const folderCount = await db.folders.count().exec();
                  console.log('[DatabaseProvider] Replication health check:', {
                    documents: docCount,
                    folders: folderCount,
                    replications: replicationsRef.current.size,
                  });

                  if (docCount === 0 && folderCount === 0) {
                    console.warn(
                      '[DatabaseProvider] ⚠️ No data after replication. Possible causes:\n' +
                      '1. User has no documents yet (OK if new user)\n' +
                      '2. Supabase tables missing _modified/_deleted columns (run migration)\n' +
                      '3. RLS policies blocking queries\n' +
                      '4. Supabase Realtime not enabled for tables'
                    );
                  }
                } catch (e) {
                  console.error('[DatabaseProvider] Health check failed:', e);
                }
              }, 3000); // Check after 3 seconds
            }
          } catch (err) {
            console.error('[DatabaseProvider] Failed to start replications:', err);
            // Log more details about the error
            if (err instanceof Error) {
              console.error('[DatabaseProvider] Error details:', {
                message: err.message,
                name: err.name,
                stack: err.stack?.split('\n').slice(0, 3).join('\n'),
              });
            }
          }
        }
      } else {
        // User logged out - stop replications and clear data
        if (replicationsRef.current.size > 0) {
          console.log('[DatabaseProvider] User logged out, stopping replications');
          await stopAllReplications(replicationsRef.current);
          replicationsRef.current = new Map();
          clearSyncState();

          // Clear local data
          try {
            console.log('[DatabaseProvider] Clearing local data');
            await Promise.all([
              db.documents.remove(),
              db.folders.remove(),
              db.blocks.remove(),
            ]);
            console.log('[DatabaseProvider] Local data cleared');
          } catch (err) {
            console.error('[DatabaseProvider] Error clearing data:', err);
          }
        }
      }
    };

    manageReplication();

    return () => {
      mounted = false;
      // Cleanup replications on unmount
      if (replicationsRef.current.size > 0) {
        stopAllReplications(replicationsRef.current).catch(console.error);
        replicationsRef.current = new Map();
      }
    };
  }, [db, user?.id]);

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Database initialization failed: {error.message}
      </div>
    );
  }

  return (
    <RxDBContextProvider db={db}>
      {children}
    </RxDBContextProvider>
  );
}

export default DatabaseProvider;
