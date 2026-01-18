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
        
        conn.commit()
        cur.close()
        conn.close()
        
        try:
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
            reply_text = 'Спасибо за ваше сообщение! Мы получили ваш запрос и скоро свяжемся с вами.'
            
            telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            data = json.dumps({
                'chat_id': chat_id,
                'text': reply_text
            }).encode('utf-8')
            
            req = request.Request(telegram_url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
            with request.urlopen(req) as response:
                response.read()
            
            owner_chat_id = os.environ.get('OWNER_TELEGRAM_ID', '760787428')
            owner_text = f'📩 Новое сообщение от клиента\n\nChat ID: {chat_id}\nСообщение: {text}'
            
            owner_data = json.dumps({
                'chat_id': owner_chat_id,
                'text': owner_text
            }).encode('utf-8')
            
            req_owner = request.Request(telegram_url, data=owner_data, headers={'Content-Type': 'application/json'}, method='POST')
            with request.urlopen(req_owner) as response:
                response.read()
        except Exception as telegram_error:
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