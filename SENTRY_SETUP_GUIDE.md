# Sentry Error Monitoring Setup Guide for Devlog

## Overview
Sentry has been integrated into Devlog to provide production-grade error monitoring, performance tracking, and session replay capabilities. This integration is fully compatible with React 19 and uses the latest Sentry SDK features.

## What's Been Implemented

### 1. Core Integration
- **Sentry SDK** added to package.json (`@sentry/react@^9.40.0` and `@sentry/vite-plugin@^3.5.0`)
- **Early initialization** in `src/instrument.js` for capturing errors as soon as possible
- **React 19 error hooks** integrated in `main.jsx` (onUncaughtError, onCaughtError, onRecoverableError)
- **Source map uploads** configured in `vite.config.js` for readable stack traces

### 2. Enhanced Error Boundary
- Updated `ErrorBoundary.jsx` to capture errors with Sentry
- Displays error IDs to users for support reference
- Includes Devlog-specific context (offline mode, recovery attempts, feature area)

### 3. React Router Integration
- Route tracking for better error context
- Performance monitoring for navigation
- Automatic breadcrumb generation

### 4. Privacy & Security
- PII (email, IP) automatically removed
- Session replay configured with privacy masks
- Browser extension errors filtered out
- Offline errors handled gracefully

## Setup Instructions

### 1. Create a Sentry Account
1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project with type "React"
3. Note your DSN from the project settings

### 2. Configure Environment Variables in Vercel
Add these environment variables to your Vercel project:

```bash
# Client-side (available in browser)
VITE_SENTRY_DSN=https://your-key@o0.ingest.sentry.io/your-project

# Build-time (for source maps)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=devlog
SENTRY_AUTH_TOKEN=sntrys_your-auth-token
```

### 3. Create Auth Token
1. Go to [Sentry Account Settings → Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Create a new token with scopes:
   - `project:releases` (create releases)
   - `org:read` (read org data)

### 4. Optional: Vercel Marketplace Integration
Instead of manual setup, you can use the [Vercel Sentry Integration](https://vercel.com/integrations/sentry):
1. Go to Vercel Dashboard → Integrations
2. Search for Sentry
3. Click "Add Integration"
4. This automatically configures environment variables and SSO

## Features Enabled

### Error Tracking
- Automatic error capture with full stack traces
- React component stack traces
- User context and breadcrumbs
- Smart error grouping

### Performance Monitoring
- Page load performance (Web Vitals)
- API call tracking (Supabase operations)
- Component render performance
- Route change tracking

### Session Replay
- 10% of normal sessions recorded
- 100% of sessions with errors recorded
- Privacy-focused with text masking
- Network request tracking

### Alerts & Notifications
Configure alerts in Sentry dashboard:
- Critical: >100 users affected in 5 minutes
- High: Performance degradation >20%
- Medium: New error types in production

## Cost Optimization
The configuration uses conservative sampling rates:
- 10% transaction sampling in production
- 10% session replay sampling
- 100% error session replay
- Automatic spike protection enabled

## Monitoring Dashboard
After deployment, you can:
1. View errors at `sentry.io/organizations/[org]/issues/`
2. Check performance at `sentry.io/organizations/[org]/performance/`
3. Watch session replays at `sentry.io/organizations/[org]/replays/`

## Testing
To test the integration:
1. Deploy to Vercel (preview or production)
2. Trigger an error (e.g., click a broken feature)
3. Check Sentry dashboard for the error report
4. Verify source maps are working (readable stack traces)

## Troubleshooting
- **No errors appearing**: Check VITE_SENTRY_DSN is set correctly
- **No source maps**: Verify SENTRY_AUTH_TOKEN has correct permissions
- **High costs**: Reduce sampling rates in `src/instrument.js`

## Next Steps
1. Set up team notifications (Slack, email)
2. Configure issue ownership rules
3. Create custom alerts for critical paths
4. Review and tune error filters monthly