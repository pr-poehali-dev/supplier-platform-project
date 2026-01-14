-- Добавление полей для связи с ценовым профилем в таблицу units
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS pricing_profile_id INTEGER REFERENCES pricing_profiles(id),
ADD COLUMN IF NOT EXISTS dynamic_pricing_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS override_min_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS override_max_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS override_base_price NUMERIC(10, 2);

-- Индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_units_pricing_profile ON units(pricing_profile_id);

-- Привязка существующих объектов к дефолтному профилю
UPDATE units 
SET pricing_profile_id = (SELECT id FROM pricing_profiles WHERE is_default = TRUE LIMIT 1)
WHERE pricing_profile_id IS NULL;