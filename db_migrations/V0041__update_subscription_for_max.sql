-- Обновление подписки для max@im-romantsov.ru
UPDATE users 
SET 
  subscription_plan = 'business',
  subscription_expires_at = '2026-12-31'::timestamp
WHERE email = 'max@im-romantsov.ru';