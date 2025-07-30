/**
 * Sophisticated Document Sharing Service
 * 
 * Enhanced sharing functionality with multiple modes:
 * - Public: Open access with optional password/auth
 * - Team: Domain or team-based access control
 * - Private: Specific user invitation system
 */

import { supabase } from '../lib/supabase';
import { logError } from '../utils/monitoring';

export class SophisticatedShareService {
  /**
   * Create a sophisticated share with mode-specific options
   * @param {string} documentId - The document to share
   * @param {Object} options - Share configuration
   * @returns {Promise<Object>} Share details
   */
  async createShare(documentId, options = {}) {
    try {
      const {
        mode = 'public',
        permissions = ['view'],
        password = null,
        requireAuth = false,
        expiresIn = null,
        maxViews = null,
        settings = {},
        
        // Team-specific options
        teamIds = [],
        teamDomains = [],
        
        // Private-specific options
        recipientEmails = [],
        personalMessages = {}
      } = options;

      // Validate mode
      if (!['public', 'team', 'private'].includes(mode)) {
        throw new Error('Invalid share mode. Must be: public, team, or private');
      }

      // Validate permissions
      const validPermissions = ['view', 'comment', 'edit', 'download'];
      if (!permissions.every(p => validPermissions.includes(p))) {
        throw new Error('Invalid permissions');
      }

      // Calculate expiration interval
      let expiresInterval = null;
      if (expiresIn) {
        expiresInterval = this.parseExpirationString(expiresIn);
      }

      // Create share using RPC function
      const { data, error } = await supabase.rpc('create_document_share', {
        p_document_id: documentId,
        p_share_mode: mode,
        p_permissions: permissions,
        p_password: password,
        p_require_auth: requireAuth,
        p_expires_in: expiresInterval,
        p_max_views: maxViews,
        p_settings: settings,
        p_team_ids: mode === 'team' ? teamIds : null,
        p_team_domains: mode === 'team' ? teamDomains : null,
        p_recipient_emails: mode === 'private' ? recipientEmails : null
      });

      if (error) throw error;

      const shareData = data[0];

      // Handle personal messages for private shares
      if (mode === 'private' && Object.keys(personalMessages).length > 0) {
        await this.addPersonalMessages(shareData.share_id, personalMessages);
      }

      // Send notifications if needed
      if (mode === 'private' && recipientEmails.length > 0) {
        // Queue email notifications (would integrate with email service)
        this.queueShareNotifications(shareData.share_id, recipientEmails, personalMessages);
      }

      return {
        shareId: shareData.share_id,
        shareCode: shareData.share_code,
        shareUrl: shareData.share_url,
        mode,
        permissions,
        expiresAt: expiresIn ? new Date(Date.now() + this.parseExpirationMs(expiresIn)) : null
      };
    } catch (error) {
      logError(error, { context: 'createShare', documentId });
      throw error;
    }
  }

