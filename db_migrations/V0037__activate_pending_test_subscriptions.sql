-- Activate test subscriptions for user 23
UPDATE subscriptions 
SET status = 'active', activated_at = NOW() 
WHERE user_id = 23 AND status = 'pending';
