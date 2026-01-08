import json
import os
import psycopg2
from datetime import datetime

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

def handler(event: dict, context) -> dict:
    '''
    Webhook для обработки сообщений от Telegram бота.
    Каждый владелец турбазы имеет свою уникальную ссылку на бота (через start параметр).
    Бот анализирует сообщения клиентов и автоматически создаёт бронирования через AI.
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        update = json.loads(event.get('body', '{}'))
        
        if 'message' not in update:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        message = update['message']
        chat_id = message['chat']['id']
        text = message.get('text', '')
        user_id = message['from']['id']
        username = message['from'].get('username', '')
        first_name = message['from'].get('first_name', 'Гость')
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        owner_id = None
        
        if text.startswith('/start'):
            parts = text.split(' ')
            if len(parts) > 1:
                owner_id = int(parts[1])
                
                cur.execute(f"""
                    SELECT id FROM users WHERE id = {owner_id}
                """)
                
                if cur.fetchone() is None:
                    send_telegram_message(chat_id, '❌ Неверная ссылка. Свяжитесь с владельцем турбазы.')
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
                
                cur.execute(f"""
                    INSERT INTO conversations (user_id, channel, channel_user_id, status)
                    VALUES ({owner_id}, 'telegram', '{chat_id}', 'active')
                    ON CONFLICT (channel, channel_user_id) 
                    DO UPDATE SET user_id = {owner_id}
                    RETURNING id
                """)
                conversation_id = cur.fetchone()[0]
                conn.commit()
                
                send_telegram_message(
                    chat_id,
                    f'👋 Здравствуйте, {first_name}!\n\n'
                    'Я помогу вам забронировать проживание. '
                    'Расскажите, на какие даты планируете приехать и сколько человек?'
                )
                
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        
        cur.execute(f"""
            SELECT id, user_id FROM conversations
            WHERE channel = 'telegram' AND channel_user_id = '{chat_id}'
            AND status = 'active'
        """)
        
        conv = cur.fetchone()
        if not conv:
            send_telegram_message(
                chat_id,
                '❌ Сессия не найдена. Используйте ссылку от владельца турбазы для начала бронирования.'
            )
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        
        conversation_id = conv[0]
        owner_id = conv[1]
        
        cur.execute(f"""
            INSERT INTO messages (conversation_id, role, content)
            VALUES ({conversation_id}, 'user', '{text.replace("'", "''")}')
        """)
        conn.commit()
        
        cur.execute(f"""
            SELECT role, content FROM messages
            WHERE conversation_id = {conversation_id}
            ORDER BY created_at ASC
        """)
        
        messages = [{'role': row[0], 'content': row[1]} for row in cur.fetchall()]
        
        cur.execute(f"""
            SELECT id, name, type, description, base_price, max_guests
            FROM units
            WHERE created_by = {owner_id}
            ORDER BY id
        """)
        
        units_info = []
        for row in cur.fetchall():
            units_info.append({
                'id': row[0],
                'name': row[1],
                'type': row[2],
                'description': row[3],
                'price': float(row[4]),
                'max_guests': row[5]
            })
        
        if not units_info:
            send_telegram_message(chat_id, '❌ У владельца пока нет доступных объектов для бронирования.')
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        
        system_prompt = f"""Ты — менеджер по бронированию турбазы. Твоя задача помочь клиенту забронировать проживание.

Доступные объекты:
{json.dumps(units_info, ensure_ascii=False, indent=2)}

Правила:
1. Будь дружелюбным и профессиональным
2. Узнай даты заезда и выезда (формат: 2026-02-15)
3. Узнай количество гостей
4. Предложи подходящие варианты из списка
5. Назови точную цену (base_price × количество ночей)
6. Для бронирования запроси имя и телефон клиента
7. НИКОГДА не придумывай доступность
8. Когда все данные собраны, отправь JSON:
{{"action": "create_booking", "unit_id": 1, "check_in": "2026-02-15", "check_out": "2026-02-17", "guest_name": "Иван Петров", "guest_phone": "+79991234567", "guests_count": 2}}

Текущая дата: {datetime.now().strftime('%Y-%m-%d')}"""
        
        if not OPENAI_AVAILABLE:
            send_telegram_message(chat_id, '❌ Сервис временно недоступен. Попробуйте позже.')
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        
        client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': system_prompt},
                *messages
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        assistant_message = response.choices[0].message.content
        
        if '"action": "create_booking"' in assistant_message:
            try:
                json_start = assistant_message.find('{')
                json_end = assistant_message.rfind('}') + 1
                booking_data = json.loads(assistant_message[json_start:json_end])
                
                cur.execute(f"""
                    SELECT COUNT(*) FROM bookings
                    WHERE unit_id = {booking_data['unit_id']}
                    AND status IN ('tentative', 'confirmed')
                    AND check_in < '{booking_data['check_out']}'
                    AND check_out > '{booking_data['check_in']}'
                """)
                
                if cur.fetchone()[0] == 0:
                    cur.execute(f"SELECT base_price FROM units WHERE id = {booking_data['unit_id']}")
                    base_price_row = cur.fetchone()
                    
                    if base_price_row:
                        base_price = float(base_price_row[0])
                        
                        check_in = datetime.strptime(booking_data['check_in'], '%Y-%m-%d').date()
                        check_out = datetime.strptime(booking_data['check_out'], '%Y-%m-%d').date()
                        nights = (check_out - check_in).days
                        total_price = base_price * nights
                        
                        cur.execute(f"""
                            INSERT INTO bookings 
                            (unit_id, guest_name, guest_phone, check_in, check_out, 
                             guests_count, total_price, status, source)
                            VALUES ({booking_data['unit_id']}, '{booking_data['guest_name'].replace("'", "''")}', 
                                    '{booking_data.get('guest_phone', '').replace("'", "''")}', '{booking_data['check_in']}', 
                                    '{booking_data['check_out']}', {booking_data.get('guests_count', 1)}, 
                                    {total_price}, 'tentative', 'telegram')
                            RETURNING id
                        """)
                        
                        booking_id = cur.fetchone()[0]
                        
                        cur.execute(f"""
                            INSERT INTO conversation_bookings (conversation_id, booking_id)
                            VALUES ({conversation_id}, {booking_id})
                        """)
                        
                        conn.commit()
                        
                        payment_link = os.environ.get('PAYMENT_LINK', '')
                        payment_text = f'\n\n💳 Оплатите {int(total_price)} руб. по ссылке:\n{payment_link}\n\nПосле оплаты отправьте скриншот чека для подтверждения.' if payment_link else '\n\nВладелец свяжется с вами для подтверждения и оплаты.'
                        
                        assistant_message = (
                            f'✅ Бронирование создано!\n\n'
                            f'📋 Номер брони: {booking_id}\n'
                            f'💰 Стоимость: {int(total_price)} руб. за {nights} ночей{payment_text}'
                        )
                    else:
                        assistant_message = '❌ Объект не найден. Попробуйте выбрать другой вариант.'
                else:
                    assistant_message = '❌ К сожалению, эти даты уже заняты. Могу предложить другие даты?'
            
            except Exception as e:
                assistant_message = f'❌ Ошибка при создании бронирования. Попробуйте ещё раз.'
        
        cur.execute(f"""
            INSERT INTO messages (conversation_id, role, content)
            VALUES ({conversation_id}, 'assistant', '{assistant_message.replace("'", "''")}')
        """)
        conn.commit()
        
        send_telegram_message(chat_id, assistant_message)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def send_telegram_message(chat_id: int, text: str):
    '''Отправляет сообщение в Telegram через Bot API'''
    import urllib.request
    
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token:
        return
    
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    data = json.dumps({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        urllib.request.urlopen(req)
    except Exception as e:
        print(f'Failed to send Telegram message: {e}')