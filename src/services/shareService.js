/**
 * Document Sharing Service
 * 
 * Handles all document sharing functionality including:
 * - Creating share links with permissions
 * - Managing share access and security
 * - Tracking share analytics
 * - Handling collaborative features
 */

import { supabase } from '../lib/supabase';
import { logError } from '../utils/monitoring';

export class ShareService {
  /**
   * Create a share link for a document
   * @param {string} documentId - The document to share
   * @param {Object} options - Share options
   * @returns {Promise<Object>} Share details including URL
   */
  async createShareLink(documentId, options = {}) {
    try {
      const {
        shareType = 'link',
        permissions = ['view'],
        password = null,
        expiresIn = null,
        maxViews = null,
        requireAuth = false,
        watermark = false,
        allowedDomains = [],
        notifyOnAccess = false
      } = options;

      // Build settings object
      const settings = {
        requireAuth,
        watermark,
        notifyOnAccess
      };

      if (allowedDomains.length > 0) {
        settings.allowedDomains = allowedDomains;
      }

      // Calculate expiration date if provided
      let expiresAt = null;
      if (expiresIn) {
        expiresAt = this.calculateExpiration(expiresIn);
      }

      // Hash password if provided
      let passwordHash = null;
      if (password) {
        passwordHash = await this.hashPassword(password);
      }

      // Call the database function to create share
      const { data, error } = await supabase.rpc('create_document_share', {
        p_document_id: documentId,
        p_user_id: (await supabase.auth.getUser()).data.user.id,
        p_share_type: shareType,
        p_permissions: permissions,
        p_settings: settings
      });

      if (error) throw error;

      // Update with additional settings if needed
      if (passwordHash || expiresAt || maxViews) {
        const { error: updateError } = await supabase
          .from('document_shares')
          .update({
            password_hash: passwordHash,
            expires_at: expiresAt,
            max_views: maxViews
          })
          .eq('id', data.share_id);

        if (updateError) throw updateError;
      }

      return {
        shareId: data.share_id,
        shareCode: data.share_code,
        shareUrl: `${window.location.origin}/shared/${data.share_code}`,
        fullUrl: data.share_url,
        permissions,
        expiresAt
      };
    } catch (error) {
      logError(error, { context: 'createShareLink', documentId });
      throw error;
    }
  }

  /**
   * Share document with specific users
   * @param {string} documentId - The document to share
   * @param {string[]} emails - Email addresses to share with
   * @param {Object} options - Share options
   */
  async shareWithUsers(documentId, emails, options = {}) {
    try {
      const { permissions = ['view'], message = '' } = options;

      // Create a user-specific share
      const share = await this.createShareLink(documentId, {
        shareType: 'user',
        permissions,
        requireAuth: true
      });

      // Add users to the share
      const invitations = emails.map(email => ({
        share_id: share.shareId,
        user_email: email.toLowerCase()
      }));

      const { error } = await supabase
        .from('document_share_users')
        .insert(invitations);

      if (error) throw error;

      // TODO: Send email notifications to invited users
      // This would integrate with your email service

      return {
        shareId: share.shareId,
        invitedUsers: emails,
        shareUrl: share.shareUrl
      };
    } catch (error) {
      logError(error, { context: 'shareWithUsers', documentId });
      throw error;
    }
  }

