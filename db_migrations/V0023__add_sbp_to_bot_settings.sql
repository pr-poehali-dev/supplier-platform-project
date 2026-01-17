-- Add SBP payment fields to bot settings
ALTER TABLE t_p14287273_supplier_platform_pr.bot_settings
ADD COLUMN IF NOT EXISTS sbp_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS sbp_recipient_name VARCHAR(255);