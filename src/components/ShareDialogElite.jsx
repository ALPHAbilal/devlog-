import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Link2, Check, ChevronDown, Lock, Calendar, Eye, Edit3, Sparkles, Globe, Users, Shield } from 'lucide-react';
import { shareService } from '../services/shareService';
import { useToast } from '../hooks/useToast';

export function ShareDialogElite({ document, isOpen, onClose }) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [permission, setPermission] = useState('view');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activePreset, setActivePreset] = useState('public');
  
  // Advanced options
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  
  const dialogRef = useRef(null);
  const linkInputRef = useRef(null);
  const copyButtonRef = useRef(null);
  const { showToast } = useToast();

  // Permission presets
  const presets = [
    { 
      id: 'public', 
      label: 'Public', 
      icon: Globe, 
      description: 'Anyone with the link',
      permission: 'view',
      color: 'blue'
    },
    { 
      id: 'team', 
      label: 'Team', 
      icon: Users, 
      description: 'Your team members',
      permission: 'edit',
      color: 'purple'
    },
    { 
      id: 'private', 
      label: 'Private', 
      icon: Shield, 
      description: 'Only specific people',
      permission: 'view',
      requiresPassword: true,
      color: 'amber'
    }
  ];

  // Create or get share link when dialog opens
  useEffect(() => {
    if (isOpen && document) {
      createOrGetShareLink();
    }
  }, [isOpen, document]);

  // Auto-select link when ready with smooth animation
  useEffect(() => {
    if (isOpen && shareUrl && linkInputRef.current) {
      const timer = setTimeout(() => {
        linkInputRef.current.select();
        linkInputRef.current.focus();
        // Add glow effect on focus
        linkInputRef.current.classList.add('focused');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shareUrl]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      
      // Cmd/Ctrl + C to copy
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && shareUrl) {
        e.preventDefault();
        handleCopy();
      }
      
      // Tab navigation for presets
      if (e.key === 'Tab' && !e.shiftKey) {
        // Custom tab handling
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shareUrl]);

  const handleClose = () => {
    setIsClosing(true);
    linkInputRef.current?.classList.remove('focused');
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

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

  const handleCopy = useCallback(async () => {
    if (!shareUrl || copied) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // Trigger success animation
      if (copyButtonRef.current) {
        copyButtonRef.current.classList.add('success-pulse');
      }
      
      // Show floating toast above button
      const rect = copyButtonRef.current?.getBoundingClientRect();
      if (rect) {
        showToast('Link copied!', 'success', {
          position: { x: rect.left + rect.width / 2, y: rect.top - 10 }
        });
      }
      
      // Reset after animation
      setTimeout(() => {
        setCopied(false);
        copyButtonRef.current?.classList.remove('success-pulse');
      }, 2500);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  }, [shareUrl, copied, showToast]);

  const handlePresetSelect = (preset) => {
    setActivePreset(preset.id);
    setPermission(preset.permission);
    
    if (preset.requiresPassword && !password) {
      setShowAdvanced(true);
      // Focus password field after animation
      setTimeout(() => {
        document.querySelector('input[type="password"]')?.focus();
      }, 300);
    }
  };

  const handleUpdateShare = async () => {
    setIsUpdating(true);
    try {
      const result = await shareService.createShareLink(document.id, {
        permissions: [permission],
        password: password || null,
        expiresIn: expiresIn || null
      });
      
      setShareUrl(result.shareUrl);
      showToast('Share settings updated', 'success');
      
      // Copy the new link automatically
      await navigator.clipboard.writeText(result.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      
    } catch (error) {
      showToast('Failed to update share settings', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 share-dialog-elite ${
        isClosing ? 'closing' : ''
      }`}
      onClick={handleClose}
    >
      {/* Enhanced backdrop with gradient and blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-blue-900/90 backdrop-blur-xl share-backdrop-elite" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
      </div>
      
      {/* Dialog with premium styling */}
      <div 
        ref={dialogRef}
        className="relative bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-2xl w-full max-w-[480px] 
                   shadow-2xl shadow-black/50 overflow-hidden share-dialog-elite
                   border border-white/10 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none noise-texture" />
        
        {/* Header with refined styling */}
        <div className="relative px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">
                Share Document
              </h2>
              <p className="mt-1 text-sm text-slate-400 font-medium">
                <span className="inline-block max-w-[300px] truncate align-bottom">
                  {document.title}
                </span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2.5 hover:bg-white/5 rounded-xl transition-all hover:scale-110 
                       hover:rotate-90 close-button-elite group"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Content with improved spacing */}
        <div className="px-8 pb-8 space-y-6">
          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-3">
            {presets.map((preset) => {
              const Icon = preset.icon;
              const isActive = activePreset === preset.id;
              
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`relative p-4 rounded-xl transition-all duration-200 preset-button
                           ${isActive 
                             ? `bg-${preset.color}-500/20 border-${preset.color}-500/50` 
                             : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80'
                           } border backdrop-blur-sm group`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon className={`w-5 h-5 transition-colors ${
                      isActive ? `text-${preset.color}-400` : 'text-slate-400 group-hover:text-white'
                    }`} />
                    <span className={`text-xs font-medium ${
                      isActive ? 'text-white' : 'text-slate-300'
                    }`}>
                      {preset.label}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-white/20 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Share Link Section with premium styling */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Share link
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1 link-input-elite">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={linkInputRef}
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 text-white rounded-xl
                           border border-slate-700/50 focus:border-blue-500/50
                           focus:ring-2 focus:ring-blue-500/20 transition-all duration-200
                           text-sm font-mono selection:bg-blue-500/30 placeholder-slate-600
                           backdrop-blur-sm hover:bg-slate-800/70"
                  placeholder={loading ? "Creating secure link..." : ""}
                />
                {loading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                ref={copyButtonRef}
                onClick={handleCopy}
                disabled={!shareUrl || loading}
                className={`px-6 py-3.5 rounded-xl font-medium transition-all duration-200
                         flex items-center gap-2.5 relative overflow-hidden
                         copy-button-elite group ${
                  copied 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                } disabled:bg-slate-700 disabled:shadow-none disabled:cursor-not-allowed
                  hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="relative z-10">
                  {copied ? (
                    <div className="flex items-center gap-2 copy-success-elite">
                      <Check className="w-4 h-4" />
                      <span>Copied</span>
                    </div>
                  ) : (
                    <span>Copy link</span>
                  )}
                </div>
                {/* Ripple effect container */}
                <div className="absolute inset-0 -z-10 copy-ripple" />
              </button>
            </div>
          </div>

          {/* Permission Preview */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                permission === 'view' ? 'bg-blue-500/20' : 'bg-orange-500/20'
              }`}>
                {permission === 'view' ? (
                  <Eye className="w-4 h-4 text-blue-400" />
                ) : (
                  <Edit3 className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {permission === 'view' ? 'View only' : 'Can edit'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {permission === 'view' 
                    ? 'Recipients can view but not modify'
                    : 'Recipients can view and make changes'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Settings with smooth reveal */}
          <div className="advanced-section-elite">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full flex items-center justify-between px-5 py-3.5
                       text-sm text-slate-400 hover:text-white
                       bg-slate-800/30 hover:bg-slate-800/50 rounded-xl
                       transition-all duration-200 group backdrop-blur-sm
                       border border-slate-700/30 hover:border-slate-600/50`}
            >
              <span className="font-medium">Advanced settings</span>
              <ChevronDown className={`w-4 h-4 transition-all duration-200 ${
                showAdvanced ? 'rotate-180' : ''
              } group-hover:text-blue-400`} />
            </button>

            <div className={`advanced-content-elite ${showAdvanced ? 'show' : ''}`}>
              <div className="pt-4 space-y-4">
                {/* Password Protection */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Password protection
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 
                                   group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a secure password"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 text-white rounded-xl
                               border border-slate-700/50 focus:border-blue-500/50
                               focus:ring-2 focus:ring-blue-500/20 transition-all duration-200
                               placeholder-slate-600 backdrop-blur-sm hover:bg-slate-800/70"
                    />
                  </div>
                </div>

                {/* Expiration with visual feedback */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Link expiration
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500
                                       group-focus-within:text-blue-400 transition-colors" />
                    <select
                      value={expiresIn}
                      onChange={(e) => setExpiresIn(e.target.value)}
                      className="w-full pl-12 pr-10 py-3.5 bg-slate-800/50 text-white rounded-xl
                               border border-slate-700/50 focus:border-blue-500/50
                               focus:ring-2 focus:ring-blue-500/20 transition-all duration-200
                               appearance-none cursor-pointer backdrop-blur-sm hover:bg-slate-800/70"
                    >
                      <option value="">Never expires</option>
                      <option value="1h">1 hour</option>
                      <option value="1d">1 day</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                  {expiresIn && (
                    <p className="text-xs text-slate-500 mt-1 animate-fade-in">
                      Link will expire {expiresIn === '1h' ? 'in 1 hour' : `after ${expiresIn.replace('d', ' days')}`}
                    </p>
                  )}
                </div>

                {/* Update Button with gradient */}
                <button
                  onClick={handleUpdateShare}
                  disabled={isUpdating}
                  className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600
                           hover:from-blue-600 hover:to-blue-700 text-white
                           rounded-xl font-medium transition-all duration-200 shadow-lg
                           shadow-blue-500/25 hover:shadow-blue-500/40
                           disabled:from-slate-700 disabled:to-slate-700
                           disabled:shadow-none disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 
                           hover:scale-[1.02] active:scale-[0.98]
                           relative overflow-hidden group"
                >
                  <div className="relative z-10 flex items-center gap-2">
                    {isUpdating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Apply changes</span>
                      </>
                    )}
                  </div>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -top-[100%] bg-gradient-to-b from-transparent via-white/10 to-transparent 
                                group-hover:top-[100%] transition-all duration-1000 ease-out" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Elite animations and styles */
        .share-dialog-elite {
          animation: eliteDialogIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .share-dialog-elite.closing {
          animation: eliteDialogOut 0.3s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }

        .share-backdrop-elite {
          animation: backdropFadeIn 0.5s ease-out;
        }

        .closing .share-backdrop-elite {
          animation: backdropFadeOut 0.3s ease-out forwards;
        }

        @keyframes eliteDialogIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes eliteDialogOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
        }

        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes backdropFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* Floating particles */
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%);
          border-radius: 50%;
          animation: float 20s infinite;
        }

        .particle-1 {
          top: 20%;
          left: 10%;
          animation-delay: 0s;
          animation-duration: 25s;
        }

        .particle-2 {
          top: 60%;
          right: 20%;
          animation-delay: 5s;
          animation-duration: 20s;
        }

        .particle-3 {
          bottom: 30%;
          left: 30%;
          animation-delay: 10s;
          animation-duration: 30s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          25% {
            transform: translate(100px, -100px) scale(1.5);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50px, 50px) scale(0.8);
            opacity: 0.3;
          }
          75% {
            transform: translate(50px, 100px) scale(1.2);
            opacity: 0.6;
          }
        }

        /* Noise texture */
        .noise-texture {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E");
        }

        /* Close button animation */
        .close-button-elite {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Premium input focus effect */
        .link-input-elite input.focused {
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.5);
        }

        /* Copy button enhancements */
        .copy-button-elite {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .copy-button-elite.success-pulse {
          animation: successPulse 0.6s ease-out;
        }

        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(52, 211, 153, 0.4); }
          100% { transform: scale(1); }
        }

        .copy-ripple::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
        }

        .copy-button-elite:active .copy-ripple::after {
          animation: ripple 0.6s ease-out;
        }

        @keyframes ripple {
          from {
            opacity: 1;
            transform: scale(0);
          }
          to {
            opacity: 0;
            transform: scale(1.5);
          }
        }

        /* Preset buttons */
        .preset-button {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .preset-button:hover {
          transform: translateY(-2px);
        }

        .preset-button:active {
          transform: translateY(0);
        }

        /* Advanced content animation */
        .advanced-content-elite {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .advanced-content-elite.show {
          max-height: 500px;
          opacity: 1;
        }

        /* Fade in animation */
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        /* Focus states */
        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }

        /* Hover magnetics */
        @media (hover: hover) {
          .copy-button-elite:hover {
            transform: translateY(-1px) scale(1.02);
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .share-dialog-elite {
            border: 2px solid white;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}