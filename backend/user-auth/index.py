import json
import os
import urllib.request
import urllib.parse
import psycopg2

def handler(event: dict, context) -> dict:
    '''Полный цикл OAuth авторизации: редирект на Яндекс и обработка callback'''
    
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    query = event.get('queryStringParameters', {}) or {}
    action = query.get('action')
    code = query.get('code')
    
    # Обновление профиля
    if action == 'refresh':
        return refresh_profile(event)
    
    
    # Если есть code - это callback от Яндекса
    if code:
        return handle_callback(code)
    
    # Иначе - инициируем авторизацию
    # ВАЖНО: redirect_uri должен ТОЧНО совпадать с зарегистрированным в Яндекс OAuth
    redirect_uri = 'https://tourconnect.ru/auth/callback'
    yandex_id = os.environ.get('YANDEX_CLIENT_ID')
    
    if not yandex_id:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OAuth not configured'}),
            'isBase64Encoded': False
        }
    
    auth_url = f"https://oauth.yandex.ru/authorize?client_id={yandex_id}&response_type=code&redirect_uri={urllib.parse.quote(redirect_uri, safe='')}"
    
    return {
        'statusCode': 302,
        'headers': {
            'Location': auth_url,
            'Access-Control-Allow-Origin': '*'
        },
        'body': '',
        'isBase64Encoded': False
    }


def handle_callback(code: str) -> dict:
    '''Обрабатывает OAuth callback и сохраняет пользователя в БД'''
    
    client_id = os.environ.get('YANDEX_CLIENT_ID')
    client_secret = os.environ.get('YANDEX_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OAuth not configured'}),
            'isBase64Encoded': False
        }
    
    # Обмен code на access_token
    token_data = urllib.parse.urlencode({
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret
    }).encode()
    
    token_req = urllib.request.Request(
        'https://oauth.yandex.ru/token',
        data=token_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    
    try:
        with urllib.request.urlopen(token_req) as response:
            token_response = json.loads(response.read().decode())
            access_token = token_response.get('access_token')
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Token exchange failed: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    if not access_token:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No access token received'}),
            'isBase64Encoded': False
        }
    
    # Получение данных пользователя
    user_req = urllib.request.Request(
        'https://login.yandex.ru/info?format=json',
        headers={'Authorization': f'OAuth {access_token}'}
    )
    
    try:
        with urllib.request.urlopen(user_req) as response:
            user_data = json.loads(response.read().decode())
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Failed to get user info: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    provider_id = user_data.get('id')
    email = user_data.get('default_email', '')
    full_name = user_data.get('real_name', user_data.get('display_name', ''))
    avatar_url = f"https://avatars.yandex.net/get-yapic/{user_data.get('default_avatar_id')}/islands-200" if user_data.get('default_avatar_id') else None
    
    # Сохранение пользователя в БД
    db_url = os.environ.get('DATABASE_URL')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute(f"""
            INSERT INTO {schema}.users (email, full_name, provider, provider_id, avatar_url, last_login)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (provider, provider_id) 
            DO UPDATE SET 
                last_login = NOW(),
                full_name = EXCLUDED.full_name,
                avatar_url = EXCLUDED.avatar_url
            RETURNING id, email, full_name, avatar_url, is_admin, subscription_plan, subscription_expires_at
        """, (email, full_name, 'yandex', str(provider_id), avatar_url))
        
        user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        user_info = {
            'id': user[0],
            'email': user[1],
            'full_name': user[2],
            'avatar_url': user[3],
            'is_admin': user[4],
            'subscription_plan': user[5],
            'subscription_expires_at': user[6].isoformat() if user[6] else None
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'user': user_info}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Database error: {str(e)}'}),
            'isBase64Encoded': False
        }


def refresh_profile(event: dict) -> dict:
    '''Обновляет данные профиля из базы'''
    headers = event.get('headers', {})
    user_id_header = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id_header:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    try:
        user_id = int(user_id_header)
    except ValueError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid user ID'}),
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute(f"""
            SELECT id, email, full_name, avatar_url, is_admin, 
                   subscription_plan, subscription_expires_at
            FROM {schema}.users
            WHERE id = %s
        """, (user_id,))
        
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        user_info = {
            'id': user[0],
            'email': user[1],
            'full_name': user[2],
            'avatar_url': user[3],
            'is_admin': user[4],
            'subscription_plan': user[5],
            'subscription_expires_at': user[6].isoformat() if user[6] else None
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'user': user_info}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Database error: {str(e)}'}),
            'isBase64Encoded': False
        }