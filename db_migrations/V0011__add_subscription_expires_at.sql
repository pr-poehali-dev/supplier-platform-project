-- Добавление поля для даты окончания подписки
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Индекс для быстрой проверки истекших подписок
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires ON users(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;
