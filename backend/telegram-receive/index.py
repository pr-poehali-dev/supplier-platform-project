import json
import os
import psycopg2
from urllib import request
from datetime import datetime, timedelta

def validate_and_create_booking(intent: dict, schema: str, dsn: str, chat_id: int, owner_telegram_id: int, bot_token: str, owner_id: int) -> dict:
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        unit_name = intent.get('unit_name', '').strip()
        check_in = intent.get('check_in')
        check_out = intent.get('check_out')
        guest_name = intent.get('guest_name')
        guest_phone = intent.get('guest_phone')
        guests_count = intent.get('guests_count', 1)
        additional_services_amount = float(intent.get('additional_services_amount', 0))
        
        if not all([unit_name, check_in, check_out, guest_name, guest_phone]):
            return {'success': False, 'error': 'Недостаточно данных для бронирования', 'unit_name': unit_name or 'Неизвестно'}
        
        cur.execute(f"""
            SELECT id, name, base_price 
            FROM {schema}.units 
            WHERE LOWER(name) = LOWER(%s) 
            LIMIT 1
        """, (unit_name,))
        
        unit = cur.fetchone()
        if not unit:
            return {'success': False, 'error': f'Объект "{unit_name}" не найден', 'unit_name': unit_name}
        
        unit_id, unit_name_db, base_price = unit
        
        cur.execute(f"""
            SELECT COUNT(*) FROM {schema}.bookings
            WHERE unit_id = %s 
              AND status = 'confirmed'
              AND check_out > %s 
              AND check_in < %s
        """, (unit_id, check_in, check_out))
        
        if cur.fetchone()[0] > 0:
            return {'success': False, 'error': 'Даты уже заняты', 'unit_name': unit_name}
        
        cur.execute(f"""
            SELECT COUNT(*) FROM {schema}.pending_bookings
            WHERE unit_id = %s 
              AND verification_status = 'pending'
              AND check_out > %s 
              AND check_in < %s
              AND expires_at > NOW()
        """, (unit_id, check_in, check_out))
        
        if cur.fetchone()[0] > 0:
            return {'success': False, 'error': 'Даты временно заняты (есть ожидающая заявка)', 'unit_name': unit_name}
        
        try:
            pricing_url = 'https://functions.poehali.dev/a4b5c99d-6289-44f5-835f-c865029c71e4'
            date_in = datetime.strptime(check_in, '%Y-%m-%d')
            date_out = datetime.strptime(check_out, '%Y-%m-%d')
            nights = (date_out - date_in).days
            
            if nights <= 0:
                return {'success': False, 'error': 'Некорректные даты', 'unit_name': unit_name}
            
            total_price = 0.0
            current_date = date_in
            
            while current_date < date_out:
                date_str = current_date.strftime('%Y-%m-%d')
                try:
                    price_req = request.Request(
                        f'{pricing_url}?action=calculate_price&unit_id={unit_id}&date={date_str}',
                        method='GET'
                    )
                    with request.urlopen(price_req, timeout=5) as price_resp:
                        price_data = json.loads(price_resp.read().decode())
                        day_price = float(price_data.get('price', base_price))
                        total_price += day_price
                except Exception as price_err:
                    print(f'Failed to get price for {date_str}: {price_err}')
                    total_price += float(base_price)
                
                current_date = current_date + timedelta(days=1)
            
            amount = total_price + additional_services_amount
        except Exception as e:
            print(f'Pricing calculation error: {e}')
            amount = float(base_price) * nights if nights > 0 else 0
        
        # Получаем настройки СБП из bot_settings
        cur.execute(f"""
            SELECT sbp_phone, sbp_recipient_name 
            FROM {schema}.bot_settings 
            WHERE owner_id = %s
            LIMIT 1
        """, (owner_id,))
        payment_info = cur.fetchone()
        sbp_link = payment_info[0] if payment_info and payment_info[0] else 'Не настроено'
        recipient_name = payment_info[1] if payment_info and payment_info[1] else 'Владелец'
        
        cur.execute(f"""
            INSERT INTO {schema}.pending_bookings 
            (unit_id, check_in, check_out, guest_name, guest_contact, 
             telegram_chat_id, amount, payment_link, verification_status, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', NOW() + INTERVAL '24 hours')
            RETURNING id
        """, (unit_id, check_in, check_out, guest_name, guest_phone, chat_id, amount, sbp_link))
        
        pending_id = cur.fetchone()[0]
        conn.commit()
        
        if owner_telegram_id and bot_token:
            try:
                telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                owner_notification = json.dumps({
                    'chat_id': owner_telegram_id,
                    'text': f'''🆕 Новая заявка #{pending_id}

👤 {guest_name}
📞 {guest_phone}
🏡 {unit_name_db}
📅 {check_in} — {check_out}
💰 {amount}₽

Ожидает оплаты от гостя.'''
                }).encode('utf-8')
                
                req_owner = request.Request(telegram_url, data=owner_notification, headers={'Content-Type': 'application/json'}, method='POST')
                with request.urlopen(req_owner) as response:
                    response.read()
            except Exception as e:
                print(f'Owner notification error: {e}')
        
        return {
            'success': True,
            'pending_id': pending_id,
            'amount': amount,
            'sbp_link': sbp_link,
            'recipient_name': recipient_name,
            'unit_name': unit_name_db
        }
        
    except Exception as e:
        print(f'Booking validation error: {e}')
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': f'Ошибка создания бронирования: {str(e)}', 'unit_name': intent.get('unit_name', 'Неизвестно')}
    finally:
        cur.close()
        conn.close()


