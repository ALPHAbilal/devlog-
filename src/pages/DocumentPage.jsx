/**
 * DocumentPage Component
 *
 * Lightweight document viewer that loads a single document directly without
 * requiring the full dashboard documents list. Eliminates skeleton flash on page reload.
 *
 * Key features:
 * - Direct document loading from URL parameter
 * - Authentication check with redirect
 * - Error handling for missing/unauthorized documents
 * - Analytics tracking for direct document access
 * - Responsive design for mobile and desktop
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextOptimized';
import { storageWrapper } from '../utils/storage/storageWrapper';
import { useDocumentAnalytics } from '../hooks/useAnalytics';
import { useResponsive } from '../hooks/useResponsive';
import ExpandedViewEnhanced from '../components/ExpandedViewEnhanced';
import MobileDocumentViewer from '../components/MobileDocumentViewer';

export default function DocumentPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const { trackDocumentEvent, startDocumentTimer, endDocumentTimer } = useDocumentAnalytics();

  // Component state
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load document from storage
   * Uses storageWrapper which provides:
   * - Multi-layer caching (memory -> IndexedDB -> Supabase)
   * - Automatic compression
   * - Circuit breaker pattern
   * - Transaction support
   */
  const loadDocument = useCallback(async () => {
    if (!documentId) {
      setError('No document ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Track start of document load
      startDocumentTimer('loading', documentId);

      // Ensure storage is initialized
      await storageWrapper.init();

      // Load document with all blocks in one query
      const doc = await storageWrapper.getDocument(documentId);

      if (!doc) {
        // Document not found or user doesn't have access (RLS enforced at DB level)
        setError('Document not found or you do not have access to it.');
        endDocumentTimer('loading', documentId);
        setLoading(false);
        return;
      }

      // Successfully loaded document
      setDocument(doc);

      // Track successful document load
      trackDocumentEvent('view', documentId, {
        document_title: doc.title,
        block_count: doc.blocks?.length || 0,
        access_type: 'direct_url',
        load_source: 'document_page'
      });

      // Track editing session start
      startDocumentTimer('editing', documentId);

      endDocumentTimer('loading', documentId);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load document:', err);
      setError(err.message || 'Failed to load document. Please try again.');
      endDocumentTimer('loading', documentId);
      setLoading(false);
    }
  }, [documentId, startDocumentTimer, endDocumentTimer, trackDocumentEvent]);

  /**
   * Check authentication and load document
   */
  useEffect(() => {
    if (!user) {
      // User not authenticated, redirect to auth with return URL
      navigate(`/auth?redirect=/document/${documentId}`);
      return;
    }

    loadDocument();

    // Cleanup: End editing timer when component unmounts
    return () => {
      if (document?.id) {
        endDocumentTimer('editing', document.id);
      }
    };
  }, [user, documentId, navigate, loadDocument]);

  /**
   * Handle document updates
   * ROOT CAUSE FIX: ExpandedViewEnhanced calls onUpdate(entryId, updates), not onUpdate(updatedDocument)
   * We need to merge the updates into the current document and save it
   */
  const handleUpdate = useCallback(async (entryId, updates) => {
    // Handle deletion
    if (updates === null) {
      // Document was deleted, navigate away
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Merge updates into current document, preserving id
    if (!document || !document.id) {
      return;
    }
    
    if (document.id !== entryId) {
      return;
    }
    
    // Create updated document, explicitly preserving id
    const updatedDocument = {
      ...document,
      ...updates,
      id: document.id, // CRITICAL: Always preserve id
      updated_at: new Date().toISOString()
    };
    
    // Validate id is present
    if (!updatedDocument.id) {
      return;
    }
    
    setDocument(updatedDocument);
    
    // Save to storage
    try {
      // Remove blocks from save (blocks are handled by SmartSync)
      const { blocks, ...documentToSave } = updatedDocument;
      await storageWrapper.saveDocument(documentToSave);
    } catch (error) {
      console.error('[DocumentPage] Error saving document:', error);
      // Don't throw - UI already updated optimistically
    }
  }, [document, navigate]);

  /**
   * Handle close/back navigation
   * Returns to dashboard
   */
  const handleClose = useCallback(() => {
    // End editing timer before navigating away
    if (document?.id) {
      endDocumentTimer('editing', document.id);
    }

    navigate('/dashboard', { replace: true });
  }, [document?.id, endDocumentTimer, navigate]);

  /**
   * Handle document-to-document navigation
   * Used for following backlinks or navigating between related documents
   */
  const handleNavigateToDocument = useCallback((newDocument) => {
    // End current document editing timer
    if (document?.id) {
      endDocumentTimer('editing', document.id);
    }

    // Navigate to new document using same route
    navigate(`/document/${newDocument.id}`, { replace: true });
  }, [document?.id, endDocumentTimer, navigate]);

  /**
   * Loading State
   * Shows spinner while fetching document
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="bg-dark-lighter/60 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-accent-green animate-spin" />
            <div className="text-text-secondary">Loading document...</div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error State
   * Shows error message with option to return to dashboard
   */
  if (error) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-dark-lighter/60 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-dark-primary/50 rounded-2xl border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Document Not Found
            </h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                       bg-accent-green hover:bg-accent-green/90
                       rounded-xl transition-all duration-200 font-medium
                       transform hover:scale-[1.02] active:scale-[0.98]
                       shadow-lg shadow-black/50 hover:shadow-xl hover:shadow-black/60"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Document Not Loaded State
   * Safety check - shouldn't happen if error handling is correct
   */
  if (!document) {
    return null;
  }

  /**
   * Main Render
   * Shows document editor (mobile or desktop view)
   */
  return (
    <>
      {isMobile ? (
        // Mobile view with swipe gestures
        <MobileDocumentViewer
          entry={document}
          onClose={handleClose}
          onUpdate={handleUpdate}
          allEntries={[]} // No sidebar needed for direct document access
          onNavigateToDocument={handleNavigateToDocument}
        />
      ) : (
        // Desktop view with full editor
        <ExpandedViewEnhanced
          entry={document}
          onClose={handleClose}
          onUpdate={handleUpdate}
          allEntries={[]} // No sidebar needed for direct document access
          isMobileView={false}
        />
      )}
    </>
  );
}
