import json
import os
import psycopg2
import requests
from datetime import datetime, timedelta
import jwt
from urllib.parse import urlencode

def handler(event: dict, context) -> dict:
    '''
    OAuth авторизация через VK, Яндекс и Google.
    Создает пользователя в БД и возвращает JWT токен.
    '''
    method = event.get('httpMethod', 'GET')
    path = event.get('requestContext', {}).get('http', {}).get('path', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if '/vk' in path:
        return handle_vk_auth(event)
    elif '/yandex' in path:
        return handle_yandex_auth(event)
    elif '/google' in path:
        return handle_google_auth(event)
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Provider not found'}),
        'isBase64Encoded': False
    }


def handle_vk_auth(event: dict) -> dict:
    query_params = event.get('queryStringParameters', {}) or {}
    code = query_params.get('code')
    redirect_uri = query_params.get('redirect_uri')
    
    if not code:
        vk_client_id = os.environ.get('VK_CLIENT_ID')
        auth_url = f"https://oauth.vk.com/authorize?{urlencode({
            'client_id': vk_client_id,
            'redirect_uri': redirect_uri,
            'display': 'page',
            'scope': 'email',
            'response_type': 'code',
            'v': '5.131'
        })}"
        return {
            'statusCode': 302,
            'headers': {'Location': auth_url, 'Access-Control-Allow-Origin': '*'},
            'body': '',
            'isBase64Encoded': False
        }
    
    vk_client_id = os.environ.get('VK_CLIENT_ID')
    vk_client_secret = os.environ.get('VK_CLIENT_SECRET')
    
    token_response = requests.post('https://oauth.vk.com/access_token', params={
        'client_id': vk_client_id,
        'client_secret': vk_client_secret,
        'redirect_uri': redirect_uri,
        'code': code
    }, timeout=10)
    
    token_data = token_response.json()
    
    if 'access_token' not in token_data:
        return create_error_redirect(redirect_uri, 'VK auth failed')
    
    access_token = token_data['access_token']
    user_id = token_data.get('user_id')
    email = token_data.get('email', f'vk_{user_id}@vk.com')
    
    user_response = requests.get('https://api.vk.com/method/users.get', params={
        'user_ids': user_id,
        'fields': 'photo_200',
        'access_token': access_token,
        'v': '5.131'
    }, timeout=10)
    
    user_data = user_response.json().get('response', [{}])[0]
    full_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
    avatar_url = user_data.get('photo_200')
    
    user = save_or_update_user(email, full_name, 'vk', str(user_id), avatar_url)
    jwt_token = create_jwt_token(user['id'], user['email'])
    
    telegram_link = os.environ.get('TELEGRAM_INVITE_LINK', '')
    callback_url = f"{redirect_uri}?token={jwt_token}"
    if telegram_link and not user.get('telegram_invited'):
        callback_url += f"&telegram_invite={telegram_link}"
    
    return {
        'statusCode': 302,
        'headers': {'Location': callback_url, 'Access-Control-Allow-Origin': '*'},
        'body': '',
        'isBase64Encoded': False
    }