def handler(event: dict, context) -> dict:
    '''Принимает webhook от Telegram и сохраняет в БД'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        if not body.get('message'):
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
        
        message = body['message']
        chat_id = message['chat']['id']
        text = message.get('text', '')
        user_data = message.get('from', {})
        photo = message.get('photo')
        
        # CRITICAL: Определить владельца бота через query параметр owner_id
        # Каждый бот должен иметь уникальный webhook URL: /webhook?owner_id=XXX
        query_params = event.get('queryStringParameters', {}) or {}
        owner_id = query_params.get('owner_id')
        
        if not owner_id:
            print("[telegram-receive] ERROR: No owner_id in webhook URL")
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
        
        dsn = os.environ.get('DATABASE_URL')
        schema = os.environ.get('MAIN_DB_SCHEMA')
        if not schema:
            temp_conn = psycopg2.connect(dsn)
            temp_cur = temp_conn.cursor()
            temp_cur.execute("SELECT nspname FROM pg_namespace WHERE nspname LIKE 't_%' ORDER BY nspname LIMIT 1")
            schema_row = temp_cur.fetchone()
            schema = schema_row[0] if schema_row else 'public'
            temp_cur.close()
            temp_conn.close()
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        # Получить токен бота для этого владельца
        cur.execute(f"""
            SELECT telegram_bot_token, bot_id 
            FROM {schema}.bot_settings 
            WHERE owner_id = %s
        """, (owner_id,))
        
        bot_row = cur.fetchone()
        if not bot_row or not bot_row[0]:
            print(f"[telegram-receive] ERROR: No bot token for owner_id={owner_id}")
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
        
        bot_token, bot_id = bot_row
        print(f"[telegram-receive] Processing message for owner_id={owner_id}, bot_id={bot_id}")
        
        if photo:
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
            file_id = photo[-1]['file_id']
            
            file_url_api = f'https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}'
            with request.urlopen(file_url_api) as response:
                file_info = json.loads(response.read().decode())
                file_path = file_info['result']['file_path']
                file_url = f'https://api.telegram.org/file/bot{bot_token}/{file_path}'
            
            cur.execute(f'''
                SELECT id FROM {schema}.pending_bookings
                WHERE telegram_chat_id = %s AND verification_status = 'pending'
                ORDER BY created_at DESC LIMIT 1
            ''', (chat_id,))
            
            pending = cur.fetchone()
            
            if pending:
                pending_id = pending[0]
                
                cur.execute(f'''
                    UPDATE {schema}.pending_bookings
                    SET payment_screenshot_url = %s,
                        verification_status = 'awaiting_verification'
                    WHERE id = %s
                ''', (file_url, pending_id))
                
                conn.commit()
                
                cur.execute(f'''
                    SELECT telegram_owner_id, base_name, admin_phone, admin_name, work_hours, extra_notes 
                    FROM {schema}.bot_settings LIMIT 1
                ''')
                bot_settings = cur.fetchone()
                owner_telegram_id = bot_settings[0] if bot_settings and bot_settings[0] else None
                base_name = bot_settings[1] if bot_settings and bot_settings[1] else 'Турбаза'
                admin_phone = bot_settings[2] if bot_settings and bot_settings[2] else 'не указан'
                admin_name = bot_settings[3] if bot_settings and bot_settings[3] else 'Администратор'
                work_hours = bot_settings[4] if bot_settings and bot_settings[4] else ''
                extra_notes = bot_settings[5] if bot_settings and bot_settings[5] else ''
                
                cur.execute(f'''
                    SELECT guest_name, check_in, check_out, guest_contact
                    FROM {schema}.pending_bookings
                    WHERE id = %s
                ''', (pending_id,))
                
                booking_info = cur.fetchone()
                guest_name, check_in, check_out, guest_contact = booking_info
                
                if owner_telegram_id:
                    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendPhoto'
                    owner_notification = json.dumps({
                        'chat_id': owner_telegram_id,
                        'photo': file_id,
                        'caption': f'''💳 Получен скриншот оплаты!

