import json
import os
import psycopg2
import requests

def handler(event: dict, context) -> dict:
    '''
    Массовая рассылка сообщений клиентам через Telegram.
    Отправляет сообщение всем клиентам владельца, у которых есть telegram_chat_id.
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return cors_response()
    
    if method != 'POST':
        return error_response('Only POST method allowed', 405)
    
    headers = event.get('headers', {})
    owner_id = headers.get('X-Owner-Id') or headers.get('x-owner-id')
    
    if not owner_id:
        return error_response('Owner ID required in X-Owner-Id header', 401)
    
    owner_id = int(owner_id)
    
    body = json.loads(event.get('body', '{}'))
    message_text = body.get('text', '').strip()
    audience = body.get('audience', 'all')  # all | with_bookings | past_guests
    
    if not message_text:
        return error_response('Message text is required', 400)
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        # Получаем telegram_owner_id и bot_token владельца
        cur.execute(f"""
            SELECT telegram_owner_id
            FROM bot_settings
            WHERE owner_id = {owner_id}
        """)
        
        settings_row = cur.fetchone()
        if not settings_row or not settings_row[0]:
            return error_response('Telegram bot not configured', 400)
        
        telegram_owner_id = settings_row[0]
        
        # Получаем bot_token
        cur.execute(f"""
            SELECT bot_token
            FROM users
            WHERE id = {owner_id}
        """)
        
        user_row = cur.fetchone()
        if not user_row or not user_row[0]:
            return error_response('Bot token not found', 400)
        
        bot_token = user_row[0]
        
        # Получаем список клиентов в зависимости от аудитории
        if audience == 'all':
            # Все клиенты владельца с telegram_id
            cur.execute(f"""
                SELECT DISTINCT telegram_id, name
                FROM customers
                WHERE owner_id = {owner_id} AND telegram_id IS NOT NULL
            """)
        elif audience == 'with_bookings':
            # Клиенты с активными бронированиями
            cur.execute(f"""
                SELECT DISTINCT c.telegram_id, c.name
                FROM customers c
                JOIN bookings b ON b.guest_phone = c.phone OR b.guest_name = c.name
                JOIN units u ON b.unit_id = u.id
                WHERE u.owner_id = {owner_id}
                AND c.telegram_id IS NOT NULL
                AND b.check_in >= CURRENT_DATE
                AND b.status = 'confirmed'
            """)
        elif audience == 'past_guests':
            # Клиенты с прошлыми бронированиями
            cur.execute(f"""
                SELECT DISTINCT c.telegram_id, c.name
                FROM customers c
                WHERE owner_id = {owner_id}
                AND c.telegram_id IS NOT NULL
                AND c.total_bookings > 0
            """)
        else:
            return error_response('Invalid audience type', 400)
        
        customers = cur.fetchall()
        
        if not customers:
            return success_response({
                'sent': 0,
                'failed': 0,
                'message': 'No customers found for selected audience'
            })
        
        # Отправляем сообщения
        sent_count = 0
        failed_count = 0
        
        for telegram_id, name in customers:
            try:
                url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                payload = {
                    'chat_id': telegram_id,
                    'text': message_text,
                    'parse_mode': 'HTML'
                }
                
                response = requests.post(url, json=payload, timeout=10)
                
                if response.status_code == 200:
                    sent_count += 1
                else:
                    failed_count += 1
            except:
                failed_count += 1
        
        conn.commit()
        
        return success_response({
            'sent': sent_count,
            'failed': failed_count,
            'total': len(customers),
            'message': f'Broadcast completed: {sent_count} sent, {failed_count} failed'
        })
        
    except Exception as e:
        conn.rollback()
        return error_response(str(e), 500)
    finally:
        cur.close()
        conn.close()


def cors_response():
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id',
            'Access-Control-Max-Age': '86400'
        },
        'body': '',
        'isBase64Encoded': False
    }


def success_response(data: dict):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, ensure_ascii=False),
        'isBase64Encoded': False
    }


def error_response(message: str, status: int):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}, ensure_ascii=False),
        'isBase64Encoded': False
    }
