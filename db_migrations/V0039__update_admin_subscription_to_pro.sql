-- Update the latest subscription for user_id=1 to 'pro' plan
UPDATE t_p14287273_supplier_platform_pr.subscriptions
SET 
  plan_code = 'pro',
  amount = 1990.00
WHERE id = (
  SELECT id 
  FROM t_p14287273_supplier_platform_pr.subscriptions 
  WHERE user_id = 1 
  ORDER BY created_at DESC 
  LIMIT 1
);