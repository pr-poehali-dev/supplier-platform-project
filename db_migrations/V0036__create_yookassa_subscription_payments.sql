-- Rename old table
ALTER TABLE subscription_payments RENAME TO subscription_payments_old;

-- Create new YooKassa subscription_payments table
CREATE TABLE subscription_payments (
    id SERIAL PRIMARY KEY,
    subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
    yookassa_payment_id TEXT NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_type TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_yookassa_payment_id ON subscription_payments(yookassa_payment_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