Заявка #{pending_id}
👤 {guest_name}
📞 {guest_contact}
📅 {check_in} — {check_out}

Проверьте оплату на сайте и подтвердите бронирование.'''
                    }).encode('utf-8')
                    
                    req_owner = request.Request(telegram_url, data=owner_notification, headers={'Content-Type': 'application/json'}, method='POST')
                    with request.urlopen(req_owner) as response:
                        response.read()
                
                telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                client_response = json.dumps({
                    'chat_id': chat_id,
                    'text': '✅ Скриншот получен! Владелец проверит оплату и подтвердит бронирование.'
                }).encode('utf-8')
                
                req_client = request.Request(telegram_url, data=client_response, headers={'Content-Type': 'application/json'}, method='POST')
                with request.urlopen(req_client) as response:
                    response.read()
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True})
                }
            
            text = '[Фото отправлено]'
        
        cur.execute(f'''
            INSERT INTO {schema}.telegram_messages (telegram_id, message_text, sender, created_at)
            VALUES (%s, %s, %s, NOW())
        ''', (chat_id, text, 'user'))
        
        cur.execute(f'''
            SELECT tm.message_text, tm.sender, tm.created_at
            FROM {schema}.telegram_messages tm
            WHERE tm.telegram_id = %s
            ORDER BY tm.created_at DESC
            LIMIT 10
        ''', (chat_id,))
        
        history = cur.fetchall()
        conn.commit()
        
        cur.execute(f'''
            SELECT telegram_owner_id, base_name, admin_phone, admin_name, work_hours, extra_notes 
            FROM {schema}.bot_settings 
            WHERE owner_id = %s
        ''', (owner_id,))
        bot_settings = cur.fetchone()
        owner_telegram_id = bot_settings[0] if bot_settings and bot_settings[0] else None
        base_name = bot_settings[1] if bot_settings and bot_settings[1] else 'Турбаза'
        admin_phone = bot_settings[2] if bot_settings and bot_settings[2] else 'не указан'
        admin_name = bot_settings[3] if bot_settings and bot_settings[3] else 'Администратор'
        work_hours = bot_settings[4] if bot_settings and bot_settings[4] else ''
        extra_notes = bot_settings[5] if bot_settings and bot_settings[5] else ''
        
        chatgpt_api_key = os.environ.get('POLZA_AI_API_KEY')
        
        if bot_token and chatgpt_api_key:
            try:
                cur.execute(f'''
                    SELECT id, name, type, base_price, max_guests, description
                    FROM {schema}.units
                    ORDER BY name
                ''')
                units = cur.fetchall()
                
                cur.execute(f'''
                    SELECT name, description, price, category
                    FROM {schema}.additional_services
                    WHERE enabled = true
                    ORDER BY category, name
                ''')
                services = cur.fetchall()
                
                existing_bookings = []
                
                units_text = '\n'.join([f"- {u[1]} ({u[2]}): {u[3]}₽/сутки, до {u[4]} гостей. {u[5] or ''}" for u in units])
                services_text = '\n'.join([f"- {s[0]} ({s[3]}): {s[2]}₽. {s[1] or ''}" for s in services]) if services else 'Пока не добавлено'
                bookings_text = 'Нет активных бронирований'
                
                system_prompt = f'''Ты - ассистент по бронированию турбазы "{base_name}". Сегодня: 2026-01-18.

