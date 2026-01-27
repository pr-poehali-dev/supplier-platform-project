-- Таблица для хранения платежных ссылок на подписки
CREATE TABLE IF NOT EXISTS subscription_payment_links (
  id SERIAL PRIMARY KEY,
  plan_type VARCHAR(50) NOT NULL UNIQUE,
  payment_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем дефолтные записи для каждого тарифа
INSERT INTO subscription_payment_links (plan_type, payment_url, description) VALUES
  ('start', 'https://checkout.tochka.com/c9cbfc24-0859-44f9-8e64-afdc531e1381', 'Тариф START - 1990₽/мес'),
  ('pro', '', 'Тариф PRO - 3990₽/мес'),
  ('business', '', 'Тариф BUSINESS - 6990₽/мес'),
  ('enterprise', 'https://t.me/your_telegram', 'Enterprise - связь через Telegram')
ON CONFLICT (plan_type) DO NOTHING;