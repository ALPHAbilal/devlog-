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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [shareCode]);

  // Handle scroll for header transformation
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial scroll position

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
        <div className="bg-dark-lighter/60 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-text-secondary/30 border-t-accent-green rounded-full animate-spin" />
            <div className="text-text-secondary">Loading document...</div>
          </div>
        </div>
      </div>
    );
  }

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Main card */}
          <div className="bg-dark-lighter/60 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-dark-primary/50 rounded-2xl border border-gray-700/50">
                <Lock className="w-8 h-8 text-blue-400" />
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
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 
                         rounded-xl transition-all duration-200 font-medium
                         transform hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg shadow-black/50 hover:shadow-xl hover:shadow-black/60"
              >
                Access Document
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
        <div className="max-w-md w-full">
          {/* Main card */}
          <div className="bg-dark-lighter/60 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-dark-primary/50 rounded-2xl border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {error.includes('no longer exists') ? 'Document Not Found' : 'Access Denied'}
            </h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 
                         rounded-xl transition-all duration-200 font-medium
                         transform hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg shadow-black/50 hover:shadow-xl hover:shadow-black/60"
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

      {/* Side-Sliding Header with Premium Glass Morphism */}
      <div 
        className={`fixed z-50 transition-all duration-[400ms] ease-out ${
          isScrolled && !isHeaderHovered 
            ? 'top-6 left-6 cursor-pointer' 
            : 'top-0 left-0 right-0'
        }`}
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
      >
        <div 
          className={`bg-dark-lighter/70 backdrop-blur-2xl border border-gray-700/30 shadow-2xl transition-all duration-[400ms] ease-out ${
            isScrolled && !isHeaderHovered 
              ? 'rounded-2xl' 
              : 'rounded-none border-x-0 border-t-0'
          }`}
          style={{
            boxShadow: isScrolled && !isHeaderHovered 
              ? '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 50px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className={`transition-all duration-[400ms] ease-out ${
            isScrolled && !isHeaderHovered 
              ? 'px-3 py-3' 
              : 'max-w-6xl mx-auto px-6 py-5'
          }`}>
            <div className={`flex items-center ${
              isScrolled && !isHeaderHovered 
                ? 'gap-3' 
                : 'justify-between'
            }`}>
              {/* Compact Mode Content */}
              {isScrolled && !isHeaderHovered ? (
                <div className="flex items-center gap-3">
                  {/* Compact Icon */}
                  <div className="p-2.5 bg-dark-primary/50 backdrop-blur-sm rounded-xl border border-gray-700/40 shadow-lg flex-shrink-0">
                    <Share2 className="w-5 h-5 text-blue-400" />
                  </div>
                  
                  {/* Abbreviated Title with subtle animation */}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary truncate max-w-[180px]">
                      {document.title.length > 25 
                        ? document.title.substring(0, 25) + '...' 
                        : document.title}
                    </span>
                    <span className="text-xs text-text-secondary/60">Shared document</span>
                  </div>
                  
                  {/* Pulse indicator */}
                  <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                </div>
              ) : (
                <>
                  {/* Full Mode Content */}
                  <div className="flex items-center gap-5">
                    {/* Premium Icon Container */}
                    <div className="p-3 bg-dark-primary/40 backdrop-blur-sm rounded-xl border border-gray-700/40 shadow-lg transform transition-transform duration-300 hover:scale-105">
                      <Share2 className="w-6 h-6 text-blue-400" />
                    </div>
                    
                    {/* Document Info */}
                    <div className="flex flex-col gap-2 transition-all duration-[400ms]">
                      <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
                        {document.title}
                      </h1>
                      
                      {/* Enhanced Metadata Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-dark-primary/30 backdrop-blur-sm rounded-lg border border-gray-700/30">
                          <User className="w-3.5 h-3.5 text-text-secondary/70" />
                          <span className="text-xs text-text-secondary font-medium">
                            {document.profiles?.display_name || document.profiles?.username || 'Anonymous'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-dark-primary/30 backdrop-blur-sm rounded-lg border border-gray-700/30">
                          <Clock className="w-3.5 h-3.5 text-text-secondary/70" />
                          <span className="text-xs text-text-secondary font-medium">
                            {new Date(document.updated_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-green/10 backdrop-blur-sm rounded-lg border border-accent-green/20">
                          <Eye className="w-3.5 h-3.5 text-accent-green" />
                          <span className="text-xs text-accent-green font-medium capitalize">
                            {permissions.join(', ')} Access
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex items-center gap-3 transition-all duration-[400ms]">
                    {canDownload && (
                      <button
                        onClick={() => handleAction('download')}
                        className="group p-3 bg-dark-primary/40 hover:bg-dark-primary/60 
                                 backdrop-blur-sm rounded-xl transition-all duration-200
                                 border border-gray-700/40 hover:border-gray-600/50
                                 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                        title="Download Document"
                      >
                        <Download className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction('copy')}
                      className="group flex items-center gap-2 px-4 py-2.5 
                               bg-blue-500/10 hover:bg-blue-500/20 
                               backdrop-blur-sm rounded-xl transition-all duration-200
                               border border-blue-500/20 hover:border-blue-500/30
                               shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      title="Copy share link"
                    >
                      <Share2 className="w-5 h-5 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">Share Link</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for header when not scrolled */}
      {!isScrolled && <div className="h-[88px]" />}

      {/* Enhanced Security Notice */}
      {shareSettings.watermark && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/15 rounded-lg border border-yellow-500/20">
                <Shield className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-sm text-yellow-300 font-medium">
                This document is watermarked and tracked for security
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 pb-20">
        {/* Tags with refined styling */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {document.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-blue-500/15 backdrop-blur-sm 
                         text-blue-300 rounded-lg text-sm font-medium
                         border border-blue-500/25 hover:border-blue-400/40
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
              
              {/* Comment indicator */}
              {canComment && (
                <button
                  className="absolute -right-10 top-2 p-2 bg-dark-lighter/40 backdrop-blur-sm 
                           rounded-lg border border-gray-700/30 opacity-0 
                           group-hover:opacity-100 hover:bg-dark-lighter/60 
                           hover:border-gray-600/40 transition-all duration-200
                           shadow-lg hover:shadow-xl"
                  title="Add comment"
                >
                  <MessageSquare className="w-4 h-4 text-text-secondary hover:text-blue-400 transition-colors" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Watermark Overlay */}
        {shareSettings.watermark && (
          <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="transform rotate-45 text-6xl font-bold text-text-primary 
                            opacity-[0.02] select-none whitespace-nowrap">
                {document.watermark}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!document.blocks || document.blocks.length === 0) && (
          <div className="py-20">
            <div className="text-center bg-dark-lighter/20 backdrop-blur-sm 
                          rounded-2xl border border-gray-700/30 p-12 max-w-md mx-auto shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 
                            bg-dark-primary/30 rounded-2xl border border-gray-700/30">
                <FileText className="w-8 h-8 text-text-secondary/60" />
              </div>
              <p className="text-text-secondary text-lg font-medium mb-2">No content yet</p>
              <p className="text-text-secondary/60 text-sm">This document is empty. Check back later for updates.</p>
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