ИНФОРМАЦИЯ О БАЗЕ:
- Название: {base_name}
- Администратор: {admin_name}
- Телефон администратора: {admin_phone}
{("- Время работы: " + work_hours) if work_hours else ""}
{extra_notes if extra_notes else ""}

ДОСТУПНЫЕ ОБЪЕКТЫ:
{units_text}

ДОПРОДАЖИ (предлагай клиентам):
{services_text}

ТЕКУЩИЕ БРОНИРОВАНИЯ (проверяй занятость):
{bookings_text}

ПОКАЗ ИНФОРМАЦИИ ОБ ОБЪЕКТЕ:
Когда клиент спрашивает про конкретный объект ("расскажи про...", "покажи...", "что такое..."), верни JSON:
{{"intent": "show_unit", "unit_name": "Домик Сосновый"}}
Система сама отправит фото и описание объекта. НЕ пиши текст, только JSON!

ПОКАЗ КАРТЫ / АДРЕСА:
Когда клиент спрашивает "как добраться", "где вы находитесь", "адрес", "навигация", верни ТОЛЬКО JSON:
{{"intent": "show_map"}}
Система сама отправит ссылку на карты. НЕ пиши текст, только JSON!

ИЗМЕНЕНИЕ УЖЕ ОПЛАЧЕННОЙ БРОНИ:
Если клиент хочет внести изменения в УЖЕ ОПЛАЧЕННУЮ бронь (убрать доп. услуги, перенести даты, вернуть деньги):
1. Верни JSON: {{"intent": "modify_booking", "booking_id": ID_брони_если_известен, "requested_changes": "описание что хочет изменить"}}
2. Система САМА создаст заявку администратору
3. После отправки JSON - ответь клиенту:

"Понял вас, вы хотите внести изменения в оплаченную бронь.

Такие изменения обрабатывает администратор базы.
Я передал вашу просьбу администратору.

Для ускорения можете связаться напрямую:
📞 {admin_phone}
🏕 {base_name}"

⚠️ КРИТИЧНО:
- НЕ обещай возврат денег
- НЕ меняй бронь самостоятельно
- НЕ говори "мы не можем"
- ВСЕГДА передавай запрос администратору

ДВУХЭТАПНЫЙ ПРОЦЕСС БРОНИРОВАНИЯ:

ЭТАП 1: СБОР ДАННЫХ И ПОКАЗ ИТОГОВОЙ СУММЫ
1. Вежливо общайся с клиентом
2. Предлагай ТОЛЬКО реальные объекты из списка выше
3. Проверяй занятость по календарю
4. Предлагай допродажи (завтраки, экскурсии)
5. Собирай данные: даты, кол-во гостей, имя, телефон
6. Когда ВСЕ данные собраны - покажи клиенту ПРЕДПРОСМОТР бронирования:

