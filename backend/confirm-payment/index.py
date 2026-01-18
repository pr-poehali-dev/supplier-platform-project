import json
import os
import psycopg2
from urllib import request

def handler(event: dict, context) -> dict:
    '''Подтверждение оплаты владельцем и создание бронирования'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
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
        pending_id = body.get('pending_id')
        action = body.get('action')
        
        if not pending_id or action not in ['confirm', 'reject']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'pending_id и action (confirm/reject) обязательны'})
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
        
        cur.execute(f'''
            SELECT id, unit_id, check_in, check_out, guest_name, guest_contact, 
                   telegram_chat_id, amount, verification_status
            FROM {schema}.pending_bookings
            WHERE id = %s
        ''', (pending_id,))
        
        pending = cur.fetchone()
        
        if not pending:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Бронирование не найдено'})
            }
        
        _, unit_id, check_in, check_out, guest_name, guest_contact, chat_id, amount, status = pending
        
        if action == 'confirm':
            cur.execute(f'''
                SELECT COUNT(*) FROM {schema}.bookings
                WHERE unit_id = %s 
                  AND status = 'confirmed'
                  AND check_out > %s 
                  AND check_in < %s
            ''', (unit_id, check_in, check_out))
            
            if cur.fetchone()[0] > 0:
                cur.close()
                conn.close()
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Даты уже заняты другим подтверждённым бронированием'})
                }
            
            cur.execute(f'''
                INSERT INTO {schema}.bookings 
                (guest_name, guest_phone, check_in, check_out, guests_count, 
                 total_price, status, source, created_at)
                VALUES (%s, %s, %s, %s, 1, %s, 'confirmed', 'telegram_bot', NOW())
                RETURNING id
            ''', (guest_name, guest_contact, check_in, check_out, amount))
            
            booking_id = cur.fetchone()[0]
            
            cur.execute(f'''
                INSERT INTO {schema}.booking_units (booking_id, unit_id)
                VALUES (%s, %s)
            ''', (booking_id, unit_id))
            
            cur.execute(f'''
                UPDATE {schema}.pending_bookings
                SET verification_status = 'confirmed'
                WHERE id = %s
            ''', (pending_id,))
            
            conn.commit()
            
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
            if bot_token and chat_id:
                telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                message_data = json.dumps({
                    'chat_id': chat_id,
                    'text': f'''🎉 Отлично! Ваша оплата подтверждена!

Бронирование #{booking_id} активировано.
📅 Даты: {check_in} — {check_out}

Ждём вас! До встречи! 🏡'''
                }).encode('utf-8')
                
                req = request.Request(telegram_url, data=message_data, headers={'Content-Type': 'application/json'}, method='POST')
                with request.urlopen(req) as response:
                    response.read()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'booking_id': booking_id,
                    'message': 'Бронирование подтверждено'
                })
            }
        
        else:
            cur.execute(f'''
                UPDATE {schema}.pending_bookings
                SET verification_status = 'rejected'
                WHERE id = %s
            ''', (pending_id,))
            
            conn.commit()
            
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
            if bot_token and chat_id:
                telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                message_data = json.dumps({
                    'chat_id': chat_id,
                    'text': '''К сожалению, оплата не подтверждена. 

Пожалуйста, свяжитесь с владельцем для уточнения деталей.'''
                }).encode('utf-8')
                
                req = request.Request(telegram_url, data=message_data, headers={'Content-Type': 'application/json'}, method='POST')
                with request.urlopen(req) as response:
                    response.read()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Бронирование отклонено'
                })
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }