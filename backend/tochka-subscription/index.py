import json
import os
import uuid
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def handler(event: dict, context) -> dict:
    '''API для создания подписки через Точка Банк'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    if method == 'POST':
        try:
            body_str = event.get('body', '{}')
            if not body_str or body_str == '':
                body_str = '{}'
            
            body = json.loads(body_str)
            plan_code = body.get('plan_code')
            
            headers = event.get('headers', {})
            user_id = headers.get('x-user-id') or headers.get('X-User-Id')

            if not plan_code:
                return error_response(400, 'Не указан тариф')
            
            if not user_id:
                return error_response(401, 'Требуется авторизация')

            plan_amounts = {
                'start': 2450,
                'pro': 4490,
                'business': 7490
            }

            plan_names = {
                'start': 'START',
                'pro': 'PRO',
                'business': 'BUSINESS'
            }

            if plan_code not in plan_amounts:
                return error_response(400, 'Неверный тариф')

            amount = plan_amounts[plan_code]
            plan_name = plan_names[plan_code]
            purpose = f'Подписка TourConnect — {plan_name}'

            # Шаг 1: Получаем access_token через OAuth 2.0 (client_credentials)
            token_response = requests.post(
                'https://enter.tochka.com/connect/token',
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                data={
                    'client_id': os.environ['TOCHKA_CLIENT_ID'],
                    'client_secret': os.environ['TOCHKA_CLIENT_SECRET'],
                    'grant_type': 'client_credentials',
                    'scope': 'accounts balances customers statements sbp payments acquiring'
                }
            )
            
            if token_response.status_code != 200:
                return error_response(500, f'Ошибка получения токена Точка Банк: {token_response.text}')
            
            access_token = token_response.json()['access_token']

            # Шаг 2: Создаём consent (разрешение) для подписки
            consent_response = requests.post(
                'https://enter.tochka.com/uapi/v1.0/consents',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                },
                json={
                    'Data': {
                        'permissions': [
                            'MakeAcquiringOperation',
                            'ReadAcquiringData',
                            'ManageWebhookData'
                        ]
                    }
                }
            )
            
            if consent_response.status_code != 200:
                return error_response(500, f'Ошибка создания consent: {consent_response.text}')
            
            consent_id = consent_response.json()['Data']['consentId']

            # Шаг 3: Формируем redirect_uri для возврата пользователя
            subscription_id = str(uuid.uuid4())
            callback_url = 'https://functions.poehali.dev/83c679fe-d952-4080-902a-14548ff7da79'

            # Шаг 4: Формируем URL для подтверждения пользователем
            # ВАЖНО: Точка Банк требует, чтобы пользователь подтвердил consent через OAuth authorize
            state = subscription_id
            authorize_url = (
                f'https://enter.tochka.com/connect/authorize'
                f'?client_id={os.environ["TOCHKA_CLIENT_ID"]}'
                f'&response_type=code'
                f'&state={state}'
                f'&redirect_uri={callback_url}'
                f'&scope=accounts%20balances%20customers%20statements%20sbp%20payments%20acquiring'
                f'&consent_id={consent_id}'
            )

            payment_url = authorize_url

            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor(cursor_factory=RealDictCursor)

            schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
            cur.execute(
                f'''
                INSERT INTO {schema}.subscriptions 
                (id, user_id, plan_code, amount, status, tochka_subscription_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''',
                (
                    subscription_id,
                    int(user_id),
                    plan_code,
                    amount,
                    'pending',
                    subscription_id,
                    datetime.utcnow()
                )
            )

            conn.commit()
            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'paymentUrl': payment_url,
                    'subscriptionId': subscription_id,
                    'amount': amount,
                    'purpose': purpose
                })
            }

        except Exception as e:
            return error_response(500, f'Ошибка создания подписки: {str(e)}')

    return error_response(405, 'Метод не поддерживается')


def error_response(status_code: int, message: str) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message})
    }