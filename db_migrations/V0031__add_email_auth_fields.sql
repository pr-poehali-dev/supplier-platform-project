-- Добавление полей для email-авторизации в существующую таблицу users

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Обновляем существующие записи
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;

-- Создаем индекс для email если не существует
CREATE INDEX IF NOT EXISTS idx_users_email_auth ON users(email) WHERE password_hash IS NOT NULL;