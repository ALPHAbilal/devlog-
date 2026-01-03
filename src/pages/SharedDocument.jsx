/**
 * SharedDocument Page - Minimal Design
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lock, Download, Check, AlertCircle,
  Shield, User, FileText, Link
} from 'lucide-react';
import { shareService } from '@/features/share';
import { useAuth } from '@/app/providers';
import Block from '../components/Block';
import { useToast } from '@/shared/hooks';

export default function SharedDocument() {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sharedDoc, setSharedDoc] = useState(null);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [shareCode]);

  // Hide body scrollbar to prevent double scrollbars
  useEffect(() => {
    if (typeof window !== 'undefined' && window.document?.body) {
      window.document.body.style.overflow = 'hidden';
    }
    return () => {
      if (typeof window !== 'undefined' && window.document?.body) {
        window.document.body.style.overflow = '';
      }
    };
  }, []);

  const checkAccess = async (providedPassword = null) => {
    setLoading(true);
    setError(null);

    try {
      const accessCheck = await shareService.checkShareAccess(shareCode, providedPassword);

      if (!accessCheck.has_access) {
        if (accessCheck.requires_password) {
          setShowPasswordPrompt(true);
        } else if (accessCheck.message.includes('Authentication required') && !user) {
          navigate(`/auth?redirect=/shared/${shareCode}`);
        } else {
          setError(accessCheck.message || 'Access denied');
        }
      } else {
        try {
          const { document: doc } = await shareService.getSharedDocument(shareCode, providedPassword);
          setSharedDoc(doc);
        } catch (err) {
          setError(err.message || 'Failed to load document');
        }
      }
    } catch (err) {
      console.error('Share access error:', err);
      setError('Failed to load shared document');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    checkAccess(password);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('Link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleDownload = () => {
    if (!sharedDoc?.permissions?.includes('download')) return;
    const content = sharedDoc.blocks.map(b => b.content).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${sharedDoc.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading State
  if (loading) {
    return (
      <div className="h-screen bg-dark-primary flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Loading...</span>
        </div>
      </div>
    );
  }

  // Password Prompt
  if (showPasswordPrompt) {
    return (
      <div className="h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="w-full max-w-xs">
          <div className="bg-dark-secondary/90 border border-gray-700/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent-green/15 rounded-lg">
                <Lock className="w-4 h-4 text-accent-green" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-text-primary">Protected</h2>
                <p className="text-xs text-text-secondary">Enter password</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 px-3 py-2 bg-dark-primary/80 border border-gray-700/50
                         rounded-lg text-sm text-text-primary placeholder-text-secondary/50
                         focus:outline-none focus:border-accent-green/50"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-accent-green hover:bg-emerald-600
                         text-white text-sm font-medium rounded-lg transition-colors"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-accent-green hover:bg-emerald-600
                     text-white text-sm font-medium rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!sharedDoc) return null;

  const { permissions = [], shareSettings = {} } = sharedDoc;
  const canDownload = permissions.includes('download');
  const authorName = sharedDoc.profiles?.display_name || sharedDoc.profiles?.username || 'Anonymous';
  const dateStr = new Date(sharedDoc.updated_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });

  return (
    <div className="h-screen bg-dark-primary overflow-y-auto">
      {/* Toolbar Header */}
      <div className="border-b border-gray-800/40 bg-dark-primary sticky top-0 z-40">
        <div className="flex items-center justify-between h-11 px-4">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-text-secondary flex-shrink-0" />
            <span className="text-sm text-text-primary truncate font-medium">
              {sharedDoc.title}
            </span>
            <span className="text-xs text-text-secondary/50 flex-shrink-0">
              {permissions[0]}
            </span>
          </div>

          {/* Right: Icon Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              className="p-2 text-text-secondary/70 hover:text-text-primary
                       hover:bg-white/5 rounded-md transition-colors"
              title={`By ${authorName} • ${dateStr}`}
            >
              <User className="w-4 h-4" />
            </button>
            {canDownload && (
              <button
                onClick={handleDownload}
                className="p-2 text-text-secondary/70 hover:text-text-primary
                         hover:bg-white/5 rounded-md transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-md transition-colors ${
                copied
                  ? 'text-accent-green bg-accent-green/10'
                  : 'text-text-secondary/70 hover:text-text-primary hover:bg-white/5'
              }`}
              title={copied ? 'Copied!' : 'Copy link'}
            >
              {copied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      {shareSettings.watermark && (
        <div className="bg-yellow-500/5 border-b border-yellow-500/10">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-yellow-400/70" />
            <span className="text-xs text-yellow-300/70">Watermarked</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tags */}
        {sharedDoc.tags && sharedDoc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {sharedDoc.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-accent-green/10 text-accent-green
                         text-xs rounded border border-accent-green/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Blocks */}
        <div className="space-y-2">
          {sharedDoc.blocks && sharedDoc.blocks.length > 0 ? (
            sharedDoc.blocks.map((block, index) => (
              <div
                key={block.id}
                className="relative"
                style={{ zIndex: sharedDoc.blocks.length - index }}
              >
                <Block
                  block={block}
                  isFirst={index === 0}
                  isLast={index === sharedDoc.blocks.length - 1}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                  onAddBelow={() => {}}
                  onConvert={() => {}}
                  showAddButton={false}
                  isFocused={true}
                  readOnly={true}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText className="w-6 h-6 text-text-secondary/40 mx-auto mb-2" />
              <p className="text-sm text-text-secondary/60">No content</p>
            </div>
          )}
        </div>
      </div>

      {/* Watermark Overlay */}
      {shareSettings.watermark && (
        <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center">
          <div className="rotate-45 text-5xl font-bold text-text-primary opacity-[0.015] select-none">
            {sharedDoc.watermark}
          </div>
        </div>
      )}
    </div>
  );
}
