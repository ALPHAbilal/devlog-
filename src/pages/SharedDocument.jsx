/**
 * SharedDocument Page
 * 
 * Displays a shared document with appropriate permissions and security
 * Handles password protection, authentication requirements, and watermarks
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Lock, Eye, Download, MessageSquare, Share2, 
  AlertCircle, Shield, Clock, User
} from 'lucide-react';
import { shareService } from '../services/shareService';
import { useAuth } from '../contexts/AuthContextOptimized';
import Block from '../components/Block';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SharedDocument() {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [document, setDocument] = useState(null);
  const [accessCheck, setAccessCheck] = useState(null);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [shareCode]);

  const checkAccess = async (providedPassword = null) => {
    setLoading(true);
    setError(null);

    try {
      const access = await shareService.checkShareAccess(shareCode, providedPassword);
      setAccessCheck(access);

      if (access.access) {
        // Access granted, load document
        const sharedDoc = await shareService.getSharedDocument(shareCode, providedPassword);
        setDocument(sharedDoc.document);
      } else if (access.password_required) {
        setShowPasswordPrompt(true);
      } else if (access.auth_required && !user) {
        // Redirect to login with return URL
        navigate(`/auth?redirect=/shared/${shareCode}`);
      } else {
        setError(access.reason);
      }
    } catch (err) {
      setError('Failed to load shared document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    checkAccess(password);
  };

  const handleAction = async (action) => {
    try {
      switch (action) {
        case 'download':
          if (document.permissions.includes('download')) {
            // Implement download functionality
            const content = document.blocks.map(b => b.content).join('\n\n');
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${document.title}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }
          break;
        case 'copy':
          // Copy link
          await navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="bg-dark-lighter rounded-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Password Protected Document
            </h2>
            <p className="text-gray-400 text-sm">
              Enter the password to view this document
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 bg-dark border border-gray-600 rounded-lg 
                       focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-lg 
                       transition-colors font-medium"
            >
              Access Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="bg-dark-lighter rounded-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!document) return null;

  const { permissions = [], shareSettings = {} } = document;
  const canComment = permissions.includes('comment');
  const canEdit = permissions.includes('edit');
  const canDownload = permissions.includes('download');

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <div className="bg-dark-lighter border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Share2 className="w-5 h-5 text-blue-400" />
              <div>
                <h1 className="text-lg font-semibold text-white">{document.title}</h1>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Shared by {document.user?.display_name || 'Anonymous'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(document.updated_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {permissions.join(', ')} access
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canDownload && (
                <button
                  onClick={() => handleAction('download')}
                  className="p-2 hover:bg-dark rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-gray-400" />
                </button>
              )}
              <button
                onClick={() => handleAction('copy')}
                className="p-2 hover:bg-dark rounded-lg transition-colors"
                title="Copy link"
              >
                <Share2 className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      {shareSettings.watermark && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-yellow-200">
              <Shield className="w-4 h-4" />
              This document is watermarked and tracked for security
            </div>
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {document.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Blocks */}
        <div className="space-y-2">
          {document.blocks.map((block, index) => (
            <div key={block.id} className="relative">
              <Block
                block={block}
                isFirst={index === 0}
                isLast={index === document.blocks.length - 1}
                onUpdate={canEdit ? () => {} : null} // Disable editing for now
                readOnly={!canEdit}
                isShared={true}
              />
              
              {/* Comment indicator */}
              {canComment && (
                <button
                  className="absolute -right-8 top-2 p-1 hover:bg-dark rounded opacity-0 
                           hover:opacity-100 transition-opacity"
                  title="Add comment"
                >
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Watermark Overlay */}
        {shareSettings.watermark && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <div className="transform rotate-45 text-6xl font-bold text-white whitespace-nowrap">
                {document.watermark}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {document.blocks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>This document has no content yet.</p>
          </div>
        )}
      </div>

      {/* Comment Sidebar (future feature) */}
      {canComment && (
        <div className="fixed right-0 top-0 h-full w-80 bg-dark-lighter border-l border-gray-700 
                      transform translate-x-full transition-transform">
          {/* Comments will go here */}
        </div>
      )}
    </div>
  );
}