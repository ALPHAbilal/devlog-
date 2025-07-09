import React from 'react';
import { Check, AlertCircle, RefreshCw, Cloud, CloudOff } from 'lucide-react';

export default function SaveIndicator({ status, className = '' }) {
  if (!status) return null;

  const configs = {
    pending: {
      icon: Cloud,
      text: 'Saving...',
      className: 'text-text-secondary',
      animate: true
    },
    saving: {
      icon: RefreshCw,
      text: 'Saving...',
      className: 'text-accent-yellow',
      animate: true
    },
    saved: {
      icon: Check,
      text: 'Saved',
      className: 'text-accent-green'
    },
    error: {
      icon: AlertCircle,
      text: 'Save failed',
      className: 'text-accent-red'
    },
    retrying: {
      icon: RefreshCw,
      text: 'Retrying...',
      className: 'text-accent-yellow',
      animate: true
    },
    offline: {
      icon: CloudOff,
      text: 'Offline',
      className: 'text-text-secondary'
    }
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 text-sm ${config.className} ${className}`}>
      <Icon 
        size={16} 
        className={config.animate ? 'animate-spin' : ''}
      />
      <span>{config.text}</span>
    </div>
  );
}