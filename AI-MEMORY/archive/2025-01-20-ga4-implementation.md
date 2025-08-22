# Google Analytics 4 (GA4) Implementation Plan

## 1. Requirements & Research

### Original Request
"I want to launch my web application to users and measure their movements in the app to get data about movements so I can have clear data to make decisions to enhance certain features."

### Research Conducted
- **Research Prompt**: `/docs-research/prompts/google_analytics_integration_research_prompt.md`
- **AI Research Answers**: `/ai_research_answer.md` (2 comprehensive responses)
- **User Tracking Plan**: `/docs-research/analytics/USER_TRACKING_PLAN.md`

### External Documentation
- [GA4 Official Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Google Consent Mode v2](https://support.google.com/analytics/answer/12319447)

## 2. Complete Implementation Plan

### Phase 1: Foundation Setup (Hours 0-2)
- [x] Task 1.1: Create GA4 property in Google Analytics console (G-GHMCVNSC4Q)
- [x] Task 1.2: Configure environment variables and TypeScript types
- [x] Task 1.3: Create core AnalyticsService class
- [x] Task 1.4: Implement gtag script loader
- [x] Task 1.5: Create consent management system
- [x] Task 1.6: Add GDPR-compliant cookie banner component

### Phase 2: React Integration (Hours 2-4)
- [x] Task 2.1: Create useAnalytics hook
- [x] Task 2.2: Implement page view tracking for SPA
- [ ] Task 2.3: Add AnalyticsProvider context (using hooks instead)
- [x] Task 2.4: Integrate with React Router for route changes
- [x] Task 2.5: Handle React 19 Strict Mode double-mounting
- [ ] Task 2.6: Create AnalyticsErrorBoundary component (optional)

### Phase 3: Event Implementation (Hours 4-6)
- [ ] Task 3.1: Authentication event tracking (signup, login, logout)
- [ ] Task 3.2: Document lifecycle tracking (create, open, edit, delete, share)
- [ ] Task 3.3: Block usage tracking (text, code, AI, table, etc.)
- [ ] Task 3.4: Feature usage tracking (search, command palette, etc.)
- [ ] Task 3.5: Performance metrics (Core Web Vitals, save latency)
- [ ] Task 3.6: Error tracking (JavaScript errors, API failures)

### Phase 4: Supabase Integration (Hours 6-7)
- [ ] Task 4.1: Link GA4 with Supabase auth for user ID tracking
- [ ] Task 4.2: Set user properties from Supabase metadata
- [ ] Task 4.3: Track auth state changes
- [ ] Task 4.4: Implement cross-device user tracking

### Phase 5: Testing & Optimization (Hours 7-8)
- [ ] Task 5.1: Set up GA4 DebugView for development
- [ ] Task 5.2: Create debug mode with visual overlay
- [ ] Task 5.3: Implement event batching for performance
- [ ] Task 5.4: Add offline event queuing
- [ ] Task 5.5: Test consent flow and privacy compliance
- [ ] Task 5.6: Verify all events in GA4 interface

## 3. Files to Modify/Create

### New Files
- `/src/services/analytics/AnalyticsService.js` - Core analytics service
- `/src/services/analytics/script-loader.js` - Gtag script loader
- `/src/services/analytics/consent.js` - Consent management
- `/src/services/analytics/event-types.js` - Event type definitions
- `/src/hooks/useAnalytics.js` - React hook for analytics
- `/src/hooks/useDocumentAnalytics.js` - Document-specific tracking
- `/src/hooks/usePerformanceTracking.js` - Performance monitoring
- `/src/components/CookieConsentBanner.jsx` - GDPR consent UI
- `/src/components/AnalyticsErrorBoundary.jsx` - Error tracking boundary
- `/src/components/AnalyticsProvider.jsx` - Context provider
- `/src/utils/analytics-debug.js` - Debug utilities

### Modified Files
- `/src/main.jsx` - Add AnalyticsProvider wrapper
- `/src/App.jsx` - Initialize analytics on mount
- `/src/contexts/AuthContextOptimized.jsx` - Add auth tracking
- `/src/components/ExpandedViewEnhanced.jsx` - Track document events
- `/src/components/blocks/TextBlock.jsx` - Track block usage
- `/src/pages/Dashboard.jsx` - Track dashboard interactions
- `/.env.example` - Add GA4 environment variables
- `/index.html` - Add gtag script tags (optional)

## 4. Dependencies & Configuration

### NPM Packages
```json
{
  "web-vitals": "^3.5.0"  // For Core Web Vitals tracking
}
```

### Environment Variables
```bash
# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_API_SECRET=your_api_secret_here  # Optional for server-side
VITE_DEBUG_ANALYTICS=false  # Enable debug mode
VITE_GA4_TEST_MODE=false    # Test mode for development
```

### External Services
- **GA4 Property**: Create at analytics.google.com
- **Data Stream**: Web stream for devlog.app
- **Enhanced Measurement**: Configure for SPA tracking
- **Custom Dimensions**: Set up in GA4 interface
- **User Properties**: Configure plan_type, signup_date, etc.

## 5. Testing Checklist

### Development Testing
- [ ] GA4 DebugView shows events
- [ ] Console logs show debug output
- [ ] No errors in browser console
- [ ] React Strict Mode compatible
- [ ] Consent banner appears and works

### Integration Testing
- [ ] Page views track on route changes
- [ ] User authentication events fire
- [ ] Document events track correctly
- [ ] Error boundary captures errors
- [ ] Performance metrics collected

### Production Verification
- [ ] Events appear in GA4 Realtime
- [ ] User properties set correctly
- [ ] No performance degradation
- [ ] GDPR compliance verified
- [ ] Cross-device tracking works

## 6. Progress Tracking

- **Started**: 2025-08-21
- **Current Phase**: Phase 2 Complete - Ready for Testing
- **Phase 1**: ✅ Complete
- **Phase 2**: ✅ Complete (Core tracking functional)
- **Phase 3**: ⬜ Not started (Optional - detailed events)
- **Phase 4**: ⬜ Not started (Optional - enhanced user tracking)
- **Phase 5**: 🟨 In progress (Testing)
- **Blockers**: None currently

## Implementation Notes

- **Measurement ID**: G-GHMCVNSC4Q (devlog.design)
- **Core tracking implemented**: Users will appear in GA4 dashboard
- **GDPR compliant**: Cookie consent banner for EU users
- **Performance optimized**: Async loading, no page blocking

## 7. Key Implementation Decisions

### Architecture Choices
- **Native gtag.js** over third-party libraries for reliability
- **Service class pattern** for centralized analytics logic
- **React hooks** for component integration
- **Consent Mode v2** for privacy compliance

### Privacy Approach
- **Default denied consent** for EU users
- **No PII in events** (use Supabase UUID)
- **URL masking** for document IDs
- **14-month data retention** (maximum allowed)

### Performance Strategy
- **Async script loading** after page load
- **Event batching** to reduce network calls
- **Sampling for high-volume events** (scroll, mouse)
- **Lazy initialization** after critical content

## 8. Success Metrics

### Technical Success
- All events tracking with <1% error rate
- Page load impact <50ms
- 100% GDPR compliance
- Zero console errors

### Business Success
- User journey visibility achieved
- Feature usage data available
- Conversion funnel trackable
- Performance metrics monitored

## 9. Rollback Plan

If issues arise:
1. Set `VITE_GA4_MEASUREMENT_ID` to empty string
2. Analytics service will operate in no-op mode
3. No tracking calls will be made
4. App continues functioning normally

## 10. Future Enhancements

- [ ] BigQuery export for advanced analysis
- [ ] Custom reports and dashboards
- [ ] A/B testing integration
- [ ] Predictive metrics using ML
- [ ] Real-time alerts for anomalies

## Notes

- Follow Rule 16 (Collaborative Loop) for debugging
- Update this plan after each completed phase
- Document any deviations with reasoning
- Keep research documents for reference