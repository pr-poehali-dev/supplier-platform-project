-- Добавление поля для хранения токена Telegram бота
ALTER TABLE t_p14287273_supplier_platform_pr.bot_settings 
ADD COLUMN telegram_bot_token TEXT NULL;