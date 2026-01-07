// src/shared/db/rxdb-hooks.ts
/**
 * Custom RxDB React Hooks
 *
 * React 19 compatible - uses direct observable subscriptions.
 * Replaces deprecated rxdb-hooks package.
 */

import { useState, useEffect, useCallback, useRef, useContext, createContext, type ReactNode } from 'react';
import type { RxCollection, RxQuery, RxDocument } from 'rxdb';
import type { DevlogDatabase } from './rxdb';

// =============================================================================
// Database Context
// =============================================================================

const RxDBContext = createContext<DevlogDatabase | null>(null);

export function RxDBProvider({ db, children }: { db: DevlogDatabase | null; children: ReactNode }) {
  return (
    <RxDBContext.Provider value={db}>
      {children}
    </RxDBContext.Provider>
  );
}

export function useRxDB(): DevlogDatabase | null {
  return useContext(RxDBContext);
}

// =============================================================================
// useRxQuery - Subscribe to RxDB query results
// =============================================================================

interface UseRxQueryResult<T> {
  result: T[];
  isFetching: boolean;
  error: Error | null;
}

export function useRxQuery<T>(
  collectionName: keyof DevlogDatabase['collections'],
  queryConstructor?: (collection: RxCollection<T>) => RxQuery<T, T[]> | null
): UseRxQueryResult<T> {
  const db = useRxDB();
  const [result, setResult] = useState<T[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stable reference to query constructor
  const queryConstructorRef = useRef(queryConstructor);
  queryConstructorRef.current = queryConstructor;

  useEffect(() => {
    if (!db) {
      setIsFetching(true);
      return;
    }

    const collection = db[collectionName] as RxCollection<T>;
    if (!collection) {
      setError(new Error(`Collection ${String(collectionName)} not found`));
      setIsFetching(false);
      return;
    }

    // Build query
    const query = queryConstructorRef.current
      ? queryConstructorRef.current(collection)
      : collection.find();

    if (!query) {
      setResult([]);
      setIsFetching(false);
      return;
    }

    // Subscribe to query changes
    const subscription = query.$.subscribe({
      next: (docs: RxDocument<T>[]) => {
        setResult(docs.map(doc => doc.toJSON() as T));
        setIsFetching(false);
        setError(null);
      },
      error: (err: Error) => {
        setError(err);
        setIsFetching(false);
        console.error(`[useRxQuery] ${String(collectionName)} error:`, err);
      },
    });

    return () => subscription.unsubscribe();
  }, [db, collectionName]);

  return { result, isFetching, error };
}

// =============================================================================
// useRxCollection - Get collection for write operations
// =============================================================================

export function useRxCollection<T>(
  collectionName: keyof DevlogDatabase['collections']
): RxCollection<T> | null {
  const db = useRxDB();
  return db ? (db[collectionName] as RxCollection<T>) : null;
}

// =============================================================================
// useRxDocument - Subscribe to single document
// =============================================================================

interface UseRxDocumentResult<T> {
  document: T | null;
  isFetching: boolean;
  error: Error | null;
}

export function useRxDocument<T>(
  collectionName: keyof DevlogDatabase['collections'],
  documentId: string | null
): UseRxDocumentResult<T> {
  const db = useRxDB();
  const [document, setDocument] = useState<T | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !documentId) {
      setDocument(null);
      setIsFetching(false);
      return;
    }

    const collection = db[collectionName] as RxCollection<T>;
    if (!collection) {
      setError(new Error(`Collection ${String(collectionName)} not found`));
      setIsFetching(false);
      return;
    }

    const subscription = collection.findOne(documentId).$.subscribe({
      next: (doc: RxDocument<T> | null) => {
        setDocument(doc ? doc.toJSON() as T : null);
        setIsFetching(false);
        setError(null);
      },
      error: (err: Error) => {
        setError(err);
        setIsFetching(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [db, collectionName, documentId]);

  return { document, isFetching, error };
}
