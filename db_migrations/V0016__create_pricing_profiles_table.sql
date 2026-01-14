-- Таблица ценовых профилей (централизованная логика ценообразования)
CREATE TABLE IF NOT EXISTS pricing_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mode VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual', 'tips', 'rules', 'auto')),
    base_price NUMERIC(10, 2) NOT NULL,
    min_price NUMERIC(10, 2) NOT NULL,
    max_price NUMERIC(10, 2) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    CONSTRAINT price_range_check CHECK (min_price <= base_price AND base_price <= max_price)
);

-- Таблица правил динамического ценообразования
CREATE TABLE IF NOT EXISTS pricing_rules (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL REFERENCES pricing_profiles(id),
    name VARCHAR(255) NOT NULL,
    condition_type VARCHAR(50) NOT NULL CHECK (condition_type IN ('occupancy', 'days_before', 'day_of_week', 'season', 'custom')),
    condition_operator VARCHAR(20) NOT NULL CHECK (condition_operator IN ('>', '<', '>=', '<=', '=', 'between')),
    condition_value JSONB NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('increase', 'decrease', 'set')),
    action_value NUMERIC(10, 2) NOT NULL,
    action_unit VARCHAR(10) NOT NULL CHECK (action_unit IN ('percent', 'fixed')),
    priority INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_action_value CHECK (action_value >= 0)
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_pricing_rules_profile ON pricing_rules(profile_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(profile_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_profiles_default ON pricing_profiles(is_default) WHERE is_default = TRUE;

-- Таблица логов изменения цен (для аудита и аналитики)
CREATE TABLE IF NOT EXISTS price_calculation_logs (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES units(id),
    date DATE NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    final_price NUMERIC(10, 2) NOT NULL,
    applied_rules JSONB,
    calculation_source VARCHAR(50) NOT NULL CHECK (calculation_source IN ('automatic', 'manual', 'override')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_price_logs_unit_date ON price_calculation_logs(unit_id, date);

-- Вставка дефолтного профиля
INSERT INTO pricing_profiles (name, mode, base_price, min_price, max_price, is_default, created_by)
VALUES ('Базовый профиль', 'rules', 5000.00, 3000.00, 15000.00, TRUE, 1)
ON CONFLICT DO NOTHING;

-- Создание правил для дефолтного профиля
INSERT INTO pricing_rules (profile_id, name, condition_type, condition_operator, condition_value, action_type, action_value, action_unit, priority)
SELECT 
    id,
    'Высокая загрузка (+15%)',
    'occupancy',
    '>=',
    '{"threshold": 70}'::jsonb,
    'increase',
    15.00,
    'percent',
    100
FROM pricing_profiles WHERE is_default = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO pricing_rules (profile_id, name, condition_type, condition_operator, condition_value, action_type, action_value, action_unit, priority)
SELECT 
    id,
    'Срочное бронирование (-20%)',
    'days_before',
    '<',
    '{"days": 5, "occupancy_max": 40}'::jsonb,
    'decrease',
    20.00,
    'percent',
    90
FROM pricing_profiles WHERE is_default = TRUE
ON CONFLICT DO NOTHING;

INSERT INTO pricing_rules (profile_id, name, condition_type, condition_operator, condition_value, action_type, action_value, action_unit, priority)
SELECT 
    id,
    'Выходные (+20%)',
    'day_of_week',
    '=',
    '{"days": [5, 6]}'::jsonb,
    'increase',
    20.00,
    'percent',
    80
FROM pricing_profiles WHERE is_default = TRUE
ON CONFLICT DO NOTHING;