  /**
   * Check if a user has access to a shared document
   * @param {string} shareCode - The share code from URL
   * @param {string} password - Optional password
   * @returns {Promise<Object>} Access details
   */
  async checkShareAccess(shareCode, password = null) {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      const { data, error } = await supabase.rpc('check_share_access', {
        p_share_code: shareCode,
        p_user_id: user?.id || null,
        p_password: password
      });

      if (error) throw error;

      return data;
    } catch (error) {
      logError(error, { context: 'checkShareAccess' });
      throw error;
    }
  }

  /**
   * Get shared document content
   * @param {string} shareCode - The share code
   * @param {string} password - Optional password
   */
  async getSharedDocument(shareCode, password = null) {
    try {
      // First check access
      const accessCheck = await this.checkShareAccess(shareCode, password);
      
      if (!accessCheck.access) {
        throw new Error(accessCheck.reason);
      }

      // Log the access
      await this.logAccess(accessCheck.share_id, 'view');

      // Get document with permissions applied
      const { data: document, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          tags,
          created_at,
          updated_at,
          metadata,
          user:profiles!documents_user_id_fkey(
            username,
            display_name
          )
        `)
        .eq('id', accessCheck.document_id)
        .single();

      if (error) throw error;

      // Get blocks if user has view permission
      let blocks = [];
      if (accessCheck.permissions.includes('view')) {
        const { data: blocksData, error: blocksError } = await supabase
          .from('blocks')
          .select('*')
          .eq('document_id', accessCheck.document_id)
          .eq('deleted_at', null)
          .order('position');

        if (blocksError) throw blocksError;
        blocks = blocksData || [];
      }

      // Apply watermark if required
      if (accessCheck.settings?.watermark) {
        document.watermark = this.generateWatermark();
      }

      return {
        document: {
          ...document,
          blocks,
          isShared: true,
          permissions: accessCheck.permissions,
          shareSettings: accessCheck.settings
        },
        shareId: accessCheck.share_id
      };
    } catch (error) {
      logError(error, { context: 'getSharedDocument' });
      throw error;
    }
  }

  /**
   * Get all shares for a document
   * @param {string} documentId - The document ID
   */
  async getDocumentShares(documentId) {
    try {
      const { data, error } = await supabase
        .from('document_shares')
        .select(`
          *,
          document_share_users(
            user_email,
            accepted_at
          )
        `)
        .eq('document_id', documentId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(share => ({
        ...share,
        shareUrl: `${window.location.origin}/shared/${share.share_code}`,
        isExpired: share.expires_at && new Date(share.expires_at) < new Date(),
        viewsRemaining: share.max_views ? share.max_views - share.view_count : null
      }));
    } catch (error) {
      logError(error, { context: 'getDocumentShares', documentId });
      throw error;
    }
  }

  /**
   * Revoke a share
   * @param {string} shareId - The share to revoke
   */
  async revokeShare(shareId) {
    try {
      const { error } = await supabase
        .from('document_shares')
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: (await supabase.auth.getUser()).data.user.id
        })
        .eq('id', shareId);

      if (error) throw error;

      // Log the revocation
      await this.logAccess(shareId, 'revoked');

      return { success: true };
    } catch (error) {
      logError(error, { context: 'revokeShare', shareId });
      throw error;
    }
  }

  /**
   * Update share permissions
   * @param {string} shareId - The share to update
   * @param {Object} updates - Updates to apply
   */
  async updateShare(shareId, updates) {
    try {
      const { permissions, settings, expiresAt, maxViews } = updates;

      const updateData = {};
      if (permissions) updateData.permissions = permissions;
      if (settings) updateData.settings = settings;
      if (expiresAt !== undefined) updateData.expires_at = expiresAt;
      if (maxViews !== undefined) updateData.max_views = maxViews;

      const { error } = await supabase
        .from('document_shares')
        .update(updateData)
        .eq('id', shareId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      logError(error, { context: 'updateShare', shareId });
      throw error;
    }
  }

  /**
   * Get share analytics
   * @param {string} shareId - The share to analyze
   */
  async getShareAnalytics(shareId) {
    try {
      // Get access logs
      const { data: logs, error } = await supabase
        .from('share_access_logs')
        .select(`
          *,
          user:auth.users(email)
        `)
        .eq('share_id', shareId)
        .order('accessed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate analytics
      const analytics = {
        totalViews: 0,
        uniqueViewers: new Set(),
        actions: {},
        timeline: [],
        locations: new Map()
      };

      logs.forEach(log => {
        if (log.action === 'view') analytics.totalViews++;
        
        if (log.accessed_by) {
          analytics.uniqueViewers.add(log.accessed_by);
        } else if (log.anonymous_id) {
          analytics.uniqueViewers.add(`anon_${log.anonymous_id}`);
        }

        analytics.actions[log.action] = (analytics.actions[log.action] || 0) + 1;

        analytics.timeline.push({
          time: log.accessed_at,
          action: log.action,
          user: log.user?.email || 'Anonymous'
        });
      });

      return {
        totalViews: analytics.totalViews,
        uniqueViewers: analytics.uniqueViewers.size,
        actionBreakdown: analytics.actions,
        recentActivity: analytics.timeline.slice(0, 20)
      };
    } catch (error) {
      logError(error, { context: 'getShareAnalytics', shareId });
      throw error;
    }
  }

  /**
   * Get documents shared with the current user
   */
  async getSharedWithMe() {
    try {
      const { data, error } = await supabase.rpc('get_shared_documents');

      if (error) throw error;

      return data;
    } catch (error) {
      logError(error, { context: 'getSharedWithMe' });
      throw error;
    }
  }

  // Helper methods

  /**
   * Calculate expiration date from duration string
   * @param {string} duration - Duration like '7d', '1h', '30m'
   */
  calculateExpiration(duration) {
    const now = new Date();
    const match = duration.match(/^(\d+)([dhm])$/);
    
    if (!match) throw new Error('Invalid duration format');
    
    const [, amount, unit] = match;
    const value = parseInt(amount);
    
    switch (unit) {
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
    }
    
    return now.toISOString();
  }

  /**
   * Hash password for share protection
   * @param {string} password - Plain text password
   */
  async hashPassword(password) {
    // For now, we'll use a simple approach
    // In production, this should use bcrypt through a server function
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }

  /**
   * Generate watermark text
   */
  generateWatermark() {
    const user = supabase.auth.getUser();
    const timestamp = new Date().toISOString();
    return `Shared document - ${user?.email || 'Guest'} - ${timestamp}`;
  }

  /**
   * Log share access
   * @param {string} shareId - The share accessed
   * @param {string} action - The action performed
   */
  async logAccess(shareId, action) {
    try {
      await supabase.rpc('log_share_access', {
        p_share_id: shareId,
        p_action: action,
        p_user_id: (await supabase.auth.getUser()).data.user?.id || null,
        p_ip_address: null, // Would be set server-side
        p_user_agent: navigator.userAgent
      });
    } catch (error) {
      // Don't throw on logging errors
      console.error('Failed to log access:', error);
    }
  }
}

// Export singleton instance
export const shareService = new ShareService();