import json
import os
import urllib.request
import psycopg2

def handler(event: dict, context) -> dict:
    '''
    Автоматическая настройка Telegram webhook.
    Сохраняет токен бота в БД и устанавливает webhook.
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            bot_token = body.get('bot_token', '').strip()
            
            if not bot_token:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Bot token required'}),
                    'isBase64Encoded': False
                }
            
            # Сохранить токен в БД
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            cur.execute(f"""
                INSERT INTO {schema}.bot_settings (owner_id, telegram_bot_token)
                VALUES (%s, %s)
                ON CONFLICT (owner_id) DO UPDATE 
                SET telegram_bot_token = EXCLUDED.telegram_bot_token,
                    updated_at = CURRENT_TIMESTAMP
            """, (user_id, bot_token))
            
            conn.commit()
            cur.close()
            conn.close()
            
            # Настроить webhook с уникальным URL для каждого владельца
            webhook_url = f'https://functions.poehali.dev/c57cc120-80f9-4380-9cdf-6986439d814d?owner_id={user_id}'
            
            url = f'https://api.telegram.org/bot{bot_token}/setWebhook'
            data = json.dumps({'url': webhook_url}).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            # Получить информацию о боте
            url_me = f'https://api.telegram.org/bot{bot_token}/getMe'
            req_me = urllib.request.Request(url_me)
            
            with urllib.request.urlopen(req_me) as response:
                bot_info = json.loads(response.read().decode('utf-8'))
            
            bot_id = bot_info.get('result', {}).get('id')
            bot_username = bot_info.get('result', {}).get('username', '')
            
            # Обновить bot_id в БД
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            cur.execute(f"""
                UPDATE {schema}.bot_settings 
                SET bot_id = %s, updated_at = CURRENT_TIMESTAMP
                WHERE owner_id = %s
            """, (bot_id, user_id))
            
            conn.commit()
            cur.close()
            conn.close()
            
            print(f"[telegram-setup] Bot configured: bot_id={bot_id}, username={bot_username}, owner_id={user_id}")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': result.get('ok', False),
                    'bot_username': bot_username,
                    'bot_id': bot_id,
                    'webhook_url': webhook_url
                }),
                'isBase64Encoded': False
            }
            
        except urllib.error.HTTPError as e:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный токен бота'}),
                'isBase64Encoded': False
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    else:
        # GET - получить текущие настройки
        try:
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            cur.execute(f"""
                SELECT telegram_bot_token FROM {schema}.bot_settings
                WHERE owner_id = %s
            """, (user_id,))
            
            result = cur.fetchone()
            cur.close()
            conn.close()
            
            if result and result[0]:
                bot_token = result[0]
                
                # Проверить статус webhook
                url_info = f'https://api.telegram.org/bot{bot_token}/getWebhookInfo'
                req_info = urllib.request.Request(url_info)
                
                with urllib.request.urlopen(req_info) as response:
                    webhook_info = json.loads(response.read().decode('utf-8'))
                
                url_me = f'https://api.telegram.org/bot{bot_token}/getMe'
                req_me = urllib.request.Request(url_me)
                
                with urllib.request.urlopen(req_me) as response:
                    bot_info = json.loads(response.read().decode('utf-8'))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'has_token': True,
                        'bot_username': bot_info.get('result', {}).get('username', ''),
                        'webhook_info': webhook_info.get('result', {})
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'has_token': False}),
                    'isBase64Encoded': False
                }
                
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }