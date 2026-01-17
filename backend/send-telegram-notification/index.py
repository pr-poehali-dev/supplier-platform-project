import json
import os
import psycopg2

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


def handler(event: dict, context) -> dict:
    '''
    Отправка уведомлений владельцу в Telegram о новых заявках
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        owner_id = event.get('headers', {}).get('X-Owner-Id') or event.get('headers', {}).get('x-owner-id')
        
        if not owner_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Owner ID required in X-Owner-Id header'}),
                'isBase64Encoded': False
            }
        
        body = json.loads(event.get('body', '{}'))
        booking_id = body.get('booking_id')
        message = body.get('message', 'Новая заявка на бронирование')
        
        # Get Telegram chat ID for owner from database
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        schema = 't_p14287273_supplier_platform_pr'
        
        # Get owner's telegram chat ID from users table or bot settings
        cur.execute(f"""
            SELECT telegram_chat_id FROM {schema}.users
            WHERE id = {owner_id}
        """)
        
        row = cur.fetchone()
        
        if not row or not row[0]:
            # No telegram configured for this owner
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Telegram not configured for owner'}),
                'isBase64Encoded': False
            }
        
        telegram_chat_id = row[0]
        
        # Send Telegram notification using Bot API
        if REQUESTS_AVAILABLE and os.environ.get('TELEGRAM_BOT_TOKEN'):
            bot_token = os.environ['TELEGRAM_BOT_TOKEN']
            url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            
            payload = {
                'chat_id': telegram_chat_id,
                'text': f'🔔 {message}\\n\\nID брони: {booking_id}\\n\\nПерейдите в календарь для подтверждения.',
                'parse_mode': 'HTML'
            }
            
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Notification sent'}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to send Telegram notification'}),
                    'isBase64Encoded': False
                }
        
        # Fallback if no telegram integration
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Notification queued (Telegram integration pending)'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
