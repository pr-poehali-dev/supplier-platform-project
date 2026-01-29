-- Normalize subscription_plan values to lowercase in users table
UPDATE t_p14287273_supplier_platform_pr.users
SET subscription_plan = LOWER(subscription_plan)
WHERE subscription_plan IS NOT NULL AND subscription_plan != LOWER(subscription_plan);

-- Update user_id=1 subscription data to match active subscriptions properly
UPDATE t_p14287273_supplier_platform_pr.users
SET 
  subscription_plan = 'pro',
  subscription_expires_at = '2027-01-29T23:59:59'::timestamp,
  subscription_updated_at = NOW()
WHERE id = 1;

-- If user has pending subscription, activate it
UPDATE t_p14287273_supplier_platform_pr.subscriptions
SET 
  status = 'active',
  activated_at = NOW(),
  current_period_start = NOW(),
  current_period_end = '2027-01-29T23:59:59'::timestamp
WHERE user_id = 1 AND status = 'pending';