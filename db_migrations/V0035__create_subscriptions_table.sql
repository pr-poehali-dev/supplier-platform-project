-- Migration: Create subscriptions table for Tochka Bank recurring payments
CREATE TABLE IF NOT EXISTS t_p14287273_supplier_platform_pr.subscriptions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p14287273_supplier_platform_pr.users(id),
    plan_code TEXT NOT NULL CHECK (plan_code IN ('start', 'pro', 'business')),
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
    tochka_subscription_id TEXT,
    tochka_card_id TEXT,
    next_charge_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON t_p14287273_supplier_platform_pr.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON t_p14287273_supplier_platform_pr.subscriptions(status);
CREATE INDEX idx_subscriptions_tochka_id ON t_p14287273_supplier_platform_pr.subscriptions(tochka_subscription_id);

COMMENT ON TABLE t_p14287273_supplier_platform_pr.subscriptions IS 'Подписки пользователей через Точка Банк';
COMMENT ON COLUMN t_p14287273_supplier_platform_pr.subscriptions.status IS 'pending - ожидает оплаты, active - активна, cancelled - отменена, expired - истекла';
COMMENT ON COLUMN t_p14287273_supplier_platform_pr.subscriptions.tochka_subscription_id IS 'ID подписки в системе Точка Банк';
