-- Добавляем owner_id в таблицу units
ALTER TABLE units ADD COLUMN IF NOT EXISTS owner_id INTEGER;
ALTER TABLE units DROP CONSTRAINT IF EXISTS fk_units_owner;
ALTER TABLE units ADD CONSTRAINT fk_units_owner FOREIGN KEY (owner_id) REFERENCES users(id);

-- Добавляем owner_id в таблицу bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS owner_id INTEGER;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_owner;
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_owner FOREIGN KEY (owner_id) REFERENCES users(id);

-- Переименовываем user_id в owner_id в таблице conversations для единообразия
ALTER TABLE conversations RENAME COLUMN user_id TO owner_id;

-- Добавляем owner_id в таблицу pricing_profiles
ALTER TABLE pricing_profiles ADD COLUMN IF NOT EXISTS owner_id INTEGER;
ALTER TABLE pricing_profiles DROP CONSTRAINT IF EXISTS fk_pricing_profiles_owner;
ALTER TABLE pricing_profiles ADD CONSTRAINT fk_pricing_profiles_owner FOREIGN KEY (owner_id) REFERENCES users(id);

-- Добавляем owner_id в таблицу price_modifiers
ALTER TABLE price_modifiers ADD COLUMN IF NOT EXISTS owner_id INTEGER;
ALTER TABLE price_modifiers DROP CONSTRAINT IF EXISTS fk_price_modifiers_owner;
ALTER TABLE price_modifiers ADD CONSTRAINT fk_price_modifiers_owner FOREIGN KEY (owner_id) REFERENCES users(id);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_units_owner ON units(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_owner ON bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_pricing_profiles_owner ON pricing_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_price_modifiers_owner ON price_modifiers(owner_id);