  /**
   * Access a shared document with sophisticated validation
   * @param {string} shareCode - The share code
   * @param {Object} accessInfo - Access information
   * @returns {Promise<Object>} Document data
   */
  async accessSharedDocument(shareCode, accessInfo = {}) {
    try {
      const { password = null, userEmail = null } = accessInfo;

      // Use the SECURITY DEFINER function to access document
      const { data, error } = await supabase.rpc('access_shared_document', {
        p_share_code: shareCode,
        p_password: password,
        p_user_email: userEmail
      });

      if (error) {
        console.error('Access error:', error);
        
        // Parse specific error types
        if (error.message.includes('Password required')) {
          return { requiresPassword: true, error: 'Password required' };
        } else if (error.message.includes('Invalid password')) {
          return { error: 'Invalid password' };
        } else if (error.message.includes('expired')) {
          return { error: 'Share link has expired' };
        } else if (error.message.includes('view limit')) {
          return { error: 'Share link has reached its view limit' };
        } else if (error.message.includes('Authentication required')) {
          return { requiresAuth: true, error: 'Authentication required' };
        } else if (error.message.includes('Not a member')) {
          return { error: 'Access denied: Not a member of the allowed team' };
        } else if (error.message.includes('not authorized')) {
          return { error: 'Access denied: You are not authorized to view this document' };
        } else {
          return { error: error.message || 'Access denied' };
        }
      }

      if (!data || data.length === 0) {
        return { error: 'Document not found' };
      }

      const documentData = data[0];

      // Get blocks if permissions allow
      let blocks = [];
      if (documentData.permissions.some(p => ['view', 'comment', 'edit'].includes(p))) {
        const { data: blocksData } = await supabase.rpc('get_shared_document_blocks', {
          p_share_code: shareCode,
          p_document_id: documentData.document_id
        });
        blocks = blocksData || [];
      }

      // Get user profile
      let profile = null;
      if (documentData.user_id) {
        const { data: profileData } = await supabase.rpc('get_shared_document_profile', {
          p_user_id: documentData.user_id
        });
        profile = profileData?.[0] || null;
      }

      // Log access (non-blocking)
      this.logAccess(shareCode, 'view', documentData.document_id).catch(err =>
        console.error('Failed to log access:', err)
      );

      return {
        success: true,
        document: {
          id: documentData.document_id,
          title: documentData.title,
          content: documentData.content,
          tags: documentData.tags,
          created_at: documentData.created_at,
          updated_at: documentData.updated_at,
          user_id: documentData.user_id,
          blocks,
          profiles: profile,
          permissions: documentData.permissions,
          shareSettings: documentData.share_settings,
          shareMode: documentData.share_mode,
          isShared: true
        }
      };
    } catch (error) {
      logError(error, { context: 'accessSharedDocument', shareCode });
      return { error: 'Failed to access document' };
    }
  }

