import json
import os
import psycopg2
from urllib import request

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
        
        dsn = os.environ.get('DATABASE_URL')
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
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
                    SELECT telegram_owner_id FROM {schema}.bot_settings LIMIT 1
                ''')
                owner_result = cur.fetchone()
                owner_telegram_id = owner_result[0] if owner_result and owner_result[0] else None
                
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
            SELECT telegram_owner_id FROM {schema}.bot_settings LIMIT 1
        ''')
        owner_result = cur.fetchone()
        owner_telegram_id = owner_result[0] if owner_result and owner_result[0] else None
        
        cur.close()
        conn.close()
        
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        chatgpt_api_key = os.environ.get('POLZA_AI_API_KEY')
        
        if bot_token and chatgpt_api_key:
            try:
                conn_context = psycopg2.connect(dsn)
                cur_context = conn_context.cursor()
                
                cur_context.execute(f'''
                    SELECT id, name, type, base_price, max_guests, description
                    FROM {schema}.units
                    ORDER BY name
                ''')
                units = cur_context.fetchall()
                
                cur_context.execute(f'''
                    SELECT name, description, price, category
                    FROM {schema}.additional_services
                    WHERE enabled = true
                    ORDER BY category, name
                ''')
                services = cur_context.fetchall()
                
                cur_context.execute(f'''
                    SELECT b.check_in, b.check_out, u.name as unit_name
                    FROM {schema}.bookings b
                    LEFT JOIN {schema}.booking_units bu ON b.id = bu.booking_id
                    LEFT JOIN {schema}.units u ON bu.unit_id = u.id
                    WHERE b.status IN ('confirmed', 'pending')
                    AND b.check_out >= CURRENT_DATE
                    ORDER BY b.check_in
                ''')
                existing_bookings = cur_context.fetchall()
                
                cur_context.close()
                conn_context.close()
                
                units_text = '\n'.join([f"- {u[1]} ({u[2]}): {u[3]}₽/сутки, до {u[4]} гостей. {u[5] or ''}" for u in units])
                services_text = '\n'.join([f"- {s[0]} ({s[3]}): {s[2]}₽. {s[1] or ''}" for s in services]) if services else 'Пока не добавлено'
                bookings_text = '\n'.join([f"- {b[2] or 'Объект'}: {b[0]} - {b[1]}" for b in existing_bookings[:10]]) if existing_bookings else 'Нет активных бронирований'
                
                system_prompt = f'''Ты - ассистент по бронированию турбазы. Сегодня: 2026-01-18.

ДОСТУПНЫЕ ОБЪЕКТЫ:
{units_text}

ДОПРОДАЖИ (предлагай клиентам):
{services_text}

ТЕКУЩИЕ БРОНИРОВАНИЯ (проверяй занятость):
{bookings_text}

ТВОЯ ЗАДАЧА:
1. Вежливо общаться с клиентом
2. Предлагать ТОЛЬКО реальные объекты из списка выше
3. Проверять занятость по календарю бронирований
4. Предлагать допродажи из списка (завтраки, экскурсии и т.д.)
5. Собирать данные: даты (check_in, check_out), кол-во гостей, имя, телефон, email
6. Когда все данные собраны, в конце ответа добавь JSON:
   {{"booking_ready": true, "guest_name": "Иван", "guest_phone": "+79001234567", "guest_email": "ivan@mail.ru", "check_in": "2026-02-01", "check_out": "2026-02-05", "guests_count": 2, "unit_id": 1}}
7. Если данных недостаточно - продолжай диалог, не добавляй JSON

ВАЖНО: Используй только реальные объекты и цены из списка!'''
                
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
                
                booking_data = None
                if '{"booking_ready": true' in ai_reply:
                    try:
                        json_start = ai_reply.find('{"booking_ready"')
                        json_str = ai_reply[json_start:ai_reply.find('}', json_start) + 1]
                        booking_data = json.loads(json_str)
                        ai_reply = ai_reply[:json_start].strip()
                    except:
                        pass
                
                conn_save = psycopg2.connect(dsn)
                cur_save = conn_save.cursor()
                cur_save.execute(f'''
                    INSERT INTO {schema}.telegram_messages (telegram_id, message_text, sender, created_at)
                    VALUES (%s, %s, %s, NOW())
                ''', (chat_id, ai_reply, 'bot'))
                conn_save.commit()
                cur_save.close()
                conn_save.close()
                
                telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                data = json.dumps({
                    'chat_id': chat_id,
                    'text': ai_reply
                }).encode('utf-8')
                
                req = request.Request(telegram_url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
                with request.urlopen(req) as response:
                    result = response.read()
                    print(f'AI reply sent to client: {result.decode()}')
                
                if booking_data and booking_data.get('booking_ready'):
                    dsn = os.environ.get('DATABASE_URL')
                    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
                    conn = psycopg2.connect(dsn)
                    cur = conn.cursor()
                    
                    cur.execute(f'''
                        SELECT sbp_payment_link, sbp_recipient_name 
                        FROM {schema}.users 
                        WHERE is_admin = true 
                        LIMIT 1
                    ''')
                    payment_info = cur.fetchone()
                    sbp_link = payment_info[0] if payment_info and payment_info[0] else None
                    recipient_name = payment_info[1] if payment_info and payment_info[1] else 'Владелец'
                    
                    unit_id = booking_data.get('unit_id', 1)
                    
                    cur.execute(f'''
                        INSERT INTO {schema}.pending_bookings 
                        (unit_id, check_in, check_out, guest_name, guest_contact, telegram_chat_id, 
                         amount, payment_link, verification_status, created_at, expires_at)
                        VALUES (%s, %s, %s, %s, %s, %s, 0, %s, 'pending', NOW(), NOW() + INTERVAL '24 hours')
                        RETURNING id
                    ''', (
                        unit_id,
                        booking_data.get('check_in'),
                        booking_data.get('check_out'),
                        booking_data.get('guest_name'),
                        booking_data.get('guest_phone'),
                        chat_id,
                        sbp_link or 'Ссылка на оплату не настроена'
                    ))
                    
                    pending_id = cur.fetchone()[0]
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    print(f'Pending booking created: {pending_id}')
                    
                    if sbp_link:
                        payment_message = f'''✅ Отлично! Ваше бронирование почти готово.

📋 Детали:
• Даты: {booking_data.get('check_in')} — {booking_data.get('check_out')}
• Гостей: {booking_data.get('guests_count', 1)}

💳 Для завершения бронирования, пожалуйста:
1. Оплатите по ссылке: {sbp_link}
   Получатель: {recipient_name}
2. Отправьте скриншот оплаты сюда, в чат

После подтверждения владельцем ваше бронирование будет активировано! 🎉'''
                    else:
                        payment_message = f'''✅ Отлично! Ваше бронирование почти готово.

📋 Детали:
• Даты: {booking_data.get('check_in')} — {booking_data.get('check_out')}
• Гостей: {booking_data.get('guests_count', 1)}

Владелец свяжется с вами для уточнения деталей оплаты.'''
                    
                    payment_data = json.dumps({
                        'chat_id': chat_id,
                        'text': payment_message
                    }).encode('utf-8')
                    
                    req_payment = request.Request(telegram_url, data=payment_data, headers={'Content-Type': 'application/json'}, method='POST')
                    with request.urlopen(req_payment) as response:
                        response.read()
                    
                    if owner_telegram_id:
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
                try:
                    telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                    fallback_data = json.dumps({
                        'chat_id': chat_id,
                        'text': 'Спасибо за ваше сообщение! Мы получили ваш запрос и скоро свяжемся с вами.'
                    }).encode('utf-8')
                    
                    req = request.Request(telegram_url, data=fallback_data, headers={'Content-Type': 'application/json'}, method='POST')
                    with request.urlopen(req) as response:
                        response.read()
                except:
                    pass
        
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