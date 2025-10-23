import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextOptimized';
import { supabase } from '../../lib/supabase';

export default function ApiKeysSection() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null); // For one-time display
  const [expandedGuides, setExpandedGuides] = useState({});

  // Load API keys
  useEffect(() => {
    loadApiKeys();
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key');
      return;
    }

    setCreatingKey(true);
    try {
      // Generate secure random key (same as current implementation)
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const apiKey = 'dvlg_sk_prod_' +
        Array.from(keyBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

      // Hash for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Store in database
      const { data: newKey, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName.trim(),
          key_hash: keyHash,
          key_preview: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
        })
        .select()
        .single();

      if (error) throw error;

      // Show full key once
      setNewApiKey(apiKey);
      setApiKeys([newKey, ...apiKeys]);
      setNewKeyName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const deleteApiKey = async (id) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      // Soft delete
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setApiKeys(apiKeys.filter(key => key.id !== id));
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const toggleGuide = (guide) => {
    setExpandedGuides({ ...expandedGuides, [guide]: !expandedGuides[guide] });
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">API Keys</h1>
        <p className="section-description">Connect Docling to your AI tools</p>
      </div>

      <hr className="section-divider" />

      {/* Create API Key */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', lineHeight: '28px', margin: 0 }}>Create API Key</h2>

        <button
          className="btn-primary"
          style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '12px' }}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          Create New API Key
        </button>
      </div>

      <hr className="section-divider" />

      {/* Active Keys */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', lineHeight: '28px', margin: 0 }}>Active Keys</h2>

        {loading ? (
          <p>Loading...</p>
        ) : apiKeys.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No API keys created yet</p>
        ) : (
          apiKeys.map(key => (
            <div key={key.id} className="api-key-card">
              {/* Key Header */}
              <div className="api-key-header">
                <div className="api-key-info">
                  <div className="api-key-name">{key.name}</div>
                  <div className="api-key-metadata">
                    <span>Created {new Date(key.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {key.last_used_at && (
                      <span>Last used {new Date(key.last_used_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>

                <div className="api-key-actions">
                  <button
                    className="delete-button"
                    onClick={() => deleteApiKey(key.id)}
                    aria-label="Delete API key"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Masked Key Display */}
              <div className="api-key-preview">
                <code>{key.key_preview || '•'.repeat(58)}</code>
                <button onClick={() => copyToClipboard(key.key_preview)} aria-label="Copy API key">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <hr className="section-divider" />

      {/* Quick Setup Guide */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', lineHeight: '28px', margin: 0 }}>Quick Setup Guide</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Claude Desktop', 'VS Code', 'Cursor'].map(tool => (
            <div key={tool} className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                className="accordion-button"
                onClick={() => toggleGuide(tool)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>{tool}</span>
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    transform: expandedGuides[tool] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>

              {expandedGuides[tool] && (
                <div className="accordion-content">
                  <p>Setup instructions for {tool} coming soon...</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create API Key</h2>
            <p>Enter a name for your API key to help you identify it later.</p>
            <div className="input-group">
              <label className="input-label">Key Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Claude Desktop"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={createApiKey}
                disabled={!newKeyName.trim() || creatingKey}
              >
                {creatingKey ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* One-time Key Display Modal */}
      {newApiKey && (
        <div className="modal-overlay" onClick={() => setNewApiKey(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>API Key Created</h2>
            <p>Copy this API key now. You won't be able to see it again!</p>
            <div className="key-display" style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px' }}>
              <code style={{ fontSize: '12px', fontFamily: 'Consolas, monospace', color: 'var(--accent-green)', wordBreak: 'break-all', flex: 1 }}>
                {newApiKey}
              </code>
              <button className="icon-button" onClick={() => copyToClipboard(newApiKey)}>
                <Copy size={16} />
              </button>
            </div>
            <button className="btn-primary" onClick={() => setNewApiKey(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