  /**
   * Get all shares for a document with enhanced details
   * @param {string} documentId - The document ID
   */
  async getDocumentShares(documentId) {
    try {
      const { data, error } = await supabase
        .from('document_shares')
        .select(`
          *,
          team_shares(
            team_id,
            team_name,
            team_domain
          ),
          share_recipients(
            email,
            user_id,
            accepted_at,
            personal_permissions
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
        viewsRemaining: share.max_views ? share.max_views - share.view_count : null,
        
        // Mode-specific data
        teams: share.team_shares || [],
        recipients: share.share_recipients || [],
        
        // Stats
        totalRecipients: share.share_mode === 'private' ? share.share_recipients?.length || 0 : null,
        acceptedRecipients: share.share_mode === 'private' 
          ? share.share_recipients?.filter(r => r.accepted_at).length || 0 
          : null
      }));
    } catch (error) {
      logError(error, { context: 'getDocumentShares', documentId });
      throw error;
    }
  }

  /**
   * Update share settings
   * @param {string} shareId - The share to update
   * @param {Object} updates - Updates to apply
   */
  async updateShare(shareId, updates) {
    try {
      const { 
        permissions, 
        settings, 
        expiresAt, 
        maxViews,
        password,
        requireAuth 
      } = updates;

      const updateData = {};
      if (permissions) updateData.permissions = permissions;
      if (settings) updateData.settings = settings;
      if (expiresAt !== undefined) updateData.expires_at = expiresAt;
      if (maxViews !== undefined) updateData.max_views = maxViews;
      if (password !== undefined) updateData.password_hash = password;
      if (requireAuth !== undefined) updateData.require_auth = requireAuth;

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
   * Add or update team access
   * @param {string} shareId - The share ID
   * @param {Array} teams - Teams to add/update
   */
  async updateTeamAccess(shareId, teams) {
    try {
      // First, remove existing teams
      await supabase
        .from('team_shares')
        .delete()
        .eq('share_id', shareId);

      // Add new teams
      if (teams.length > 0) {
        const teamRecords = teams.map(team => ({
          share_id: shareId,
          team_id: team.id || null,
          team_name: team.name || null,
          team_domain: team.domain || null
        }));

        const { error } = await supabase
          .from('team_shares')
          .insert(teamRecords);

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      logError(error, { context: 'updateTeamAccess', shareId });
      throw error;
    }
  }

  /**
   * Add or update recipient access
   * @param {string} shareId - The share ID
   * @param {Array} recipients - Recipients to add/update
   */
  async updateRecipientAccess(shareId, recipients) {
    try {
      // Get existing recipients
      const { data: existing } = await supabase
        .from('share_recipients')
        .select('email')
        .eq('share_id', shareId);

      const existingEmails = new Set(existing?.map(r => r.email) || []);
      
      // Add new recipients
      const newRecipients = recipients.filter(r => !existingEmails.has(r.email));
      if (newRecipients.length > 0) {
        const recipientRecords = newRecipients.map(recipient => ({
          share_id: shareId,
          email: recipient.email.toLowerCase(),
          personal_permissions: recipient.permissions || null,
          personal_message: recipient.message || null
        }));

        const { error } = await supabase
          .from('share_recipients')
          .insert(recipientRecords);

        if (error) throw error;

        // Queue notifications for new recipients
        this.queueShareNotifications(shareId, newRecipients.map(r => r.email));
      }

      // Update existing recipients if needed
      for (const recipient of recipients) {
        if (existingEmails.has(recipient.email) && recipient.permissions) {
          await supabase
            .from('share_recipients')
            .update({ personal_permissions: recipient.permissions })
            .eq('share_id', shareId)
            .eq('email', recipient.email);
        }
      }

      return { success: true, newRecipientsCount: newRecipients.length };
    } catch (error) {
      logError(error, { context: 'updateRecipientAccess', shareId });
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
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', shareId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      logError(error, { context: 'revokeShare', shareId });
      throw error;
    }
  }

  /**
   * Get share analytics with mode-specific insights
   * @param {string} shareId - The share to analyze
   */
  async getShareAnalytics(shareId) {
    try {
      // Get share details first
      const { data: share } = await supabase
        .from('document_shares')
        .select('*, team_shares(*), share_recipients(*)')
        .eq('id', shareId)
        .single();

      if (!share) throw new Error('Share not found');

      // Get access logs
      const { data: logs, error } = await supabase
        .from('share_access_logs')
        .select('*')
        .eq('share_id', shareId)
        .order('accessed_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Calculate analytics
      const analytics = {
        shareMode: share.share_mode,
        totalViews: share.view_count,
        uniqueViewers: new Set(),
        actions: {},
        timeline: [],
        
        // Mode-specific analytics
        teamAccess: share.share_mode === 'team' ? {
          totalTeams: share.team_shares?.length || 0,
          domains: share.team_shares?.map(t => t.team_domain).filter(Boolean) || []
        } : null,
        
        privateAccess: share.share_mode === 'private' ? {
          totalRecipients: share.share_recipients?.length || 0,
          acceptedInvites: share.share_recipients?.filter(r => r.accepted_at).length || 0,
          pendingInvites: share.share_recipients?.filter(r => !r.accepted_at).length || 0
        } : null,
        
        // Performance metrics
        averageLoadTime: null,
        peakAccessTime: null,
        geographicDistribution: new Map()
      };

      // Process logs
      const hourlyAccess = new Map();
      
      logs.forEach(log => {
        // Count unique viewers
        if (log.accessed_by) {
          analytics.uniqueViewers.add(`user_${log.accessed_by}`);
        } else if (log.anonymous_id) {
          analytics.uniqueViewers.add(`anon_${log.anonymous_id}`);
        }

        // Count actions
        analytics.actions[log.action] = (analytics.actions[log.action] || 0) + 1;

        // Build timeline
        analytics.timeline.push({
          time: log.accessed_at,
          action: log.action,
          user: log.accessed_by || 'Anonymous',
          metadata: log.metadata
        });

        // Track hourly access patterns
        const hour = new Date(log.accessed_at).getHours();
        hourlyAccess.set(hour, (hourlyAccess.get(hour) || 0) + 1);
      });

      // Find peak access time
      let maxAccess = 0;
      let peakHour = 0;
      hourlyAccess.forEach((count, hour) => {
        if (count > maxAccess) {
          maxAccess = count;
          peakHour = hour;
        }
      });
      analytics.peakAccessTime = `${peakHour}:00 - ${peakHour + 1}:00`;

      return {
        ...analytics,
        uniqueViewers: analytics.uniqueViewers.size,
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

      // Get shares where user is a recipient
      const { data, error } = await supabase
        .from('share_recipients')
        .select(`
          share_id,
          personal_permissions,
          accepted_at,
          document_shares!inner(
            id,
            share_code,
            share_mode,
            permissions,
            expires_at,
            documents!inner(
              id,
              title,
              tags,
              updated_at,
              user_id,
              profiles!inner(
                username,
                display_name
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('document_shares.is_active', true)
        .order('document_shares.created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      return data.map(item => ({
        shareId: item.document_shares.id,
        shareCode: item.document_shares.share_code,
        shareUrl: `${window.location.origin}/shared/${item.document_shares.share_code}`,
        shareMode: item.document_shares.share_mode,
        permissions: item.personal_permissions || item.document_shares.permissions,
        acceptedAt: item.accepted_at,
        expiresAt: item.document_shares.expires_at,
        document: {
          id: item.document_shares.documents.id,
          title: item.document_shares.documents.title,
          tags: item.document_shares.documents.tags,
          updatedAt: item.document_shares.documents.updated_at,
          owner: {
            id: item.document_shares.documents.user_id,
            username: item.document_shares.documents.profiles.username,
            displayName: item.document_shares.documents.profiles.display_name
          }
        }
      }));
    } catch (error) {
      logError(error, { context: 'getSharedWithMe' });
      throw error;
    }
  }

  // Helper methods

  /**
   * Parse expiration string to PostgreSQL interval
   * @param {string} duration - Duration like '7d', '1h', '30m'
   */
  parseExpirationString(duration) {
    const match = duration.match(/^(\d+)([dhm])$/);
    if (!match) throw new Error('Invalid duration format');
    
    const [, amount, unit] = match;
    const value = parseInt(amount);
    
    switch (unit) {
      case 'd': return `${value} days`;
      case 'h': return `${value} hours`;
      case 'm': return `${value} minutes`;
      default: throw new Error('Invalid duration unit');
    }
  }

  /**
   * Parse expiration string to milliseconds
   * @param {string} duration - Duration like '7d', '1h', '30m'
   */
  parseExpirationMs(duration) {
    const match = duration.match(/^(\d+)([dhm])$/);
    if (!match) return 0;
    
    const [, amount, unit] = match;
    const value = parseInt(amount);
    
    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return 0;
    }
  }

  /**
   * Add personal messages to recipients
   * @param {string} shareId - The share ID
   * @param {Object} messages - Email to message mapping
   */
  async addPersonalMessages(shareId, messages) {
    try {
      for (const [email, message] of Object.entries(messages)) {
        await supabase
          .from('share_recipients')
          .update({ personal_message: message })
          .eq('share_id', shareId)
          .eq('email', email.toLowerCase());
      }
    } catch (error) {
      console.error('Failed to add personal messages:', error);
    }
  }

  /**
   * Queue share notifications (placeholder for email service)
   * @param {string} shareId - The share ID
   * @param {Array} emails - Recipients to notify
   * @param {Object} messages - Personal messages
   */
  async queueShareNotifications(shareId, emails, messages = {}) {
    // In production, this would integrate with an email service
    console.log('Queueing notifications for:', emails);
    
    // Log the notification attempt
    try {
      await supabase.rpc('log_share_access', {
        p_share_id: shareId,
        p_document_id: null,
        p_action: 'notification_queued',
        p_metadata: { emails, hasPersonalMessages: Object.keys(messages).length > 0 }
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Log share access
   * @param {string} shareCode - The share code
   * @param {string} action - The action performed
   * @param {string} documentId - The document ID
   */
  async logAccess(shareCode, action, documentId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get share ID from share code
      const { data: share } = await supabase
        .from('document_shares')
        .select('id')
        .eq('share_code', shareCode)
        .single();
      
      if (!share) return;

      await supabase.rpc('log_share_access', {
        p_share_id: share.id,
        p_document_id: documentId,
        p_action: action,
        p_user_id: user?.id || null,
        p_anonymous_id: !user ? this.getAnonymousId() : null,
        p_user_agent: navigator.userAgent,
        p_referrer: document.referrer || null
      });
    } catch (error) {
      console.error('Failed to log access:', error);
    }
  }

  /**
   * Get or create anonymous ID
   */
  getAnonymousId() {
    let anonId = localStorage.getItem('devlog_anon_id');
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem('devlog_anon_id', anonId);
    }
    return anonId;
  }
}

// Export singleton instance
export const sophisticatedShareService = new SophisticatedShareService();