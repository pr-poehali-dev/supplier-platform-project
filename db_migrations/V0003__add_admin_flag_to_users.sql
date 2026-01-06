-- Добавление поля is_admin к таблице users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Создание индекса для быстрого поиска админов
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Комментарий к полю
COMMENT ON COLUMN users.is_admin IS 'Флаг администратора системы с доступом к админ-панели';