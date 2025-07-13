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
      console.log('Checking share access for code:', shareCode);
      
      // Since the SECURITY DEFINER function handles all validation,
      // we can simplify this to just check if password is required
      const { data: share, error: shareError } = await supabase
        .from('document_shares')
        .select('password_hash, is_active')
        .eq('share_code', shareCode)
        .single();

      if (shareError || !share) {
        return { 
          has_access: false, 
          message: 'Share link not found or has been deleted' 
        };
      }

      if (!share.is_active) {
        return { has_access: false, message: 'Share link has been disabled' };
      }

      // Check if password is required but not provided
      if (share.password_hash && !password) {
        return { has_access: false, requires_password: true, message: 'Password required' };
      }

      // For all other validation, we'll let the SECURITY DEFINER function handle it
      // This simplifies the client-side logic significantly
      return {
        has_access: true,
        message: 'Proceeding to document access'
      };
    } catch (error) {
      console.error('checkShareAccess error:', error);
      logError(error, { context: 'checkShareAccess', shareCode });
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
      console.log('Getting shared document for code:', shareCode);
      
      // Use the SECURITY DEFINER function to get document data
      const { data: documentData, error: docError } = await supabase
        .rpc('get_shared_document', {
          p_share_code: shareCode,
          p_password: password
        });

      if (docError) {
        console.error('Error fetching shared document:', docError);
        
        // Handle specific error messages
        if (docError.message.includes('Password required')) {
          throw new Error('Password required');
        } else if (docError.message.includes('Invalid password')) {
          throw new Error('Invalid password');
        } else if (docError.message.includes('expired')) {
          throw new Error('Share link has expired');
        } else if (docError.message.includes('view limit')) {
          throw new Error('Share link has reached its view limit');
        } else if (docError.message.includes('Authentication required')) {
          throw new Error('Authentication required');
        } else if (docError.message.includes('not found')) {
          throw new Error('Document not found or has been deleted');
        } else {
          throw new Error(docError.message || 'Failed to access shared document');
        }
      }

      if (!documentData || documentData.length === 0) {
        throw new Error('Document not found or has been deleted');
      }

      const document = documentData[0];

      // Fetch the profile using SECURITY DEFINER function
      let profile = null;
      if (document.user_id) {
        const { data: profileData } = await supabase
          .rpc('get_shared_document_profile', {
            p_user_id: document.user_id
          });
        
        profile = profileData?.[0] || null;
      }

      // Get blocks using SECURITY DEFINER function
      let blocks = [];
      if (document.permissions && 
          (document.permissions.includes('view') || 
           document.permissions.includes('comment') || 
           document.permissions.includes('edit'))) {
        const { data: blocksData, error: blocksError } = await supabase
          .rpc('get_shared_document_blocks', {
            p_share_code: shareCode,
            p_document_id: document.id
          });

        if (blocksError) {
          console.error('Error fetching blocks:', blocksError);
          // Don't throw, just leave blocks empty
          blocks = [];
        } else {
          blocks = blocksData || [];
        }
      }

      // Log the access (non-blocking)
      this.logAccess(shareCode, 'view', document.id).catch(err => 
        console.error('Failed to log access:', err)
      );

      // Apply watermark if required
      if (document.share_settings?.watermark) {
        document.watermark = this.generateWatermark();
      }

      return {
        document: {
          ...document,
          blocks,
          profiles: profile,
          isShared: true,
          permissions: document.permissions || ['view'],
          shareSettings: document.share_settings || {}
        },
        shareId: shareCode // Use share code as identifier
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
   * Verify a password against a hash
   */
  async verifyPassword(password, storedHash) {
    try {
      // Extract salt and hash from stored value
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) return false;
      
      // Hash the provided password with the same salt
      const encoder = new TextEncoder();
      const data = encoder.encode(salt + password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Compare hashes
      return hash === hashHex;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
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
  async logAccess(shareCode, action, documentId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get share ID from share code
      const { data: share } = await supabase
        .from('document_shares')
        .select('id, document_id')
        .eq('share_code', shareCode)
        .single();
      
      if (!share) {
        console.error('Share not found for logging');
        return;
      }

      await supabase.rpc('log_share_access', {
        p_share_id: share.id,
        p_document_id: documentId || share.document_id,
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