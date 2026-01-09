-- Добавление колонки subscription_plan к таблице users
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMP;

-- Создание индекса для быстрого поиска по email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Таблица для хранения истории платежей
CREATE TABLE IF NOT EXISTS subscription_payments (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    plan VARCHAR(20) NOT NULL,
    invoice_id VARCHAR(100) NOT NULL UNIQUE,
    amount VARCHAR(20) NOT NULL,
    paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска платежей по email
CREATE INDEX IF NOT EXISTS idx_payments_email ON subscription_payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON subscription_payments(invoice_id);

COMMENT ON TABLE subscription_payments IS 'История платежей за подписки';
COMMENT ON COLUMN users.subscription_plan IS 'Текущий тариф: none, start, pro, business, enterprise';
