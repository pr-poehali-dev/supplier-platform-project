import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    '''
    API для получения истории переписки клиента с Telegram ботом.
    Возвращает все сообщения для конкретного бронирования.
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        params = event.get('queryStringParameters') or {}
        booking_id = params.get('booking_id')
        user_id = event.get('headers', {}).get('X-User-Id')
        
        if not booking_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'booking_id is required'}),
                'isBase64Encoded': False
            }
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Проверяем, что бронирование принадлежит этому пользователю
        cur.execute(f"""
            SELECT u.created_by
            FROM bookings b
            JOIN units u ON b.unit_id = u.id
            WHERE b.id = {booking_id}
        """)
        
        result = cur.fetchone()
        if not result:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Booking not found'}),
                'isBase64Encoded': False
            }
        
        owner_id = result[0]
        if str(owner_id) != str(user_id):
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied'}),
                'isBase64Encoded': False
            }
        
        # Получаем историю переписки
        cur.execute(f"""
            SELECT 
                id,
                telegram_id,
                message_text,
                sender,
                created_at
            FROM telegram_messages
            WHERE booking_id = {booking_id}
            ORDER BY created_at ASC
        """)
        
        messages = []
        for row in cur.fetchall():
            messages.append({
                'id': row[0],
                'telegram_id': row[1],
                'message_text': row[2],
                'sender': row[3],
                'created_at': row[4].isoformat() if row[4] else None
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'messages': messages,
                'total': len(messages)
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Internal server error'}),
            'isBase64Encoded': False
        }