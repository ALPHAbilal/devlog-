# Devlog User Tracking Plan

## Key User Actions & Metrics to Track

### 1. User Journey Funnel
Track the complete user journey from visitor to active user:

```
Landing Page Visit → Sign Up Started → Account Created → First Document Created → Active User (3+ docs)
```

### 2. Critical User Actions

#### Authentication & Onboarding
- **signup_started** - User clicks sign up
- **signup_completed** - Account successfully created
- **login_success** - User logs in
- **oauth_provider_selected** - Which OAuth provider (Google/GitHub)
- **onboarding_completed** - User completes initial setup
- **logout** - User logs out

#### Document Lifecycle
- **document_created** - New document created
  - With folder path
  - With initial block type
- **document_opened** - Document accessed
  - Time since last access
  - Open method (dashboard/link/search)
- **document_edited** - Document modified
  - Edit duration
  - Blocks added/removed
  - Character count change
- **document_saved** - Auto-save or manual save
  - Save latency
  - Storage layer used
- **document_deleted** - Document removed
- **document_restored** - Document undeleted

#### Block Usage (Feature Adoption)
- **block_created** - Track which block types are used
  - Block type (text/code/AI/table/heading/todo/image)
  - Position in document
- **ai_conversation_saved** - AI block created
- **code_block_language** - Programming language used
- **table_created** - Table block usage
- **file_tree_created** - File tree visualization

#### Collaboration & Sharing
- **document_shared** - Share link created
  - Share permissions (view/edit)
  - Expiration setting
- **shared_document_accessed** - Someone views shared doc
  - Viewer type (anonymous/authenticated)
- **collaboration_started** - Multiple users editing

#### Search & Discovery
- **search_performed** - User searches
  - Query length
  - Results count
  - Result clicked
- **command_palette_opened** - Cmd+K usage
- **document_linked** - Cross-document linking

#### Performance & Errors
- **page_load_time** - Core Web Vitals
- **document_load_time** - Time to load document
- **save_latency** - Time to save changes
- **error_occurred** - JavaScript/API errors
- **offline_mode_activated** - Offline usage

### 3. User Properties (Dimensions)

#### User Characteristics
- User ID (Supabase auth)
- Account age
- Plan type (free/pro/team)
- Total documents
- Total blocks
- Storage used
- Device type (mobile/desktop)
- Browser
- OS
- Theme preference (dark/light)

#### Engagement Metrics
- Last active date
- Session count
- Average session duration
- Documents per session
- Power user score (based on feature usage)

### 4. Business Metrics

#### Activation Metrics
- Time to first document
- Documents created in first session
- Features used in first week
- Activation rate (users who create 3+ docs)

#### Retention Metrics
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)
- DAU/MAU ratio (stickiness)
- Cohort retention curves

#### Feature Adoption
- % users using each block type
- % users using sharing
- % users using command palette
- % users using AI blocks
- Mobile vs desktop usage

#### Performance Impact
- Correlation between load time and retention
- Save latency impact on engagement
- Error rate impact on churn

### 5. Conversion Events

#### Free to Paid
- **upgrade_prompt_shown** - Upgrade UI displayed
- **upgrade_clicked** - User clicks upgrade
- **payment_started** - Stripe checkout opened
- **payment_completed** - Subscription created
- **payment_failed** - Payment error

#### Feature Limits
- **limit_reached** - User hits free tier limit
  - Limit type (documents/storage/features)
- **limit_warning_shown** - Approaching limit

### 6. Advanced Tracking

#### User Behavior Patterns
- Document creation patterns (time of day, frequency)
- Edit session patterns (duration, intensity)
- Feature discovery path
- Rage clicks (frustration indicators)
- Dead clicks (non-interactive elements)

#### Content Analytics
- Average document length
- Most used block types
- Tag usage patterns
- Link network density

### 7. Privacy-Compliant Tracking

#### Anonymous Metrics
- Page views without user ID
- General feature usage
- Performance metrics
- Error rates

#### Consent-Based
- Detailed user tracking
- Cross-session identification
- Behavioral analytics
- Conversion tracking

## Implementation Priority

### Phase 1 (MVP Analytics)
1. Basic page views
2. Sign up/login events
3. Document created/opened
4. Error tracking
5. Core Web Vitals

### Phase 2 (User Understanding)
1. Block type usage
2. Feature adoption
3. User properties
4. Retention metrics
5. Search behavior

### Phase 3 (Optimization)
1. Detailed performance metrics
2. User behavior patterns
3. Conversion funnel optimization
4. A/B testing events
5. Predictive metrics

## Success Metrics

### North Star Metric
**Weekly Active Documents** - Number of documents edited per week

### Supporting Metrics
- User activation rate (3+ documents)
- Average session duration
- Feature adoption rate
- Document collaboration rate
- User retention (D1, D7, D30)

## Data Usage

### Product Decisions
- Feature prioritization based on usage
- UI/UX improvements from behavior patterns
- Performance optimization targets
- Onboarding flow optimization

### Business Decisions
- Pricing model validation
- Feature limits adjustment
- Marketing channel effectiveness
- Customer segment identification

## Compliance & Ethics

### Data Minimization
- Only track necessary metrics
- Aggregate when possible
- Delete old data per retention policy

### User Rights
- Opt-out capability
- Data export on request
- Deletion on request
- Transparent privacy policy

### Security
- No PII in event parameters
- Encrypted transmission
- Secure storage
- Access controls