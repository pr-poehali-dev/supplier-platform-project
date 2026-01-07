import json
import os

def handler(event: dict, context) -> dict:
    '''Тестовая auth функция'''
    
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': '',
            'isBase64Encoded': False
        }
    
    query = event.get('queryStringParameters', {}) or {}
    redirect_uri = query.get('redirect_uri', 'https://preview--supplier-platform-project.poehali.dev/auth/callback')
    
    yandex_id = os.environ.get('YANDEX_CLIENT_ID', 'test')
    auth_url = f"https://oauth.yandex.ru/authorize?client_id={yandex_id}&response_type=code&redirect_uri={redirect_uri}"
    
    return {
        'statusCode': 302,
        'headers': {'Location': auth_url, 'Access-Control-Allow-Origin': '*'},
        'body': '',
        'isBase64Encoded': False
    }
