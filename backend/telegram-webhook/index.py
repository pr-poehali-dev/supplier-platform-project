import json
import os
import psycopg2
from datetime import datetime
import requests

DB_SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def tbl(name):
    return f'{DB_SCHEMA}.{name}'

def send_message(chat_id, text):
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    requests.post(f'https://api.telegram.org/bot{token}/sendMessage', 
                 json={'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'})

def handler(event: dict, context) -> dict:
    '''Telegram webhook - обработка сообщений бота'''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': '', 'isBase64Encoded': False}
    
    update = json.loads(event.get('body', '{}'))
    if 'message' not in update:
        return {'statusCode': 200, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
    
    msg = update['message']
    chat_id = msg['chat']['id']
    text = msg.get('text', '')
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    # /start owner_123 - подключение уведомлений владельца
    if text.startswith('/start owner_'):
        owner_id = int(text.split('_')[1])
        cur.execute(f"INSERT INTO {tbl('conversations')} (owner_id, channel, channel_user_id, status) VALUES ({owner_id}, 'telegram', '{chat_id}', 'owner') ON CONFLICT DO NOTHING")
        conn.commit()
        send_message(chat_id, '✅ Уведомления подключены!')
        return {'statusCode': 200, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
    
    # /start 123 - клиент начинает диалог с турбазой #123
    if text.startswith('/start '):
        owner_id = int(text.split()[1])
        cur.execute(f"SELECT id FROM {tbl('conversations')} WHERE channel='telegram' AND channel_user_id='{chat_id}'")
        if cur.fetchone():
            cur.execute(f"UPDATE {tbl('conversations')} SET user_id={owner_id}, status='active' WHERE channel='telegram' AND channel_user_id='{chat_id}'")
        else:
            cur.execute(f"INSERT INTO {tbl('conversations')} (user_id, channel, channel_user_id, status) VALUES ({owner_id}, 'telegram', '{chat_id}', 'active')")
        conn.commit()
        send_message(chat_id, f'👋 Здравствуйте! Чем могу помочь?')
        return {'statusCode': 200, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
    
    # Обычное сообщение - сохраняем и отвечаем
    cur.execute(f"INSERT INTO {tbl('telegram_messages')} (telegram_id, message, sender, created_at) VALUES ({chat_id}, '{text.replace(\"'\", \"''\")}', 'user', '{datetime.now().isoformat()}')")
    conn.commit()
    send_message(chat_id, 'Сообщение получено, обрабатываю...')
    
    cur.close()
    conn.close()
    return {'statusCode': 200, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