"Подтвердите бронирование:

🏠 Объект: [название объекта]
📅 Даты: [check_in] – [check_out]
👥 Гостей: [количество]

💰 Стоимость:
- Проживание: [сумма за ночи] ₽
- Доп. услуги: [сумма допродаж] ₽
——————————
ИТОГО: [общая сумма] ₽

Напишите «подтверждаю», чтобы перейти к оплате."

⚠️ НА ЭТОМ ЭТАПЕ НЕ ДОБАВЛЯЙ JSON! Бронь ещё НЕ создаётся!

ЭТАП 2: ПОДТВЕРЖДЕНИЕ И СОЗДАНИЕ БРОНИ
7. Когда клиент пишет "подтверждаю", "да", "бронирую", "оплачиваю" - верни ТОЛЬКО JSON С ДАННЫМИ ИЗ ДИАЛОГА, БЕЗ ТЕКСТА:
   {{"intent": "confirm_booking", "guest_name": "Иван", "guest_phone": "+79001234567", "check_in": "2026-02-05", "check_out": "2026-02-08", "guests_count": 2, "unit_name": "Домик \"Сосновый\"", "additional_services_amount": 1500}}

⚠️ КРИТИЧНО:
- НЕ ПИШИ НИКАКОГО ТЕКСТА! Только JSON!
- intent СТРОГО "confirm_booking"
- ОБЯЗАТЕЛЬНО укажи ВСЕ поля: guest_name, guest_phone, check_in, check_out, guests_count, unit_name
- additional_services_amount: сумма допродаж в рублях (0 если нет допродаж)
- Используй данные из предыдущих сообщений диалога (особенно ИТОГО из предпросмотра!)
- Система САМА отправит инструкции по оплате!

