import json
import os
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from urllib.parse import parse_qs

def handler(event: dict, context) -> dict:
    '''Обработка callback от Точка Банк после авторизации пользователя'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    if method == 'GET':
        try:
            query_params = event.get('queryStringParameters', {})
            code = query_params.get('code')
            state = query_params.get('state')
            
            if not code or not state:
                return redirect_to_frontend(state, 'error', 'Отсутствует код авторизации')

            subscription_id = state

            # Шаг 1: Обмениваем code на access_token
            token_response = requests.post(
                'https://enter.tochka.com/connect/token',
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                data={
                    'client_id': os.environ['TOCHKA_CLIENT_ID'],
                    'client_secret': os.environ['TOCHKA_CLIENT_SECRET'],
                    'grant_type': 'authorization_code',
                    'scope': 'accounts balances customers statements sbp payments acquiring',
                    'code': code,
                    'redirect_uri': 'https://functions.poehali.dev/83c679fe-d952-4080-902a-14548ff7da79'
                }
            )
            
            if token_response.status_code != 200:
                return redirect_to_frontend(subscription_id, 'error', 'Ошибка получения токена')
            
            token_data = token_response.json()
            access_token = token_data['access_token']
            user_id_tochka = token_data.get('user_id')

            # Шаг 2: Получаем данные подписки из БД
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor(cursor_factory=RealDictCursor)
            schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

            cur.execute(
                f'SELECT * FROM {schema}.subscriptions WHERE id = %s',
                (subscription_id,)
            )
            subscription = cur.fetchone()

            if not subscription:
                cur.close()
                conn.close()
                return redirect_to_frontend(subscription_id, 'error', 'Подписка не найдена')

            # Шаг 3: Активируем подписку
            next_charge_date = datetime.utcnow() + timedelta(days=30)
            expires_at = next_charge_date + timedelta(days=3)

            cur.execute(
                f'''
                UPDATE {schema}.subscriptions 
                SET status = %s, 
                    activated_at = %s, 
                    next_charge_date = %s,
                    expires_at = %s,
                    tochka_card_id = %s
                WHERE id = %s
                ''',
                ('active', datetime.utcnow(), next_charge_date, expires_at, user_id_tochka, subscription_id)
            )

            # Шаг 4: Обновляем информацию о подписке пользователя в таблице users
            cur.execute(
                f'''
                UPDATE {schema}.users 
                SET subscription_plan = %s,
                    subscription_expires_at = %s
                WHERE id = %s
                ''',
                (subscription['plan_code'], expires_at, subscription['user_id'])
            )

            conn.commit()
            cur.close()
            conn.close()

            return redirect_to_frontend(subscription_id, 'success', 'Подписка активирована')

        except Exception as e:
            return redirect_to_frontend(None, 'error', f'Ошибка обработки callback: {str(e)}')

    return error_response(405, 'Метод не поддерживается')


def redirect_to_frontend(subscription_id: str, status: str, message: str) -> dict:
    redirect_url = f'https://tourconnect.ru/subscription-status?subscriptionId={subscription_id or "unknown"}&status={status}&message={message}'
    return {
        'statusCode': 302,
        'headers': {
            'Location': redirect_url,
            'Access-Control-Allow-Origin': '*'
        },
        'body': ''
    }


def error_response(status_code: int, message: str) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message})
    }