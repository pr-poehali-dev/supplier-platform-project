-- Добавляем поле created_by в units для привязки объектов к владельцу
ALTER TABLE units ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Обновляем существующие записи (привязываем к первому пользователю)
UPDATE units SET created_by = (SELECT id FROM users LIMIT 1) WHERE created_by IS NULL;

-- Добавляем поле user_id в conversations для привязки к владельцу турбазы
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- Добавляем channel_user_id для идентификации клиента в Telegram/WhatsApp
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel_user_id VARCHAR(255);

-- Создаём уникальный индекс для предотвращения дубликатов
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_channel_user 
ON conversations (channel, channel_user_id) 
WHERE channel_user_id IS NOT NULL;
