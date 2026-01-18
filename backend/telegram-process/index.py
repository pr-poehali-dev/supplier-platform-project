import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''Обрабатывает новые сообщения из БД и отправляет уведомления владельцам'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
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
            SELECT id, telegram_id, message_text, sender
            FROM {schema}.telegram_messages 
            WHERE sender = 'user'
            ORDER BY created_at DESC 
            LIMIT 10
        ''')
        
        messages = cur.fetchall()
        processed_ids = []
        
        for msg_id, telegram_id, text, sender in messages:
            processed_ids.append(msg_id)
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'processed': len(processed_ids),
                'message_ids': processed_ids
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }