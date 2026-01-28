# Инструкция по интеграции с Точка Банк

## ✅ Что уже сделано

### 1. Backend функции развёрнуты
- **tochka-subscription** — создание подписки через Acquiring API  
  URL: `https://functions.poehali.dev/2e481bdd-814f-4a67-a604-c4dfa33d848c`

- **tochka-webhook** — обработка уведомлений о платежах  
  URL: `https://functions.poehali.dev/f44bba27-a610-42b6-b8b3-8ef531be217a`

### 2. База данных
Таблица `subscriptions` создана со структурой:
- `id` — UUID подписки
- `user_id` — ID пользователя
- `plan_code` — тариф (start/pro/business)
- `amount` — сумма в рублях
- `status` — статус (pending/active/expired/cancelled)
- `tochka_subscription_id` — ID операции в Точка Банк
- `next_charge_date` — дата следующего списания
- `expires_at` — дата окончания подписки

### 3. Frontend
- `/pricing` — страница тарифов с кнопками оплаты
- `/subscription-status` — страница статуса после оплаты
- Профиль пользователя обновляется автоматически

### 4. Секреты (добавь в poehali.dev)
- ✅ `TOCHKA_CLIENT_ID` — **83d30e0012814c8bb5c03daeb9cfa8e5**
- ✅ `TOCHKA_CLIENT_SECRET` — **1825d3e4f40a43f8b71b42e5a9969e3c**
- ⏳ `TOCHKA_CUSTOMER_CODE` — найди в ЛК Точка Банк (9 цифр)
- ⏳ `TOCHKA_MERCHANT_ID` — найди в разделе "Интернет-эквайринг"

---

## 📋 Что нужно настроить в личном кабинете Точка Банк

### Шаг 1: Настройка Webhook для уведомлений
1. Получите access_token через OAuth (см. раздел "Тестирование")
2. Создайте webhook через API:

```bash
curl -X POST 'https://enter.tochka.com/uapi/v1.0/webhooks/83d30e0012814c8bb5c03daeb9cfa8e5' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "webhooksList": ["acquiringInternetPayment"],
    "url": "https://functions.poehali.dev/f44bba27-a610-42b6-b8b3-8ef531be217a"
  }'
```

### Шаг 2: Получить customerCode и merchantId
1. Войдите в личный кабинет Точка Банк
2. **customerCode** — найдите в разделе "Реквизиты компании" (9-значный код)
3. **merchantId** — перейдите в "Интернет-эквайринг" → "Торговые точки"
4. Добавьте эти значения в секреты проекта на poehali.dev

---

## 🧪 Тестирование интеграции

### 1. Получение access_token для тестов
```bash
curl -X POST 'https://enter.tochka.com/connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=83d30e0012814c8bb5c03daeb9cfa8e5' \
  -d 'client_secret=1825d3e4f40a43f8b71b42e5a9969e3c' \
  -d 'grant_type=client_credentials' \
  -d 'scope=accounts balances customers statements sbp payments acquiring'
```

### 2. Тест создания подписки (после добавления секретов)
```bash
curl -X POST https://functions.poehali.dev/2e481bdd-814f-4a67-a604-c4dfa33d848c \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{"plan_code": "start"}'
```

**Ожидаемый ответ:**
```json
{
  "paymentUrl": "https://merch.example.com/order/?uuid=...",
  "subscriptionId": "uuid",
  "amount": 2450,
  "purpose": "Подписка TourConnect — START"
}
```

### 3. Тест полного потока оплаты
1. Зайдите на https://tourconnect.ru/pricing
2. Выберите любой тариф
3. Нажмите "Перейти к оплате"
4. Вы будете перенаправлены на форму оплаты Точка Банк
5. Введите данные карты (или используйте тестовую)
6. После успешной оплаты → возврат на `/subscription-status?status=success`
7. Через 3 секунды — автоматический переход в профиль

---

## 📊 Структура API

### POST /uapi/v1.0/acquiring/v1.0/subscriptions
**Создание подписки**

Request:
```json
{
  "Data": {
    "customerCode": "300000092",
    "amount": 2450.00,
    "purpose": "Подписка TourConnect — START",
    "redirectUrl": "https://tourconnect.ru/subscription-status?subscriptionId=xxx&status=success",
    "failRedirectUrl": "https://tourconnect.ru/subscription-status?subscriptionId=xxx&status=error",
    "saveCard": true,
    "consumerId": "subscription-uuid",
    "merchantId": "200000000001056",
    "recurring": true,
    "Options": {
      "paymentLinkId": "subscription-uuid"
    }
  }
}
```

Response:
```json
{
  "Data": {
    "operationId": "48232c9a-ce82-1593-3cb6-5c85a1ffef8f",
    "paymentLink": "https://merch.example.com/order/?uuid=...",
    "status": "CREATED",
    "amount": 2450.00,
    "purpose": "Подписка TourConnect — START",
    "recurring": true
  }
}
```

### Webhook: acquiringInternetPayment
**Уведомление о платеже**

Request от Точка Банк:
```json
{
  "type": "acquiringInternetPayment",
  "operationId": "48232c9a-ce82-1593-3cb6-5c85a1ffef8f",
  "status": "PAID",
  "consumerId": "subscription-uuid",
  "amount": 2450.00
}
```

Обработка:
- **PAID** / **SUCCESS** → продлить подписку на 30 дней
- **FAILED** / **ERROR** → отменить подписку, отправить email пользователю

---

## 🔄 Автоматическое списание

Точка Банк автоматически списывает средства раз в месяц:
1. За 3 дня до `next_charge_date` — попытка списания
2. Если успех → webhook `acquiringInternetPayment` с `status: PAID`
3. Backend обновляет `next_charge_date` и `expires_at`
4. Если ошибка → webhook с `status: FAILED` → отменяем подписку

**ВАЖНО:** Настройте отправку email уведомлений при ошибке списания!  
(см. строку 129 в `backend/tochka-webhook/index.py`)

---

## 📋 Checklist для запуска

- [ ] Добавить секреты в poehali.dev:
  - [ ] `TOCHKA_CLIENT_ID`
  - [ ] `TOCHKA_CLIENT_SECRET`
  - [ ] `TOCHKA_CUSTOMER_CODE`
  - [ ] `TOCHKA_MERCHANT_ID`

- [ ] Настроить webhook в Точка Банк:
  - [ ] Получить access_token
  - [ ] Создать webhook через API
  - [ ] Указать URL: `https://functions.poehali.dev/f44bba27-a610-42b6-b8b3-8ef531be217a`
  - [ ] Выбрать событие: `acquiringInternetPayment`

- [ ] Протестировать:
  - [ ] Создание подписки (POST к tochka-subscription)
  - [ ] Полный поток оплаты через сайт
  - [ ] Возврат на /subscription-status
  - [ ] Обновление профиля пользователя

---

## 📞 Поддержка

При проблемах проверьте:
1. Логи backend функций в dashboard poehali.dev
2. Статус подписок в БД
3. Правильность customerCode и merchantId
4. Наличие permissions у приложения в ЛК Точка Банк

---

## ✨ Готово к запуску!

Сразу после добавления всех 4 секретов и настройки webhook — система готова к приёму платежей! 🚀
