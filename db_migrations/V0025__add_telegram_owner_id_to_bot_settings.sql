ALTER TABLE t_p14287273_supplier_platform_pr.bot_settings 
ADD COLUMN telegram_owner_id VARCHAR(100);

COMMENT ON COLUMN t_p14287273_supplier_platform_pr.bot_settings.telegram_owner_id IS 'Telegram ID владельца для получения уведомлений о бронированиях';