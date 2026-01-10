-- Создание таблицы для хранения сообщений из Telegram
CREATE TABLE IF NOT EXISTS telegram_messages (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    telegram_id BIGINT NOT NULL,
    message_text TEXT,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'bot')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по booking_id
CREATE INDEX IF NOT EXISTS idx_telegram_messages_booking_id ON telegram_messages(booking_id);

-- Индекс для поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_telegram_messages_telegram_id ON telegram_messages(telegram_id);