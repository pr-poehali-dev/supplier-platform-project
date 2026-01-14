-- AI Assistant tables for owner isolation

-- Bot settings per owner
CREATE TABLE IF NOT EXISTS bot_settings (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL UNIQUE,
    bot_name VARCHAR(100) DEFAULT 'Ассистент',
    greeting_message TEXT,
    communication_style TEXT,
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_days INTEGER DEFAULT 30,
    production_calendar_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional services (doprodazhi)
CREATE TABLE IF NOT EXISTS additional_services (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    category VARCHAR(50),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer database per owner
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(200),
    telegram_id BIGINT,
    last_booking_date DATE,
    total_bookings INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI conversations per owner
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    customer_id INTEGER,
    context_type VARCHAR(50) DEFAULT 'owner_chat',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Production calendar (Russian holidays)
CREATE TABLE IF NOT EXISTS production_calendar (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    is_working_day BOOLEAN NOT NULL,
    is_holiday BOOLEAN DEFAULT false,
    holiday_name VARCHAR(200),
    is_shortened_day BOOLEAN DEFAULT false
);

-- Insert 2026-2027 holidays
INSERT INTO production_calendar (date, year, is_working_day, is_holiday, holiday_name) VALUES
('2026-01-01', 2026, false, true, 'Новый год'),
('2026-01-02', 2026, false, true, 'Новогодние каникулы'),
('2026-01-03', 2026, false, true, 'Новогодние каникулы'),
('2026-01-04', 2026, false, true, 'Новогодние каникулы'),
('2026-01-05', 2026, false, true, 'Новогодние каникулы'),
('2026-01-06', 2026, false, true, 'Новогодние каникулы'),
('2026-01-07', 2026, false, true, 'Рождество'),
('2026-01-08', 2026, false, true, 'Новогодние каникулы'),
('2026-02-23', 2026, false, true, 'День защитника Отечества'),
('2026-03-08', 2026, false, true, 'Международный женский день'),
('2026-05-01', 2026, false, true, 'Праздник Весны и Труда'),
('2026-05-09', 2026, false, true, 'День Победы'),
('2026-06-12', 2026, false, true, 'День России'),
('2026-11-04', 2026, false, true, 'День народного единства'),
('2027-01-01', 2027, false, true, 'Новый год'),
('2027-01-02', 2027, false, true, 'Новогодние каникулы'),
('2027-01-03', 2027, false, true, 'Новогодние каникулы'),
('2027-01-04', 2027, false, true, 'Новогодние каникулы'),
('2027-01-05', 2027, false, true, 'Новогодние каникулы'),
('2027-01-06', 2027, false, true, 'Новогодние каникулы'),
('2027-01-07', 2027, false, true, 'Рождество'),
('2027-01-08', 2027, false, true, 'Новогодние каникулы'),
('2027-02-23', 2027, false, true, 'День защитника Отечества'),
('2027-03-08', 2027, false, true, 'Международный женский день'),
('2027-05-01', 2027, false, true, 'Праздник Весны и Труда'),
('2027-05-09', 2027, false, true, 'День Победы'),
('2027-06-12', 2027, false, true, 'День России'),
('2027-11-04', 2027, false, true, 'День народного единства')
ON CONFLICT (date) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_bot_settings_owner ON bot_settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_owner ON additional_services(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON ai_conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON production_calendar(date);