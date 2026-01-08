# Настройка Telegram-бота для системы бронирования

## Шаг 1: Создание бота через @BotFather

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/newbot`
3. Укажите имя бота (например: "TourConnect Бронирование")
4. Укажите username бота с окончанием `_bot` (например: `tourconnect_booking_bot`)
5. Скопируйте токен вида: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

## Шаг 2: Добавление токена в секреты

1. В интерфейсе poehali.dev добавьте секрет `TELEGRAM_BOT_TOKEN`
2. Вставьте скопированный токен

## Шаг 3: Настройка webhook

После добавления токена выполните один из вариантов:

### Вариант A: Автоматическая настройка (рекомендуется)

Откройте в браузере:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://functions.poehali.dev/c2a7d78f-5e5c-4130-8e7e-2b513f841761
```

Замените `<YOUR_BOT_TOKEN>` на ваш токен от @BotFather.

Вы должны увидеть:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### Вариант B: Через curl (для продвинутых)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://functions.poehali.dev/c2a7d78f-5e5c-4130-8e7e-2b513f841761"}'
```

## Шаг 4: Проверка работы

1. Откройте вашего бота в Telegram
2. Отправьте команду `/start <USER_ID>`, где USER_ID — ваш ID пользователя
3. Бот должен ответить приветствием и предложить забронировать проживание

## Шаг 5: Получение ссылки для клиентов

Ваша уникальная ссылка для клиентов:
```
https://t.me/<YOUR_BOT_USERNAME>?start=<USER_ID>
```

Пример:
```
https://t.me/tourconnect_booking_bot?start=1
```

Эту ссылку нужно:
- Разместить на вашем сайте
- Отправлять клиентам для бронирования
- Добавить в соцсети и мессенджеры

## Как работает система:

1. Клиент переходит по вашей уникальной ссылке
2. Telegram открывает чат с ботом и автоматически отправляет `/start <USER_ID>`
3. Бот связывает этого клиента с вашим календарём бронирований
4. AI-ассистент отвечает на вопросы и автоматически создаёт бронирования
5. Все бронирования появляются в вашем календаре на сайте

## Проверка статуса webhook:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Должно вернуть:
```json
{
  "ok": true,
  "result": {
    "url": "https://functions.poehali.dev/c2a7d78f-5e5c-4130-8e7e-2b513f841761",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Troubleshooting:

### Бот не отвечает:
- Проверьте, что webhook настроен: `/getWebhookInfo`
- Проверьте, что токен добавлен в секреты проекта
- Убедитесь, что используете правильную ссылку с вашим USER_ID

### Ошибка "Неверная ссылка":
- Проверьте, что USER_ID существует в таблице `users`
- ID должен быть числом (например: 1, 2, 3)

### Бронирования не создаются:
- Проверьте, что добавлены объекты в календарь
- Убедитесь, что OpenAI API ключ добавлен в секреты
- Проверьте логи backend функции `telegram-webhook`
