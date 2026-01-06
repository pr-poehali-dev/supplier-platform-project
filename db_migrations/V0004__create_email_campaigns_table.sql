-- Создание таблицы для email рассылок
CREATE TABLE IF NOT EXISTS email_campaigns (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    sent_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' -- 'draft', 'sending', 'sent', 'failed'
);

-- Комментарии
COMMENT ON TABLE email_campaigns IS 'История email рассылок пользователям';
COMMENT ON COLUMN email_campaigns.status IS 'Статус рассылки: draft, sending, sent, failed';