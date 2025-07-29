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
  AlertCircle, Shield, Clock, User, FileText
} from 'lucide-react';
import { shareService } from '../services/shareService';
import { useAuth } from '../contexts/AuthContextOptimized';
import Block from '../components/Block';
import { useToast } from '../hooks/useToast';

export default function SharedDocument() {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  
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

      if (access.has_access) {
        // Access granted, load document
        const sharedDoc = await shareService.getSharedDocument(shareCode, providedPassword);
        setDocument(sharedDoc.document);
      } else if (access.requires_password) {
        setShowPasswordPrompt(true);
      } else if (access.message === 'Authentication required' && !user) {
        // Redirect to login with return URL
        navigate(`/auth?redirect=/shared/${shareCode}`);
      } else {
        setError(access.message || 'Access denied');
      }
    } catch (err) {
      console.error('Share access error:', err);
      if (err.message && err.message.includes('not found')) {
        setError('This document no longer exists or has been deleted.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to load shared document');
      }
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
          showToast('Link copied to clipboard!', 'success');
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
          </div>
          <div className="relative bg-dark-lighter/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-text-secondary/30 border-t-accent-green rounded-full animate-spin" />
              <div className="text-text-secondary">Loading document...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="relative max-w-md w-full">
          {/* Background glow effect */}
          <div className="absolute inset-0 blur-3xl opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
          </div>
          
          {/* Main card */}
          <div className="relative bg-dark-lighter/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl" />
                <Lock className="relative w-12 h-12 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Password Protected Document
              </h2>
              <p className="text-text-secondary text-sm">
                Enter the password to view this document
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-dark-primary/50 backdrop-blur-sm 
                           border border-gray-600/50 rounded-xl 
                           focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 
                           focus:outline-none transition-all duration-200
                           placeholder-text-secondary/50"
                  autoFocus
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="relative w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                         hover:from-blue-600 hover:to-blue-700 
                         rounded-xl transition-all duration-200 font-medium
                         transform hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                <span className="relative z-10">Access Document</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="relative max-w-md w-full">
          {/* Background glow effect */}
          <div className="absolute inset-0 blur-3xl opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full" />
          </div>
          
          {/* Main card */}
          <div className="relative bg-dark-lighter/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-xl" />
              <AlertCircle className="relative w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {error.includes('no longer exists') ? 'Document Not Found' : 'Access Denied'}
            </h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="relative w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                         hover:from-blue-600 hover:to-blue-700 rounded-xl 
                         transition-all duration-200 font-medium
                         transform hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                Go to Homepage
              </button>
              {error.includes('no longer exists') && (
                <p className="text-sm text-text-secondary/70 mt-4">
                  The document may have been deleted by its owner.
                </p>
              )}
            </div>
          </div>
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
    <div className="h-screen bg-dark-primary overflow-y-auto">
      {/* Enhanced Header with Glass Morphism */}
      <div className="bg-dark-lighter/80 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-40 shadow-xl">
        <div className="relative">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 pointer-events-none" />
          
          <div className="relative max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg blur-xl" />
                  <div className="relative p-2 bg-dark-primary/50 backdrop-blur-sm rounded-lg">
                    <Share2 className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-text-primary bg-gradient-to-r from-text-primary to-blue-300 bg-clip-text text-transparent">
                    {document.title}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-dark-primary/30 rounded-full">
                      <User className="w-3 h-3" />
                      Shared by {document.profiles?.display_name || document.profiles?.username || 'Anonymous'}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-dark-primary/30 rounded-full">
                      <Clock className="w-3 h-3" />
                      {new Date(document.updated_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-dark-primary/30 rounded-full">
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
                    className="relative p-2.5 bg-dark-primary/50 hover:bg-dark-primary/80 
                             backdrop-blur-sm rounded-xl transition-all duration-200
                             border border-gray-700/50 hover:border-blue-500/50
                             transform hover:scale-105 active:scale-95"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-text-secondary hover:text-blue-400 transition-colors" />
                  </button>
                )}
                <button
                  onClick={() => handleAction('copy')}
                  className="relative p-2.5 bg-dark-primary/50 hover:bg-dark-primary/80 
                           backdrop-blur-sm rounded-xl transition-all duration-200
                           border border-gray-700/50 hover:border-blue-500/50
                           transform hover:scale-105 active:scale-95"
                  title="Copy link"
                >
                  <Share2 className="w-5 h-5 text-text-secondary hover:text-blue-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Security Notice */}
      {shareSettings.watermark && (
        <div className="relative bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 
                      border-b border-yellow-500/30 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-pulse" />
          <div className="relative max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                <Shield className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-yellow-200 font-medium">
                This document is watermarked and tracked for security
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Document Content with Enhanced Styling */}
      <div className="relative max-w-4xl mx-auto px-4 py-8 pb-20">
        {/* Background gradient effect */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        {/* Tags with enhanced styling */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {document.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                         backdrop-blur-sm text-blue-300 rounded-lg text-sm font-medium
                         border border-blue-500/30 hover:border-blue-400/50
                         transition-all duration-200 hover:scale-105 cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Enhanced Blocks Container */}
        <div className="relative space-y-4">
          {document.blocks && document.blocks.map((block, index) => (
            <div key={block.id} className="relative group">
              {/* Block wrapper with subtle hover effect */}
              <div className="relative rounded-lg transition-all duration-200 
                            hover:bg-dark-lighter/20 hover:shadow-lg hover:shadow-black/20">
                <Block
                  block={block}
                  isFirst={index === 0}
                  isLast={index === document.blocks.length - 1}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                  onAddBelow={() => {}}
                  onConvert={() => {}}
                  showAddButton={false}
                  isFocused={true}
                />
              </div>
              
              {/* Enhanced Comment indicator */}
              {canComment && (
                <button
                  className="absolute -right-10 top-2 p-2 bg-dark-lighter/50 backdrop-blur-sm 
                           rounded-lg border border-gray-700/50 opacity-0 
                           group-hover:opacity-100 hover:bg-dark-lighter/80 
                           hover:border-blue-500/50 transition-all duration-200
                           transform hover:scale-105"
                  title="Add comment"
                >
                  <MessageSquare className="w-4 h-4 text-text-secondary hover:text-blue-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced Watermark Overlay */}
        {shareSettings.watermark && (
          <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="transform rotate-45 text-6xl font-bold bg-gradient-to-r 
                            from-blue-400 to-purple-400 bg-clip-text text-transparent 
                            opacity-[0.03] select-none whitespace-nowrap">
                {document.watermark}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Empty State */}
        {(!document.blocks || document.blocks.length === 0) && (
          <div className="relative py-20">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative text-center bg-dark-lighter/30 backdrop-blur-sm 
                          rounded-2xl border border-gray-700/50 p-12 max-w-md mx-auto">
              <FileText className="w-12 h-12 text-text-secondary/50 mx-auto mb-4" />
              <p className="text-text-secondary text-lg">This document has no content yet.</p>
              <p className="text-text-secondary/70 text-sm mt-2">Check back later for updates.</p>
            </div>
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