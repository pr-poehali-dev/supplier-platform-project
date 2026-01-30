-- Добавление bot_id для идентификации бота Telegram
ALTER TABLE t_p14287273_supplier_platform_pr.bot_settings 
ADD COLUMN bot_id BIGINT NULL;

-- Создание индекса для быстрого поиска по bot_id
CREATE INDEX IF NOT EXISTS idx_bot_settings_bot_id 
ON t_p14287273_supplier_platform_pr.bot_settings(bot_id);