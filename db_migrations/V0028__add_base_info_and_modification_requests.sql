-- Добавляем базовую информацию о турбазе в bot_settings
ALTER TABLE t_p14287273_supplier_platform_pr.bot_settings
ADD COLUMN IF NOT EXISTS base_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS admin_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS work_hours VARCHAR(100),
ADD COLUMN IF NOT EXISTS extra_notes TEXT;

-- Создаём таблицу заявок на изменение брони
CREATE TABLE IF NOT EXISTS t_p14287273_supplier_platform_pr.modification_requests (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER,
    client_name VARCHAR(255),
    client_phone VARCHAR(50),
    telegram_chat_id BIGINT,
    message_from_client TEXT NOT NULL,
    requested_changes JSONB,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by INTEGER
);

CREATE INDEX IF NOT EXISTS idx_modification_requests_status 
ON t_p14287273_supplier_platform_pr.modification_requests(status);

CREATE INDEX IF NOT EXISTS idx_modification_requests_booking 
ON t_p14287273_supplier_platform_pr.modification_requests(booking_id);