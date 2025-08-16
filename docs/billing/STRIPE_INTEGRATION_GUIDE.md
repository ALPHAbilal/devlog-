# Stripe Integration Guide for Devlog Platform

> **Last Updated**: January 2025  
> **Status**: Pre-Stripe (Manual Billing Active)  
> **Author**: Devlog Team

## Table of Contents
1. [Current Billing System Overview](#current-billing-system-overview)
2. [Database Architecture](#database-architecture)
3. [Trial System Implementation](#trial-system-implementation)
4. [Current User Statistics](#current-user-statistics)
5. [Future Stripe Integration Plan](#future-stripe-integration-plan)
6. [Migration Steps](#migration-steps)
7. [Testing Strategy](#testing-strategy)
8. [Important Considerations](#important-considerations)

---

## Current Billing System Overview

### System Status
- **Billing Model**: Manual email-based activation
- **Trial Duration**: 14 days automatic free trial
- **Pricing Tiers**: 
  - Personal: $9/month ($7/month annual)
  - Professional: $19/month ($15/month annual)
- **Current Phase**: Early access with manual processing

### Why Manual Billing?
- Founder location: Morocco (not in Stripe-supported countries)
- Planning to use Stripe Atlas for incorporation
- Allows immediate launch without payment delays
- Provides flexibility during early access phase

---

## Database Architecture

### Existing Tables

#### 1. **subscriptions** Table
```sql
- id (text) - Primary key, will store Stripe subscription ID
- user_id (uuid) - References auth.users
- status (text) - 'trialing', 'active', 'canceled', etc.
- price_id (text) - Stripe price ID or 'trial_personal'
- tier (text) - 'personal' or 'professional'
- current_period_end (timestamptz)
- trial_end (timestamptz) - Nullable
- cancel_at_period_end (boolean) - Default false
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 2. **customers** Table
```sql
- user_id (uuid) - Primary key, references auth.users
- stripe_customer_id (text) - Will store Stripe customer ID
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 3. **profiles** Table
```sql
- id (uuid) - Primary key
- subscription_tier (text) - 'free', 'personal', 'professional'
- subscription_status (text) - 'none', 'trialing', 'active'
- (other user profile fields...)
```

### Database Advantages
- ✅ Stripe-ready field names and types
- ✅ Proper separation of concerns
- ✅ No migration needed for Stripe integration
- ✅ RLS policies already configured

---

## Trial System Implementation

### Automatic Trial Creation
When a new user signs up:
1. `handle_new_user()` function triggers
2. Creates profile with `subscription_status = 'trialing'`
3. Creates subscription record with 14-day trial
4. Sets `trial_end` to 14 days from signup

### Trial Status Checking
```sql
Function: check_trial_status(user_id)
Returns:
- is_active (boolean)
- is_trial (boolean)
- days_remaining (integer)
- hours_remaining (integer)
- trial_end (timestamp)
- status (text)
- tier (text)
```

### Frontend Components
1. **TrialBanner.jsx** - Shows countdown with urgency colors
2. **AuthContext.jsx** - Checks trial status on login
3. **Dashboard.jsx** - Auto-redirects expired trials to upgrade
4. **Upgrade.jsx** - Manual activation via email

---

## Current User Statistics

As of January 2025:
- **Total Users**: 13
- **Trial Users**: 13 (100%)
- **Paid Users**: 0
- **Expired Trials**: 0

All users currently in trial period - perfect timing for Stripe integration!

---

## Future Stripe Integration Plan

### Phase 1: Stripe Atlas Setup (Your Action)
1. Apply for Stripe Atlas from Morocco
2. Get US company incorporation
3. Obtain Stripe account access
4. Configure Stripe Dashboard with products/prices

### Phase 2: Backend Integration
```javascript
// 1. Install Stripe SDK
npm install stripe

// 2. Add environment variables
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PERSONAL_MONTHLY=price_...
STRIPE_PRICE_ID_PERSONAL_YEARLY=price_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
```

### Phase 3: Database Updates
```sql
-- Add payment tracking table
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add webhook events table
CREATE TABLE stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 4: API Implementation
1. **Webhook Handler** (`/api/stripe/webhook`)
   - Handle subscription created/updated/deleted
   - Process payment success/failure
   - Update database accordingly

2. **Checkout Session** (`/api/stripe/create-checkout`)
   - Create Stripe checkout session
   - Include trial_end for seamless transition
   - Return checkout URL

3. **Customer Portal** (`/api/stripe/portal`)
   - Allow users to manage subscriptions
   - Update payment methods
   - View invoices

### Phase 5: Frontend Updates

#### Update Upgrade.jsx
```javascript
// Replace email link with Stripe checkout
const handleUpgrade = async (priceId) => {
  const { checkoutUrl } = await createCheckoutSession({
    priceId,
    userId: user.id,
    successUrl: '/dashboard?upgraded=true',
    cancelUrl: '/upgrade'
  });
  window.location.href = checkoutUrl;
};
```

#### Add to Settings.jsx
```javascript
// Billing section
<BillingSection>
  <CurrentPlan />
  <ManageSubscription />
  <PaymentHistory />
  <Invoices />
</BillingSection>
```

---

## Migration Steps

### Step 1: Prepare Existing Users
```sql
-- Mark all expired trials before go-live
UPDATE subscriptions 
SET status = 'canceled'
WHERE status = 'trialing' 
  AND trial_end < NOW();
```

### Step 2: Dual System Period
1. Keep manual activation working
2. Add Stripe for new users
3. Migrate existing paid users individually
4. Send migration emails to trial users

### Step 3: Complete Migration
```sql
-- Create Stripe customers for all users
INSERT INTO customers (user_id, stripe_customer_id)
SELECT 
  p.id,
  'cus_pending_' || p.id::text
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM customers c 
  WHERE c.user_id = p.id
);
```

### Step 4: Cleanup
1. Remove manual activation code
2. Update documentation
3. Notify all users of new billing system

---

## Testing Strategy

### Local Testing
```bash
# Use Stripe CLI for webhook testing
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger customer.subscription.deleted
```

### Test Scenarios
1. New user signup → trial creation
2. Trial expiration → upgrade flow
3. Successful payment → activation
4. Failed payment → retry flow
5. Subscription cancellation
6. Plan upgrades/downgrades

---

## Important Considerations

### Security
- ✅ Never expose Stripe secret keys
- ✅ Verify webhook signatures
- ✅ Use HTTPS for all API calls
- ✅ Implement rate limiting
- ✅ Log all billing events

### User Experience
- ✅ Clear pricing display
- ✅ Transparent trial terms
- ✅ Easy cancellation process
- ✅ Prorated upgrades/downgrades
- ✅ Email notifications for billing events

### Compliance
- ✅ Clear Terms of Service
- ✅ Privacy Policy updates
- ✅ Tax handling (Stripe Tax)
- ✅ Refund policy
- ✅ Data retention policy

### Morocco-Specific Considerations
- Stripe Atlas provides US incorporation
- Consider tax implications
- Currency conversion handling
- Local payment methods (future)

---

## Code Snippets for Implementation

### Stripe Webhook Handler
```javascript
// /api/stripe/webhook.js
export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
```

### Trial to Paid Conversion
```javascript
async function handleCheckoutComplete(session) {
  const { customer, subscription, client_reference_id } = session;
  
  // Update customer record
  await supabase
    .from('customers')
    .upsert({
      user_id: client_reference_id,
      stripe_customer_id: customer
    });
  
  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      id: subscription,
      status: 'active',
      price_id: session.price_id
    })
    .eq('user_id', client_reference_id);
}
```

---

## Timeline Estimate

1. **Stripe Atlas Application**: 1-2 weeks
2. **Backend Integration**: 2-3 days
3. **Frontend Updates**: 1-2 days
4. **Testing**: 2-3 days
5. **Migration**: 1 day
6. **Total**: ~3-4 weeks from Stripe access

---

## Support Resources

- [Stripe Atlas](https://stripe.com/atlas)
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase + Stripe Guide](https://supabase.com/docs/guides/integrations/stripe)
- Email: alphabmu04@gmail.com

---

**Remember**: Your current system is perfectly designed for this transition. No data will be lost, and users won't be disrupted. Launch now, integrate Stripe when ready! 🚀