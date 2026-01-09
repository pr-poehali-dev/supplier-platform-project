-- Таблица для хранения настроек синхронизации с внешними календарями
CREATE TABLE IF NOT EXISTS calendar_sync (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'avito', 'yandex', 'booking', 'airbnb' и т.д.
    calendar_url TEXT, -- URL внешнего iCalendar для импорта
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_id, platform)
);

-- Индекс для быстрого поиска активных синхронизаций
CREATE INDEX IF NOT EXISTS idx_calendar_sync_active ON calendar_sync(is_active, unit_id);

-- Добавляем поле source в bookings для отслеживания источника брони
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'website';
