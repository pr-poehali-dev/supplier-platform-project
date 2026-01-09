-- Исправление регистра subscription_plan для корректной работы
UPDATE users 
SET subscription_plan = LOWER(subscription_plan) 
WHERE subscription_plan IS NOT NULL;
