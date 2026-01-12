-- Создание таблицы для синхронизации календарей с внешними площадками
CREATE TABLE IF NOT EXISTS calendar_syncs (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES units(id),
    platform VARCHAR(50) NOT NULL,
    calendar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_unit_id ON calendar_syncs(unit_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_platform ON calendar_syncs(platform);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_active ON calendar_syncs(is_active);

-- Комментарии
COMMENT ON TABLE calendar_syncs IS 'Синхронизация календарей с Авито, Яндекс Путешествиями и другими площадками';
COMMENT ON COLUMN calendar_syncs.platform IS 'Площадка: avito, yandex, booking';
COMMENT ON COLUMN calendar_syncs.calendar_url IS 'iCal ссылка для импорта';
COMMENT ON COLUMN calendar_syncs.is_active IS 'Активна ли синхронизация';
COMMENT ON COLUMN calendar_syncs.last_sync_at IS 'Время последней синхронизации';
