# GitHub OAuth Integration Troubleshooting Research Request

## Context
We have a React application (Devlog) using Supabase for authentication. The application is deployed on Vercel at https://devlog.design. Google OAuth is working perfectly, but GitHub OAuth is not appearing as an option on the login page, despite being configured in the code.

## Current Setup

### 1. Frontend Code (Already Implemented)
```javascript
// src/components/Auth.jsx
<Auth
  supabaseClient={supabase}
  providers={['google', 'github']}
  redirectTo={getURL() + 'auth/callback'}
/>
```

### 2. Supabase Project Details
- Project URL: https://zqcjipwiznesnbgbocnu.supabase.co
- Callback URL: https://zqcjipwiznesnbgbocnu.supabase.co/auth/v1/callback

### 3. Application Details
- Production URL: https://devlog.design
- Local development: http://localhost:5173
- Framework: React + Vite
- Auth library: @supabase/auth-ui-react
- Deployment: Vercel

## Problem Description
1. Google OAuth button appears and works correctly
2. GitHub OAuth button does not appear at all on the login page
3. The code includes 'github' in the providers array
4. No console errors are visible

## What We Need to Research

### 1. Current Supabase GitHub OAuth Setup Process (2024/2025)
- Has the setup process changed recently?
- Are there new requirements or steps?
- Any known issues with @supabase/auth-ui-react and GitHub OAuth?

### 2. GitHub OAuth App Configuration
- What are the exact current requirements for GitHub OAuth apps in 2024/2025?
- Are there any new settings or permissions required?
- Any changes to callback URL handling?

### 3. Supabase Dashboard Configuration
- Current exact steps to enable GitHub OAuth in Supabase Dashboard
- Any hidden settings or requirements?
- Common pitfalls or missing configurations

### 4. Debugging Steps
- How to verify if GitHub OAuth is properly enabled in Supabase?
- API endpoints to check OAuth provider status
- Console commands or network requests to debug the issue

### 5. Version Compatibility
- Are there version compatibility issues between:
  - @supabase/auth-ui-react
  - @supabase/supabase-js
  - Supabase backend services
- Any required minimum versions?

### 6. Alternative Solutions
- Is there a manual way to add GitHub OAuth if the UI component isn't working?
- Can we use Supabase's signInWithOAuth() directly?
- Any workarounds for this specific issue?

## Additional Information Needed
1. Latest Supabase documentation on GitHub OAuth setup
2. Any recent changes to GitHub OAuth implementation
3. Known issues or bug reports related to this problem
4. Community solutions or discussions about similar issues

## Expected Outcome
Please provide:
1. Step-by-step troubleshooting guide
2. Exact configuration requirements for both GitHub and Supabase
3. Code snippets if any modifications are needed
4. Verification steps to ensure everything is working

## Search Keywords
- "Supabase GitHub OAuth not showing 2024"
- "supabase auth-ui-react github provider missing"
- "Supabase OAuth providers not appearing"
- "GitHub OAuth Supabase integration issues"
- "@supabase/auth-ui-react providers configuration"