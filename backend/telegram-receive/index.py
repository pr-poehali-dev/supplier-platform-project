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
        
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        chatgpt_api_key = os.environ.get('POLZA_AI_API_KEY')
        
        if bot_token and chatgpt_api_key:
            try:
                chatgpt_url = 'https://api.polza-ai.ru/v1/chat/completions'
                chatgpt_data = json.dumps({
                    'model': 'gpt-4o-mini',
                    'messages': [
                        {'role': 'system', 'content': 'Ты - ассистент туристического агентства. Помогаешь клиентам с бронированием туров, отвечаешь на вопросы о турах, ценах, доступности. Будь вежливым и профессиональным.'},
                        {'role': 'user', 'content': text}
                    ],
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
                
                telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
                data = json.dumps({
                    'chat_id': chat_id,
                    'text': ai_reply
                }).encode('utf-8')
                
                req = request.Request(telegram_url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
                with request.urlopen(req) as response:
                    result = response.read()
                    print(f'AI reply sent to client: {result.decode()}')
                    
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