8. КРИТИЧНО: unit_name должен ТОЧНО совпадать с названием из списка!
9. НЕ используй markdown блоки ```json```, просто JSON строкой!
10. Для нескольких объектов - отдельный JSON для каждого
11. JSON клиент НЕ видит - система его обработает и отправит платёжные данные!'''
                
                messages = [{'role': 'system', 'content': system_prompt}]
                
                for msg_text, sender, created in reversed(history):
                    role = 'assistant' if sender == 'bot' else 'user'
                    messages.append({'role': role, 'content': msg_text})
                
                chatgpt_url = 'https://api.polza.ai/api/v1/chat/completions'
                chatgpt_data = json.dumps({
                    'model': 'openai/gpt-4o',
                    'messages': messages,
                    'temperature': 0.7
                }).encode('utf-8')
                
                chatgpt_req = request.Request(chatgpt_url, data=chatgpt_data, headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {chatgpt_api_key}'
                }, method='POST')
                
                with request.urlopen(chatgpt_req) as response:
                    chatgpt_response = json.loads(response.read().decode())
                    ai_reply = chatgpt_response['choices'][0]['message']['content']
                    print(f'ChatGPT response: {ai_reply}')
                
                # === DEBUG: ПОЛНОЕ ЛОГИРОВАНИЕ ОТВЕТА AI ===
                print("=" * 80)
                print("🔍 DEBUG: AI REPLY RAW (ПОЛНОСТЬЮ):")
                print(repr(ai_reply))
                print("=" * 80)
                
                import re
                intents = []
                clean_reply = ai_reply
                
                clean_reply = re.sub(r'```json\s*', '', clean_reply)
                clean_reply = re.sub(r'```\s*', '', clean_reply)
                
                json_pattern = r'\{[^{}]*"intent"\s*:\s*"(?:create_booking|confirm_booking|confirm_payment|show_unit|show_map|modify_booking)"[^{}]*\}'
                matches = re.findall(json_pattern, clean_reply)
                
                print(f"🔍 DEBUG: REGEX MATCHES: {matches}")
                print(f"🔍 DEBUG: MATCHES COUNT: {len(matches)}")
                
                for match in matches:
                    try:
                        intent_data = json.loads(match)
                        intents.append(intent_data)
                        clean_reply = clean_reply.replace(match, '').strip()
                        print(f"🔍 DEBUG: PARSED INTENT: {json.dumps(intent_data, ensure_ascii=False)}")
                    except Exception as e:
                        print(f'❌ JSON parse error: {e}')
                        print(f'❌ Failed match: {match}')
                        pass
                
                print(f"🔍 DEBUG: FINAL INTENTS ARRAY: {json.dumps(intents, ensure_ascii=False)}")
                print(f"🔍 DEBUG: INTENTS COUNT: {len(intents)}")
                print("=" * 80)
                
                # Проверяем, есть ли confirm_booking с ЗАПОЛНЕННЫМИ данными
                valid_confirm_booking = False
                for intent in intents:
                    if intent.get('intent') == 'confirm_booking':
                        # Проверяем, что ВСЕ обязательные поля заполнены
                        if all([
                            intent.get('guest_name', '').strip(),
                            intent.get('guest_phone', '').strip(),
                            intent.get('check_in', '').strip(),
                            intent.get('check_out', '').strip(),
                            intent.get('unit_name', '').strip()
                        ]):
                            valid_confirm_booking = True
                            break
                
                telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                
                # Для ВАЛИДНОГО confirm_booking НЕ отправляем ai_reply (только payment_message)
                if not valid_confirm_booking:
                    ai_reply = clean_reply
                    
                    # Если после удаления JSON остался пустой текст, отправляем дефолтное сообщение
                    if not ai_reply or ai_reply.strip() == '':
                        ai_reply = '✅ Понял вас!'
                    
                    conn_save = psycopg2.connect(dsn)
                    cur_save = conn_save.cursor()
                    cur_save.execute(f'''
                        INSERT INTO {schema}.telegram_messages (telegram_id, message_text, sender, created_at)
                        VALUES (%s, %s, %s, NOW())
                    ''', (chat_id, ai_reply, 'bot'))
                    conn_save.commit()
                    cur_save.close()
                    conn_save.close()
                    
                    data = json.dumps({
                        'chat_id': chat_id,
                        'text': ai_reply
                    }).encode('utf-8')
                    
                    req = request.Request(telegram_url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
                    with request.urlopen(req) as response:
                        result = response.read()
                        print(f'AI reply sent to client: {result.decode()}')
                
                if intents:
                    all_bookings = []
                    for intent in intents:
                        # Обработка modify_booking - изменение оплаченной брони
                        if intent.get('intent') == 'modify_booking':
                            requested_changes = intent.get('requested_changes', text)
                            booking_id = intent.get('booking_id')
                            
                            # Получаем данные клиента из истории или текущего чата
                            cur.execute(f'''
                                SELECT guest_name, guest_contact FROM {schema}.pending_bookings
                                WHERE telegram_chat_id = %s
                                ORDER BY created_at DESC LIMIT 1
                            ''', (chat_id,))
                            client_data = cur.fetchone()
                            client_name = client_data[0] if client_data else user_data.get('first_name', 'Неизвестно')
                            client_phone = client_data[1] if client_data else 'Неизвестно'
                            
                            # Создаём заявку на изменение
                            cur.execute(f'''
                                INSERT INTO {schema}.modification_requests 
                                (booking_id, client_name, client_phone, telegram_chat_id, 
                                 message_from_client, requested_changes, status, created_at)
                                VALUES (%s, %s, %s, %s, %s, %s, 'new', NOW())
                                RETURNING id
                            ''', (booking_id, client_name, client_phone, chat_id, text, 
                                  json.dumps({'description': requested_changes}, ensure_ascii=False)))
                            
                            request_id = cur.fetchone()[0]
                            conn.commit()
                            
                            # Уведомляем владельца
                            if owner_telegram_id:
                                owner_notification = json.dumps({
                                    'chat_id': owner_telegram_id,
                                    'text': f'''🔄 Запрос на изменение брони #{request_id}

👤 {client_name}
📞 {client_phone}

