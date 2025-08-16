-- Migration: Add 14-day free trial system
-- Description: Implements a trial system without requiring Stripe integration
-- Author: Devlog Team
-- Date: 2025-01-31

-- First, let's update the handle_new_user function to create trial subscriptions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile record for new user
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    settings,
    subscription_tier,
    subscription_status
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    '{}',
    'personal',  -- Give them personal tier during trial
    'trialing'   -- Set status to trialing
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);
  
  -- Create trial subscription record
  -- Only create if user doesn't already have a subscription
  INSERT INTO public.subscriptions (
    id,
    user_id,
    status,
    price_id,
    tier,
    current_period_end,
    trial_end
  ) 
  SELECT
    'trial_' || new.id::text,  -- Simple ID for trial
    new.id,
    'trialing',
    'trial_personal',  -- Special price ID for trials
    'personal',
    now() + interval '14 days',
    now() + interval '14 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = new.id
  );
  
  RETURN new;
END;
$$;

-- Create function to check trial status
CREATE OR REPLACE FUNCTION public.check_trial_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'is_active', CASE 
      WHEN s.status = 'trialing' AND s.trial_end > now() THEN true
      WHEN s.status = 'active' THEN true  -- Active subscription
      ELSE false
    END,
    'is_trial', CASE 
      WHEN s.status = 'trialing' THEN true
      ELSE false
    END,
    'days_remaining', CASE 
      WHEN s.status = 'trialing' AND s.trial_end > now() 
      THEN GREATEST(0, EXTRACT(DAY FROM s.trial_end - now())::int)
      ELSE 0
    END,
    'hours_remaining', CASE 
      WHEN s.status = 'trialing' AND s.trial_end > now() 
      THEN GREATEST(0, EXTRACT(EPOCH FROM s.trial_end - now())/3600)::int
      ELSE 0
    END,
    'trial_end', s.trial_end,
    'status', s.status,
    'tier', COALESCE(s.tier, 'free')
  )
  INTO v_result
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND (s.status IN ('trialing', 'active') OR s.trial_end > now() - interval '30 days')
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- If no subscription found, check if user exists and return free status
  IF v_result IS NULL THEN
    SELECT jsonb_build_object(
      'is_active', false,
      'is_trial', false,
      'days_remaining', 0,
      'hours_remaining', 0,
      'trial_end', null,
      'status', 'none',
      'tier', 'free'
    )
    INTO v_result
    FROM profiles
    WHERE id = p_user_id;
  END IF;
  
  RETURN COALESCE(v_result, '{"is_active": false, "is_trial": false, "days_remaining": 0, "hours_remaining": 0, "status": "none", "tier": "free"}'::jsonb);
END;
$$;

-- Create function to manually extend trial (for admin use)
CREATE OR REPLACE FUNCTION public.extend_trial(p_user_id uuid, p_days integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Only allow positive day extensions
  IF p_days <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Days must be positive');
  END IF;
  
  -- Update the trial_end date
  UPDATE subscriptions
  SET 
    trial_end = GREATEST(trial_end, now()) + (p_days || ' days')::interval,
    current_period_end = GREATEST(current_period_end, now()) + (p_days || ' days')::interval,
    updated_at = now()
  WHERE user_id = p_user_id
    AND status = 'trialing'
  RETURNING jsonb_build_object(
    'success', true,
    'new_trial_end', trial_end,
    'days_added', p_days
  ) INTO v_result;
  
  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active trial found for user');
  END IF;
  
  RETURN v_result;
END;
$$;

-- Create RLS policies for subscriptions table if they don't exist
DO $$ 
BEGIN
  -- Enable RLS on subscriptions table if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'subscriptions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
  DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
  
  -- Create new policies
  CREATE POLICY "Users can view own subscription" 
    ON public.subscriptions FOR SELECT 
    USING (auth.uid() = user_id);
    
  -- Service role (for functions) can do everything
  CREATE POLICY "Service role can manage subscriptions" 
    ON public.subscriptions FOR ALL 
    USING (auth.role() = 'service_role');
END $$;

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.check_trial_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_trial(uuid, integer) TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION public.check_trial_status(uuid) IS 'Check the trial/subscription status for a user';
COMMENT ON FUNCTION public.extend_trial(uuid, integer) IS 'Manually extend a users trial period (admin only)';

-- Create an index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
  ON public.subscriptions(user_id, status) 
  WHERE status IN ('trialing', 'active');