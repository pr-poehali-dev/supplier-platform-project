import json
import os
from datetime import datetime, timedelta
import psycopg2

def handler(event: dict, context) -> dict:
    '''Управление подписками пользователей (только для админов)'''
    
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'POST':
        return update_subscription(event)
    elif method == 'GET':
        return get_subscriptions(event)
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }


def update_subscription(event: dict) -> dict:
    '''Обновление подписки пользователя'''
    
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        plan = body.get('plan', 'none')
        months = int(body.get('months', 1))
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id is required'}),
                'isBase64Encoded': False
            }
        
        db_url = os.environ.get('DATABASE_URL')
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Вычисляем дату окончания подписки
        if plan == 'none':
            expires_at = None
            subscription_updated_at = datetime.now()
        else:
            expires_at = datetime.now() + timedelta(days=months * 30)
            subscription_updated_at = datetime.now()
        
        # Обновляем подписку пользователя
        if expires_at:
            cur.execute(f"""
                UPDATE {schema}.users
                SET subscription_plan = %s,
                    subscription_expires_at = %s,
                    subscription_updated_at = %s
                WHERE id = %s
                RETURNING id, email, full_name, subscription_plan, subscription_expires_at
            """, (plan, expires_at, subscription_updated_at, user_id))
        else:
            cur.execute(f"""
                UPDATE {schema}.users
                SET subscription_plan = %s,
                    subscription_expires_at = NULL,
                    subscription_updated_at = %s
                WHERE id = %s
                RETURNING id, email, full_name, subscription_plan, subscription_expires_at
            """, (plan, subscription_updated_at, user_id))
        
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'full_name': user[2],
                    'subscription_plan': user[3],
                    'subscription_expires_at': user[4].isoformat() if user[4] else None
                }
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Database error: {str(e)}'}),
            'isBase64Encoded': False
        }


def get_subscriptions(event: dict) -> dict:
    '''Получение списка пользователей с подписками'''
    
    try:
        db_url = os.environ.get('DATABASE_URL')
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute(f"""
            SELECT id, email, full_name, subscription_plan, subscription_expires_at, subscription_updated_at
            FROM {schema}.users
            ORDER BY subscription_updated_at DESC NULLS LAST, created_at DESC
        """)
        
        users = cur.fetchall()
        cur.close()
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user[0],
                'email': user[1],
                'full_name': user[2],
                'subscription_plan': user[3] or 'none',
                'subscription_expires_at': user[4].isoformat() if user[4] else None,
                'subscription_updated_at': user[5].isoformat() if user[5] else None
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'users': users_list}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Database error: {str(e)}'}),
            'isBase64Encoded': False
        }