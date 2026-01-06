-- Создание таблицы пользователей для хранения данных OAuth авторизации
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    provider VARCHAR(50) NOT NULL, -- 'vk', 'yandex', 'google'
    provider_id VARCHAR(255) NOT NULL, -- ID пользователя у провайдера
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    telegram_invited BOOLEAN DEFAULT FALSE,
    UNIQUE(provider, provider_id)
);

-- Создание индексов для быстрого поиска
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);

-- Комментарии к таблице
COMMENT ON TABLE users IS 'Пользователи, зарегистрированные через OAuth (VK, Яндекс, Google)';
COMMENT ON COLUMN users.provider IS 'Провайдер авторизации: vk, yandex, google';
COMMENT ON COLUMN users.provider_id IS 'Уникальный ID пользователя у провайдера OAuth';
COMMENT ON COLUMN users.telegram_invited IS 'Флаг приглашения пользователя в Telegram канал';