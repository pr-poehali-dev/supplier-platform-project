-- Добавляем поле для хранения ссылки СБП владельца
ALTER TABLE t_p14287273_supplier_platform_pr.users
ADD COLUMN sbp_payment_link TEXT;

-- Добавляем поле для хранения информации о получателе платежа
ALTER TABLE t_p14287273_supplier_platform_pr.users
ADD COLUMN sbp_recipient_name VARCHAR(255);

-- Комментарии
COMMENT ON COLUMN t_p14287273_supplier_platform_pr.users.sbp_payment_link IS 'Ссылка на оплату через СБП для этого владельца';
COMMENT ON COLUMN t_p14287273_supplier_platform_pr.users.sbp_recipient_name IS 'Имя получателя платежа (отображается клиенту)';