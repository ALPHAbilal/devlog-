import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { shareService } from '../services/shareService';
import { useToast } from '../hooks/useToast';

export function ShareDialogSimple({ document, isOpen, onClose }) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const dialogRef = useRef(null);
  const linkInputRef = useRef(null);
  const { showToast } = useToast();

  // Create or get share link when dialog opens
  useEffect(() => {
    if (isOpen && document) {
      createOrGetShareLink();
    }
  }, [isOpen, document]);

  // Auto-select link when dialog opens
  useEffect(() => {
    if (isOpen && shareUrl && linkInputRef.current) {
      setTimeout(() => {
        linkInputRef.current.select();
      }, 100);
    }
  }, [isOpen, shareUrl]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const createOrGetShareLink = async () => {
    setLoading(true);
    try {
      // Get existing shares first
      const shares = await shareService.getDocumentShares(document.id);
      
      // Look for an existing simple share
      const existingShare = shares.find(s => 
        s.share_type === 'link' && 
        s.permissions.length === 1 && 
        s.permissions[0] === 'view' &&
        !s.password_hash &&
        s.is_active
      );

      if (existingShare) {
        setShareUrl(existingShare.shareUrl);
      } else {
        // Create a new share
        const result = await shareService.createShareLink(document.id, {
          permissions: ['view']
        });
        setShareUrl(result.shareUrl);
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
      showToast('Failed to create share link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Link copied!', 'success');
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        ref={dialogRef}
        className="bg-gradient-to-b from-dark-secondary/95 to-dark-secondary/90 backdrop-blur-xl rounded-2xl w-full max-w-md shadow-2xl border border-gray-700/40 transform animate-scaleIn relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(59, 130, 246, 0.1)',
        }}
      >
        {/* Animated gradient overlay */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
          }}
        />
        
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes scaleIn {
            from { 
              opacity: 0;
              transform: scale(0.9);
            }
            to { 
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          
          .animate-scaleIn {
            animation: scaleIn 0.3s ease-out;
          }
        `}</style>
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-gray-700/30">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-text-secondary/80 tracking-wide">Share</p>
            <h2 className="text-xl font-semibold text-text-primary tracking-tight leading-tight">
              {document.title.length > 40 
                ? document.title.substring(0, 40) + '...'
                : document.title
              }
            </h2>
          </div>
          <button
            onClick={onClose}
            className="group p-2 hover:bg-dark-lighter/30 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 self-start"
          >
            <X className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-6 space-y-5">
          {/* Share Link */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={linkInputRef}
                type="text"
                value={shareUrl}
                readOnly
                className="w-full px-4 py-3 bg-gradient-to-r from-dark-primary/60 to-dark-primary/40 text-text-primary rounded-xl
                         border border-gray-700/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                         text-sm font-mono transition-all duration-200 hover:border-gray-600/50"
                placeholder={loading ? "Creating link..." : ""}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={handleCopy}
              disabled={!shareUrl || loading}
              className={`relative px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95
                       flex items-center gap-2.5 overflow-hidden ${
                copied
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
              }`}
            >
              <div className={`absolute inset-0 bg-white/20 transition-transform duration-500 ${
                copied ? 'translate-x-0' : '-translate-x-full'
              }`} />
              {copied ? (
                <>
                  <Check className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Permission Notice */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-sm text-blue-300 font-medium">
              Anyone with this link can view this document
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}