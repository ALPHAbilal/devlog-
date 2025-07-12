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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert share directly
      const { data, error } = await supabase
        .from('document_shares')
        .insert({
          document_id: documentId,
          created_by: user.id,
          share_type: shareType,
          permissions: permissions,
          password_hash: passwordHash,
          expires_at: expiresAt,
          max_views: maxViews,
          settings: settings
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        shareId: data.id,
        shareCode: data.share_code,
        shareUrl: `${window.location.origin}/shared/${data.share_code}`,
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
        email: email.toLowerCase()
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

      // The function returns a single row, extract it
      return data[0] || { has_access: false, message: 'Share not found' };
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
      
      if (!accessCheck.has_access) {
        throw new Error(accessCheck.message || 'Access denied');
      }

      // Log the access
      await this.logAccess(accessCheck.share_id, 'view', accessCheck.document_id);

      // Get document with permissions applied
      const { data: documents, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          tags,
          created_at,
          updated_at,
          metadata,
          user_id
        `)
        .eq('id', accessCheck.document_id);

      if (error) throw error;
      
      // Check if document exists
      if (!documents || documents.length === 0) {
        throw new Error('Document not found or has been deleted');
      }
      
      const document = documents[0];

      // Fetch the profile separately
      let profile = null;
      if (document.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', document.user_id)
          .single();
        
        profile = profileData;
      }

      // Get blocks if user has view permission
      let blocks = [];
      if (accessCheck.permissions.includes('view')) {
        const { data: blocksData, error: blocksError } = await supabase
          .from('blocks')
          .select('*')
          .eq('document_id', accessCheck.document_id)
          .order('position');

        if (blocksError) throw blocksError;
        blocks = blocksData || [];
      }

      // Get share details
      const { data: shareData } = await supabase
        .from('document_shares')
        .select('*')
        .eq('id', accessCheck.share_id)
        .single();

      // Apply watermark if required
      if (shareData?.settings?.watermark) {
        document.watermark = this.generateWatermark();
      }

      return {
        document: {
          ...document,
          blocks,
          profiles: profile,
          isShared: true,
          permissions: accessCheck.permissions,
          shareSettings: shareData?.settings || {}
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
            email,
            accepted_at
          )
        `)
        .eq('document_id', documentId)
        .eq('is_active', true)
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
          is_active: false
        })
        .eq('id', shareId);

      if (error) throw error;

      // Log the revocation is not needed as it's not a valid action in our schema

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_shared_documents', {
        p_user_id: user.id
      });

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
    // For client-side, we'll use a salted SHA-256 hash
    // In production, this should ideally be done server-side with bcrypt
    const salt = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // Store salt with hash for verification
    return `${salt}:${hashHex}`;
  }

  /**
   * Generate watermark text
   */
  generateWatermark() {
    const timestamp = new Date().toLocaleString();
    return `Shared document - Viewed ${timestamp}`;
  }

  /**
   * Get or create anonymous ID for tracking
   */
  getAnonymousId() {
    let anonId = localStorage.getItem('devlog_anon_id');
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem('devlog_anon_id', anonId);
    }
    return anonId;
  }

  /**
   * Log share access
   * @param {string} shareId - The share accessed
   * @param {string} action - The action performed
   */
  async logAccess(shareId, action, documentId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get document ID if not provided
      if (!documentId) {
        const { data } = await supabase
          .from('document_shares')
          .select('document_id')
          .eq('id', shareId)
          .single();
        documentId = data?.document_id;
      }

      await supabase.rpc('log_share_access', {
        p_share_id: shareId,
        p_document_id: documentId,
        p_action: action,
        p_user_id: user?.id || null,
        p_anonymous_id: !user ? this.getAnonymousId() : null,
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