import json
import os
import urllib.request

def handler(event: dict, context) -> dict:
    '''
    Автоматическая настройка Telegram webhook.
    Устанавливает webhook для бота и возвращает информацию о боте.
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'TELEGRAM_BOT_TOKEN not found in secrets'}),
            'isBase64Encoded': False
        }
    
    webhook_url = 'https://functions.poehali.dev/c2a7d78f-5e5c-4130-8e7e-2b513f841761'
    
    try:
        if method == 'POST':
            url = f'https://api.telegram.org/bot{token}/setWebhook'
            data = json.dumps({'url': webhook_url}).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            url_info = f'https://api.telegram.org/bot{token}/getWebhookInfo'
            req_info = urllib.request.Request(url_info)
            
            with urllib.request.urlopen(req_info) as response:
                webhook_info = json.loads(response.read().decode('utf-8'))
            
            url_me = f'https://api.telegram.org/bot{token}/getMe'
            req_me = urllib.request.Request(url_me)
            
            with urllib.request.urlopen(req_me) as response:
                bot_info = json.loads(response.read().decode('utf-8'))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': result.get('ok', False),
                    'webhook_set': result.get('result', False),
                    'webhook_url': webhook_url,
                    'webhook_info': webhook_info.get('result', {}),
                    'bot_info': bot_info.get('result', {}),
                    'bot_username': bot_info.get('result', {}).get('username', '')
                }),
                'isBase64Encoded': False
            }
        
        else:
            url_info = f'https://api.telegram.org/bot{token}/getWebhookInfo'
            req_info = urllib.request.Request(url_info)
            
            with urllib.request.urlopen(req_info) as response:
                webhook_info = json.loads(response.read().decode('utf-8'))
            
            url_me = f'https://api.telegram.org/bot{token}/getMe'
            req_me = urllib.request.Request(url_me)
            
            with urllib.request.urlopen(req_me) as response:
                bot_info = json.loads(response.read().decode('utf-8'))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'webhook_info': webhook_info.get('result', {}),
                    'bot_info': bot_info.get('result', {}),
                    'bot_username': bot_info.get('result', {}).get('username', ''),
                    'expected_webhook_url': webhook_url
                }),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