def handle_yandex_auth(event: dict) -> dict:
    query_params = event.get('queryStringParameters', {}) or {}
    code = query_params.get('code')
    redirect_uri = query_params.get('redirect_uri')
    
    if not code:
        yandex_client_id = os.environ.get('YANDEX_CLIENT_ID')
        auth_url = f"https://oauth.yandex.ru/authorize?{urlencode({
            'client_id': yandex_client_id,
            'response_type': 'code',
            'redirect_uri': redirect_uri
        })}"
        return {
            'statusCode': 302,
            'headers': {'Location': auth_url, 'Access-Control-Allow-Origin': '*'},
            'body': '',
            'isBase64Encoded': False
        }
    
    yandex_client_id = os.environ.get('YANDEX_CLIENT_ID')
    yandex_client_secret = os.environ.get('YANDEX_CLIENT_SECRET')
    
    token_response = requests.post('https://oauth.yandex.ru/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': yandex_client_id,
        'client_secret': yandex_client_secret
    }, timeout=10)
    
    token_data = token_response.json()
    
    if 'access_token' not in token_data:
        return create_error_redirect(redirect_uri, 'Yandex auth failed')
    
    access_token = token_data['access_token']
    
    user_response = requests.get('https://login.yandex.ru/info', headers={
        'Authorization': f'OAuth {access_token}'
    }, timeout=10)
    
    user_data = user_response.json()
    user_id = user_data.get('id')
    email = user_data.get('default_email', f'yandex_{user_id}@yandex.ru')
    full_name = user_data.get('display_name', user_data.get('real_name', ''))
    avatar_url = f"https://avatars.yandex.net/get-yapic/{user_data.get('default_avatar_id', '')}/islands-200" if user_data.get('default_avatar_id') else None
    
    user = save_or_update_user(email, full_name, 'yandex', str(user_id), avatar_url)
    jwt_token = create_jwt_token(user['id'], user['email'])
    
    telegram_link = os.environ.get('TELEGRAM_INVITE_LINK', '')
    callback_url = f"{redirect_uri}?token={jwt_token}"
    if telegram_link and not user.get('telegram_invited'):
        callback_url += f"&telegram_invite={telegram_link}"
    
    return {
        'statusCode': 302,
        'headers': {'Location': callback_url, 'Access-Control-Allow-Origin': '*'},
        'body': '',
        'isBase64Encoded': False
    }


def handle_google_auth(event: dict) -> dict:
    query_params = event.get('queryStringParameters', {}) or {}
    code = query_params.get('code')
    redirect_uri = query_params.get('redirect_uri')
    
    if not code:
        google_client_id = os.environ.get('GOOGLE_CLIENT_ID')
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode({
            'client_id': google_client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'openid email profile'
        })}"
        return {
            'statusCode': 302,
            'headers': {'Location': auth_url, 'Access-Control-Allow-Origin': '*'},
            'body': '',
            'isBase64Encoded': False
        }
    
    google_client_id = os.environ.get('GOOGLE_CLIENT_ID')
    google_client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    
    token_response = requests.post('https://oauth2.googleapis.com/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': google_client_id,
        'client_secret': google_client_secret,
        'redirect_uri': redirect_uri
    }, timeout=10)
    
    token_data = token_response.json()
    
    if 'access_token' not in token_data:
        return create_error_redirect(redirect_uri, 'Google auth failed')
    
    access_token = token_data['access_token']
    
    user_response = requests.get('https://www.googleapis.com/oauth2/v2/userinfo', headers={
        'Authorization': f'Bearer {access_token}'
    }, timeout=10)
    
    user_data = user_response.json()
    user_id = user_data.get('id')
    email = user_data.get('email')
    full_name = user_data.get('name', '')
    avatar_url = user_data.get('picture')
    
    user = save_or_update_user(email, full_name, 'google', str(user_id), avatar_url)
    jwt_token = create_jwt_token(user['id'], user['email'])
    
    telegram_link = os.environ.get('TELEGRAM_INVITE_LINK', '')
    callback_url = f"{redirect_uri}?token={jwt_token}"
    if telegram_link and not user.get('telegram_invited'):
        callback_url += f"&telegram_invite={telegram_link}"
    
    return {
        'statusCode': 302,
        'headers': {'Location': callback_url, 'Access-Control-Allow-Origin': '*'},
        'body': '',
        'isBase64Encoded': False
    }


def save_or_update_user(email: str, full_name: str, provider: str, provider_id: str, avatar_url: str = None) -> dict:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO users (email, full_name, provider, provider_id, avatar_url, last_login)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (provider, provider_id) 
        DO UPDATE SET 
            last_login = EXCLUDED.last_login,
            full_name = EXCLUDED.full_name,
            avatar_url = EXCLUDED.avatar_url
        RETURNING id, email, telegram_invited
    """, (email, full_name, provider, provider_id, avatar_url, datetime.utcnow()))
    
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {'id': user[0], 'email': user[1], 'telegram_invited': user[2]}


def create_jwt_token(user_id: int, email: str) -> str:
    secret = os.environ.get('JWT_SECRET')
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, secret, algorithm='HS256')


def create_error_redirect(redirect_uri: str, error: str) -> dict:
    return {
        'statusCode': 302,
        'headers': {'Location': f"{redirect_uri}?error={error}", 'Access-Control-Allow-Origin': '*'},
        'body': '',
        'isBase64Encoded': False
    }