💬 Запрос клиента:
{text}

Проверьте заявку в системе.'''
                                }).encode('utf-8')
                                
                                telegram_url_notify = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                                req_owner = request.Request(telegram_url_notify, data=owner_notification, 
                                                          headers={'Content-Type': 'application/json'}, method='POST')
                                try:
                                    with request.urlopen(req_owner) as response:
                                        response.read()
                                except:
                                    pass
                            
                            continue
                        
                        # Обработка show_unit - показ объекта с фото и описанием
                        if intent.get('intent') == 'show_unit':
                            unit_name = intent.get('unit_name', '').strip()
                            cur.execute(f"""
                                SELECT name, description, photo_urls, base_price, max_guests, type
                                FROM {schema}.units
                                WHERE LOWER(name) = LOWER(%s)
                                LIMIT 1
                            """, (unit_name,))
                            unit_data = cur.fetchone()
                            
                            if unit_data:
                                name, desc, photos, price, guests, utype = unit_data
                                
                                # Отправляем фото через sendMediaGroup (если есть)
                                if photos and len(photos) > 0:
                                    media_group = []
                                    for idx, photo_url in enumerate(photos[:3]):
                                        media_item = {
                                            'type': 'photo',
                                            'media': photo_url
                                        }
                                        # Подпись только к первому фото
                                        if idx == 0:
                                            caption_text = f"🏡 {name}\n\n{desc or 'Описание отсутствует'}\n\n👥 До {guests} гостей\n💰 От {price}₽/сутки"
                                            media_item['caption'] = caption_text
                                        media_group.append(media_item)
                                    
                                    media_url = f'https://api.telegram.org/bot{bot_token}/sendMediaGroup'
                                    media_data = json.dumps({
                                        'chat_id': chat_id,
                                        'media': media_group
                                    }).encode('utf-8')
                                    
                                    req_media = request.Request(media_url, data=media_data, headers={'Content-Type': 'application/json'}, method='POST')
                                    with request.urlopen(req_media) as response:
                                        response.read()
                                else:
                                    # Если фото нет - отправляем только текст
                                    text_only = f"🏡 {name}\n\n{desc or 'Описание отсутствует'}\n\n👥 До {guests} гостей\n💰 От {price}₽/сутки"
                                    text_data = json.dumps({
                                        'chat_id': chat_id,
                                        'text': text_only
                                    }).encode('utf-8')
                                    req_text = request.Request(telegram_url, data=text_data, headers={'Content-Type': 'application/json'}, method='POST')
                                    with request.urlopen(req_text) as response:
                                        response.read()
                            continue
                        
                        # Обработка show_map - показ карты
                        if intent.get('intent') == 'show_map':
                            # Берём первый объект с картой (можно улучшить логику)
                            cur.execute(f"""
                                SELECT map_link FROM {schema}.units
                                WHERE map_link IS NOT NULL AND map_link != ''
                                LIMIT 1
                            """)
                            map_data = cur.fetchone()
                            
                            if map_data and map_data[0]:
                                map_text = f"📍 Как добраться:\n{map_data[0]}"
                            else:
                                map_text = "📍 Адрес будет отправлен владельцем после подтверждения бронирования"
                            
                            map_msg_data = json.dumps({
                                'chat_id': chat_id,
                                'text': map_text
                            }).encode('utf-8')
                            req_map = request.Request(telegram_url, data=map_msg_data, headers={'Content-Type': 'application/json'}, method='POST')
                            with request.urlopen(req_map) as response:
                                response.read()
                            continue
                        
                        # Обработка бронирования
                        if intent.get('intent') in ['create_booking', 'confirm_booking']:
                            result = validate_and_create_booking(intent, schema, dsn, chat_id, owner_telegram_id, bot_token, int(owner_id))
                            all_bookings.append({
                                'intent': intent,
                                'result': result
                            })
                    
                    if all_bookings:
                        payment_messages = []
                        total_amount = 0
                        sbp_link = ''
                        recipient_name = ''
                        
                        for booking in all_bookings:
                            intent = booking['intent']
                            result = booking['result']
                            
                            if result['success']:
                                payment_messages.append(f'''✅ {result['unit_name']}
