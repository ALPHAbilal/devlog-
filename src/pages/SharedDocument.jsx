/**
 * SharedDocument Page
 * Clean, modern shared document viewer
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lock, Eye, Download, Share2, Copy, Check,
  AlertCircle, Shield, Clock, User, FileText, Link
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
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [shareCode]);

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
          const { document } = await shareService.getSharedDocument(shareCode, providedPassword);
          setDocument(document);
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
    if (!document?.permissions?.includes('download')) return;
    const content = document.blocks.map(b => b.content).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Loading document...</span>
        </div>
      </div>
    );
  }

  // Password Prompt
  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-dark-secondary/90 border border-gray-700/50 rounded-2xl p-6">
            <div className="text-center mb-5">
              <div className="inline-flex p-3 bg-accent-green/15 rounded-xl mb-4">
                <Lock className="w-6 h-6 text-accent-green" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                Protected Document
              </h2>
              <p className="text-sm text-text-secondary">
                Enter password to continue
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 bg-dark-primary/80 border border-gray-700/50
                         rounded-xl text-text-primary placeholder-text-secondary/50
                         focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-accent-green hover:bg-emerald-600
                         text-white font-medium rounded-xl transition-colors"
              >
                Unlock
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
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-dark-secondary/90 border border-gray-700/50 rounded-2xl p-6">
            <div className="inline-flex p-3 bg-red-500/15 rounded-xl mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              {error.includes('no longer exists') ? 'Not Found' : 'Access Denied'}
            </h2>
            <p className="text-sm text-text-secondary mb-5">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-accent-green hover:bg-emerald-600
                       text-white font-medium rounded-xl transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!document) return null;

  const { permissions = [], shareSettings = {} } = document;
  const canDownload = permissions.includes('download');

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header Card */}
      <div className="pt-8 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-dark-secondary/80 border border-accent-green/20 rounded-2xl p-6">
            {/* Top Row: Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2.5 bg-accent-green/15 rounded-xl flex-shrink-0">
                <Link className="w-5 h-5 text-accent-green" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-text-primary leading-tight mb-1 break-words">
                  {document.title}
                </h1>
                <div className="w-12 h-0.5 bg-accent-green/40 rounded-full" />
              </div>
            </div>

            {/* Meta Row */}
            <div className="flex items-center gap-3 text-xs text-text-secondary mb-5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-text-secondary/70" />
                <span>{document.profiles?.display_name || document.profiles?.username || 'Anonymous'}</span>
              </div>
              <span className="text-text-secondary/30">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-text-secondary/70" />
                <span>
                  {new Date(document.updated_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
              <span className="text-text-secondary/30">•</span>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-accent-green" />
                <span className="text-accent-green font-medium capitalize">
                  {permissions.join(', ')}
                </span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center gap-2">
              {canDownload && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3.5 py-2 bg-dark-primary/60
                           border border-gray-700/50 rounded-xl text-sm text-text-secondary
                           hover:text-text-primary hover:border-gray-600/50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-accent-green text-white'
                    : 'bg-accent-green/15 border border-accent-green/30 text-accent-green hover:bg-accent-green/25'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      {shareSettings.watermark && (
        <div className="px-4 mb-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-yellow-500/10
                          border border-yellow-500/20 rounded-xl">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-300">
                This document is watermarked for security
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <div className="px-4 mb-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-accent-green/10 text-accent-green
                           text-xs font-medium rounded-lg border border-accent-green/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className="px-4 pb-20">
        <div className="max-w-2xl mx-auto space-y-3">
          {document.blocks && document.blocks.length > 0 ? (
            document.blocks.map((block, index) => (
              <div key={block.id} className="rounded-xl hover:bg-dark-lighter/10 transition-colors">
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
            ))
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex p-4 bg-dark-secondary/50 rounded-2xl mb-4">
                <FileText className="w-8 h-8 text-text-secondary/50" />
              </div>
              <p className="text-text-secondary">No content yet</p>
              <p className="text-sm text-text-secondary/60 mt-1">Check back later</p>
            </div>
          )}
        </div>
      </div>

      {/* Watermark Overlay */}
      {shareSettings.watermark && (
        <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center">
          <div className="rotate-45 text-6xl font-bold text-text-primary opacity-[0.02] select-none">
            {document.watermark}
          </div>
        </div>
      )}
    </div>
  );
}
