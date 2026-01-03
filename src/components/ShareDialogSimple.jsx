import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Link } from 'lucide-react';
import { shareService } from '@/features/share';
import { useToast } from '@/shared/hooks';

export function ShareDialogSimple({ document, isOpen, onClose }) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const dialogRef = useRef(null);
  const linkInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && document) {
      createOrGetShareLink();
    }
  }, [isOpen, document]);

  useEffect(() => {
    if (isOpen && shareUrl && linkInputRef.current) {
      setTimeout(() => linkInputRef.current.select(), 100);
    }
  }, [isOpen, shareUrl]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const createOrGetShareLink = async () => {
    setLoading(true);
    try {
      const shares = await shareService.getDocumentShares(document.id);
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
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="bg-dark-secondary/95 backdrop-blur-xl rounded-2xl w-full max-w-sm shadow-2xl border border-accent-green/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-green/15 rounded-lg">
              <Link className="w-4 h-4 text-accent-green" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary/70 uppercase tracking-wider">Share</p>
              <h2 className="text-base font-semibold text-text-primary truncate max-w-[240px]">
                {document.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-lighter/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-text-secondary hover:text-text-primary" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Share Link */}
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                ref={linkInputRef}
                type="text"
                value={shareUrl}
                readOnly
                className="w-full px-3.5 py-2.5 bg-dark-primary/80 text-text-primary rounded-xl
                         border border-gray-700/50 focus:outline-none focus:border-accent-green/50
                         focus:ring-1 focus:ring-accent-green/20 text-sm font-mono transition-colors"
                placeholder={loading ? "Creating link..." : ""}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={handleCopy}
              disabled={!shareUrl || loading}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                copied
                  ? 'bg-accent-green text-white'
                  : 'bg-accent-green hover:bg-emerald-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Permission Notice */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-accent-green/10 rounded-xl border border-accent-green/20">
            <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
            <span className="text-xs text-accent-green/90">
              Anyone with this link can view
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