📅 {intent['check_in']} — {intent['check_out']}
💰 {result['amount']}₽''')
                                total_amount += result['amount']
                                sbp_link = result['sbp_link']
                                recipient_name = result['recipient_name']
                            else:
                                payment_messages.append(f'''❌ {result['unit_name']}: {result['error']}''')
                        
                        if total_amount > 0:
                            payment_message = f'''🎉 Бронирование создано!

{chr(10).join(payment_messages)}

💰 Сумма к оплате: {total_amount} ₽
💳 Оплата по СБП

Телефон: {sbp_link}
Получатель: {recipient_name}

📸 После оплаты отправьте скриншот сюда'''
                        else:
                            payment_message = f'''❌ Не удалось создать бронирования:

{chr(10).join(payment_messages)}

Попробуйте выбрать другие даты или объекты.'''
                        
                        # Сохраняем payment_message в БД
                        conn_payment_save = psycopg2.connect(dsn)
                        cur_payment_save = conn_payment_save.cursor()
                        cur_payment_save.execute(f'''
                            INSERT INTO {schema}.telegram_messages (telegram_id, message_text, sender, created_at)
                            VALUES (%s, %s, %s, NOW())
                        ''', (chat_id, payment_message, 'bot'))
                        conn_payment_save.commit()
                        cur_payment_save.close()
                        conn_payment_save.close()
                        
                        payment_data = json.dumps({
                            'chat_id': chat_id,
                            'text': payment_message
                        }).encode('utf-8')
                        
                        req_payment = request.Request(telegram_url, data=payment_data, headers={'Content-Type': 'application/json'}, method='POST')
                        with request.urlopen(req_payment) as response:
                            response.read()
                            print(f'✅ Payment message sent to client')
                        
                        # TERMINAL EVENT: confirm_booking завершён, выходим
                        if valid_confirm_booking:
                            return {
                                'statusCode': 200,
                                'body': json.dumps({'ok': True})
                            }
                
                if False:
                        owner_text = f'''🎉 Новая заявка на бронирование #{pending_id}!

👤 Клиент: {booking_data.get('guest_name')}
📞 Телефон: {booking_data.get('guest_phone')}
📧 Email: {booking_data.get('guest_email', 'не указан')}
📅 Заезд: {booking_data.get('check_in')}
📅 Выезд: {booking_data.get('check_out')}
👥 Гостей: {booking_data.get('guests_count', 1)}

💡 Ожидается оплата от клиента.
Telegram ID: {chat_id}'''
                        
                        owner_data = json.dumps({
                            'chat_id': owner_telegram_id,
                            'text': owner_text
                        }).encode('utf-8')
                        
                        req_owner = request.Request(telegram_url, data=owner_data, headers={'Content-Type': 'application/json'}, method='POST')
                        with request.urlopen(req_owner) as response:
                            response.read()
                            print(f'Owner notification sent to {owner_telegram_id}')
                    
            except Exception as telegram_error:
                print(f'AI/Telegram error: {telegram_error}')
                import traceback
                traceback.print_exc()
                try:
                    bot_token_fallback = os.environ.get('TELEGRAM_BOT_TOKEN')
                    if bot_token_fallback:
                        telegram_url = f'https://api.telegram.org/bot{bot_token_fallback}/sendMessage'
                        fallback_data = json.dumps({
                            'chat_id': chat_id,
                            'text': 'Спасибо за ваше сообщение! Мы получили ваш запрос и скоро свяжемся с вами.'
                        }).encode('utf-8')
                        
                        req = request.Request(telegram_url, data=fallback_data, headers={'Content-Type': 'application/json'}, method='POST')
                        with request.urlopen(req) as response:
                            response.read()
                except:
                    pass
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }