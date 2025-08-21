# Google Analytics 4 (GA4) Integration Research Prompt for Devlog

## Context
We are integrating Google Analytics 4 into Devlog, a React-based developer knowledge management system. The application is built with:
- React 19 with Vite
- Supabase for authentication and database
- Multi-page SPA with client-side routing
- Key user flows: Authentication, Document Creation/Editing, Sharing, Dashboard

## Research Requirements

### 1. GA4 Setup & Configuration (2025 Best Practices)
Please provide the most current (2025) implementation guide for:
- Creating and configuring a GA4 property
- Getting the Measurement ID
- Setting up data streams for web applications
- Configuring enhanced measurement settings
- GDPR/Privacy compliance requirements

### 2. React + Vite Integration Pattern
We need the optimal implementation approach for:
```javascript
// Current stack details:
- React 19 with Vite (not Next.js)
- Client-side routing (React Router or similar)
- Environment variables via import.meta.env
- Production deployment on Vercel
```

Please provide:
- The best way to integrate gtag.js with Vite
- Proper initialization in React 19 (considering Strict Mode)
- TypeScript types if available
- How to handle the async script loading

### 3. User Journey Tracking Implementation
We need to track these specific user actions and metrics:

#### Authentication Events:
- Sign up initiated
- Sign up completed
- Login successful
- Logout
- OAuth provider used (Google/GitHub)

#### Document Management Events:
- Document created
- Document opened
- Document edited (with edit duration)
- Document deleted
- Document shared
- Block type usage (text, code, AI conversation, etc.)

#### Feature Usage Events:
- Search performed
- Command palette opened
- Keyboard shortcuts used
- Mobile vs Desktop usage
- Theme preference (dark/light)

#### Performance Metrics:
- Page load times
- Time to interactive
- Document save latency
- API response times

#### Business Metrics:
- User retention (daily/weekly/monthly active)
- Feature adoption rates
- Document collaboration metrics
- Conversion funnel (visitor → signup → active user)

### 4. Custom Events & Parameters
For each event type above, please specify:
- Event name convention (following GA4 best practices)
- Required and optional parameters
- How to structure nested data
- Parameter value limits and restrictions

Example structure needed:
```javascript
gtag('event', 'document_created', {
  // What parameters should go here?
  // How to handle custom dimensions?
});
```

### 5. User Properties & Identification
How to properly implement:
- User ID tracking with Supabase auth
- User properties (plan type, signup date, etc.)
- Session tracking across tabs
- Anonymous to authenticated user linking

### 6. Page View Tracking in SPA
Specific implementation for:
- Tracking route changes in React SPA
- Virtual pageviews vs screen_view events
- Page titles and paths for analytics
- Handling dynamic routes (e.g., /document/:id)

### 7. Error & Exception Tracking
Best practices for:
- JavaScript error tracking
- API error tracking
- Custom error events
- Error sampling rates

### 8. E-commerce/Conversion Tracking
For our SaaS model:
- Tracking free trial starts
- Subscription upgrades
- Feature usage limits
- Upgrade prompts shown/clicked

### 9. Debug & Testing Setup
- How to use GA4 DebugView effectively
- Testing events in development
- Validating data before production
- Common implementation mistakes to avoid

### 10. Advanced Implementation Patterns

#### A. Performance Optimization:
- Lazy loading analytics
- Minimizing impact on Core Web Vitals
- Batching events
- Offline event queuing

#### B. Privacy & Consent:
- GDPR compliance implementation
- Cookie consent management
- Data retention settings
- IP anonymization

#### C. Custom Dimensions & Metrics:
- Setting up custom dimensions for our use case
- User engagement scoring
- Content performance metrics

### 11. Dashboard & Reporting Setup
- Essential reports for SaaS applications
- Custom dashboards for different stakeholders
- Key performance indicators (KPIs) to track
- Automated alerts and insights

### 12. Integration Code Structure
Please provide a production-ready implementation with:
- Modular analytics service/hook
- Error handling
- Type safety
- Event validation
- Development/production environment handling

Example structure:
```javascript
// hooks/useAnalytics.js
export function useAnalytics() {
  // Implementation details needed
}

// services/analytics.js
class AnalyticsService {
  // Methods needed
}
```

### 13. Migration from Existing Analytics
If we have existing analytics or tracking:
- How to run GA4 in parallel
- Data migration considerations
- Historical data handling

### 14. Cost & Limits
- GA4 free tier limits
- When to consider GA360
- Data sampling thresholds
- API quotas and rate limits

## Expected Deliverables

Please provide:
1. **Step-by-step implementation guide** with actual code snippets
2. **Configuration checklist** for GA4 property setup
3. **Event tracking plan** with specific event names and parameters
4. **React component/hook examples** that we can directly use
5. **Testing methodology** to verify implementation
6. **Common pitfalls** and how to avoid them
7. **Performance impact analysis** and optimization strategies
8. **Privacy compliance checklist** for GDPR/CCPA

## Additional Context About Our App

### Current User Flow:
1. User lands on marketing page
2. Signs up/logs in via Supabase Auth
3. Creates documents with various block types
4. Shares documents with others
5. Manages documents in dashboard

### Technical Constraints:
- Must work with React Strict Mode
- Should not block initial page load
- Must handle errors gracefully
- Should work with our CSP headers
- Need to track both anonymous and authenticated users

### Business Goals:
- Understand user activation (what makes users stick)
- Identify drop-off points in user journey
- Measure feature adoption and usage
- Track performance impact on user experience
- Support data-driven product decisions

Please ensure all code examples and configurations reflect the latest GA4 best practices as of 2025, including any recent API changes or new features.