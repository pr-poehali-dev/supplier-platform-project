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
                return error_response(500, f'Ошибка получения токена: {token_response.text}')
            
            access_token = token_response.json()['access_token']

            # Шаг 2: Создаём подписку через API acquiring
            subscription_id = str(uuid.uuid4())
            redirect_url = f'https://tourconnect.ru/subscription-status?subscriptionId={subscription_id}&status=success'
            fail_redirect_url = f'https://tourconnect.ru/subscription-status?subscriptionId={subscription_id}&status=error'

            create_subscription_response = requests.post(
                'https://enter.tochka.com/uapi/v1.0/acquiring/v1.0/subscriptions',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                },
                json={
                    'Data': {
                        'customerCode': os.environ['TOCHKA_CUSTOMER_CODE'],
                        'amount': float(amount),
                        'purpose': purpose,
                        'redirectUrl': redirect_url,
                        'failRedirectUrl': fail_redirect_url,
                        'saveCard': True,
                        'consumerId': subscription_id,
                        'merchantId': os.environ['TOCHKA_MERCHANT_ID'],
                        'recurring': True,
                        'Options': {
                            'paymentLinkId': subscription_id
                        }
                    }
                }
            )
            
            if create_subscription_response.status_code != 200:
                return error_response(500, f'Ошибка создания подписки: {create_subscription_response.text}')
            
            subscription_data = create_subscription_response.json()['Data']
            payment_url = subscription_data['paymentLink']
            operation_id = subscription_data['operationId']

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
                    operation_id,
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