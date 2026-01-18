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
        
        dsn = os.environ.get('DATABASE_URL')
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
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
                messages = [
                    {'role': 'system', 'content': '''Ты - ассистент по бронированию туров и отелей. Твоя задача:
1. Вежливо общаться с клиентом
2. Задавать уточняющие вопросы про:
   - Даты поездки (check_in, check_out)
   - Количество гостей (guests_count)
   - Имя клиента (guest_name)
   - Телефон клиента (guest_phone)
   - Email клиента (guest_email, опционально)
3. Когда все данные собраны, в конце ответа добавь JSON:
   {"booking_ready": true, "guest_name": "Иван", "guest_phone": "+79001234567", "guest_email": "ivan@mail.ru", "check_in": "2026-02-01", "check_out": "2026-02-05", "guests_count": 2}
4. Если данных недостаточно - продолжай диалог, не добавляй JSON.'''}
                ]
                
                for msg_text, sender, created in reversed(history):
                    role = 'assistant' if sender == 'bot' else 'user'
                    messages.append({'role': role, 'content': msg_text})
                
                chatgpt_url = 'https://api.polza.ai/api/v1/chat/completions'
                chatgpt_data = json.dumps({
                    'model': 'gpt-4o-mini',
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
                        INSERT INTO {schema}.bookings 
                        (guest_name, guest_phone, guest_email, check_in, check_out, guests_count, 
                         total_price, status, source, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, 0, 'pending', 'telegram_bot', NOW())
                        RETURNING id
                    ''', (
                        booking_data.get('guest_name'),
                        booking_data.get('guest_phone'),
                        booking_data.get('guest_email'),
                        booking_data.get('check_in'),
                        booking_data.get('check_out'),
                        booking_data.get('guests_count', 1)
                    ))
                    
                    booking_id = cur.fetchone()[0]
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    print(f'Booking created: {booking_id}')
                    
                    if owner_telegram_id:
                        owner_text = f'''🎉 Новое бронирование #{booking_id}!

👤 Клиент: {booking_data.get('guest_name')}
📞 Телефон: {booking_data.get('guest_phone')}
📧 Email: {booking_data.get('guest_email', 'не указан')}
📅 Заезд: {booking_data.get('check_in')}
📅 Выезд: {booking_data.get('check_out')}
👥 Гостей: {booking_data.get('guests_count', 1)}

Telegram ID клиента: {chat_id}'''
                        
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