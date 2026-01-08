-- Типы объектов размещения
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    max_guests INTEGER NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Сезонные модификаторы цен
CREATE TABLE IF NOT EXISTS price_modifiers (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES units(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    multiplier DECIMAL(5, 2) NOT NULL,
    description VARCHAR(255)
);

-- Бронирования
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES units(id),
    guest_name VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50),
    guest_email VARCHAR(255),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'tentative',
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    external_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT no_overlap CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(unit_id, check_in, check_out);

-- Разговоры с AI-менеджером
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    guest_phone VARCHAR(50),
    guest_email VARCHAR(255),
    channel VARCHAR(50) NOT NULL DEFAULT 'web',
    external_chat_id VARCHAR(255),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Сообщения в разговорах
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- Связь бронирований с разговорами
CREATE TABLE IF NOT EXISTS conversation_bookings (
    conversation_id INTEGER REFERENCES conversations(id),
    booking_id INTEGER REFERENCES bookings(id),
    PRIMARY KEY (conversation_id, booking_id)
);

-- Тестовые данные
INSERT INTO units (name, type, description, base_price, max_guests) VALUES 
('Домик "Уютный"', 'house', 'Деревянный дом с камином и видом на озеро', 5000, 4),
('Домик "Семейный"', 'house', 'Просторный дом для большой компании', 8000, 8),
('Баня с беседкой', 'cabin', 'Русская баня на дровах с зоной отдыха', 3000, 6);

-- Летний сезон дороже
INSERT INTO price_modifiers (unit_id, start_date, end_date, multiplier, description) VALUES
(1, '2026-06-01', '2026-08-31', 1.5, 'Летний сезон'),
(2, '2026-06-01', '2026-08-31', 1.5, 'Летний сезон'),
(3, '2026-06-01', '2026-08-31', 1.3, 'Летний сезон');

-- Новогодние праздники
INSERT INTO price_modifiers (unit_id, start_date, end_date, multiplier, description) VALUES
(1, '2025-12-28', '2026-01-08', 2.0, 'Новогодние праздники'),
(2, '2025-12-28', '2026-01-08', 2.0, 'Новогодние праздники');