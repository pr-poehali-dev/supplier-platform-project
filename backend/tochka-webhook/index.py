import json
import os
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import hmac
import hashlib

def handler(event: dict, context) -> dict:
    '''Webhook для обработки уведомлений от Точка Банк о рекуррентных платежах'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Signature',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    if method == 'POST':
        try:
            body_str = event.get('body', '{}')
            body = json.loads(body_str)
            
            headers = event.get('headers', {})
            signature = headers.get('x-signature') or headers.get('X-Signature')

            # Проверка подписи (если требуется Точка Банком)
            # expected_signature = hmac.new(
            #     os.environ['TOCHKA_WEBHOOK_SECRET'].encode(),
            #     body_str.encode(),
            #     hashlib.sha256
            # ).hexdigest()
            # 
            # if signature != expected_signature:
            #     return error_response(401, 'Неверная подпись')

            # Структура webhook от Точка Банк (acquiringInternetPayment):
            # { "type": "acquiringInternetPayment", "operationId": "...", "status": "...", "consumerId": "..." }
            webhook_type = body.get('type')
            operation_id = body.get('operationId')
            payment_status = body.get('status')
            consumer_id = body.get('consumerId')

            if not operation_id and not consumer_id:
                return error_response(400, 'Отсутствует operationId или consumerId')

            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor(cursor_factory=RealDictCursor)
            schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

            # Находим подписку по operation_id или consumer_id (= subscription_id)
            if consumer_id:
                cur.execute(
                    f'SELECT * FROM {schema}.subscriptions WHERE id = %s',
                    (consumer_id,)
                )
            else:
                cur.execute(
                    f'SELECT * FROM {schema}.subscriptions WHERE tochka_subscription_id = %s',
                    (operation_id,)
                )
            subscription = cur.fetchone()

            if not subscription:
                cur.close()
                conn.close()
                return error_response(404, 'Подписка не найдена')

            # Обработка успешного платежа
            if payment_status == 'PAID' or payment_status == 'SUCCESS':
                next_charge_date = datetime.utcnow() + timedelta(days=30)
                expires_at = next_charge_date + timedelta(days=3)

                cur.execute(
                    f'''
                    UPDATE {schema}.subscriptions 
                    SET status = %s,
                        next_charge_date = %s,
                        expires_at = %s
                    WHERE id = %s
                    ''',
                    ('active', next_charge_date, expires_at, subscription['id'])
                )

                cur.execute(
                    f'''
                    UPDATE {schema}.users 
                    SET subscription_expires_at = %s
                    WHERE id = %s
                    ''',
                    (expires_at, subscription['user_id'])
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
                    'body': json.dumps({'status': 'ok', 'message': 'Подписка продлена'})
                }

            # Обработка неуспешного платежа
            elif payment_status == 'FAILED' or payment_status == 'ERROR':
                cur.execute(
                    f'''
                    UPDATE {schema}.subscriptions 
                    SET status = %s
                    WHERE id = %s
                    ''',
                    ('expired', subscription['id'])
                )

                cur.execute(
                    f'''
                    UPDATE {schema}.users 
                    SET subscription_plan = %s
                    WHERE id = %s
                    ''',
                    ('free', subscription['user_id'])
                )

                conn.commit()
                cur.close()
                conn.close()

                # TODO: Отправить email пользователю о проблеме с оплатой

                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'status': 'ok', 'message': 'Подписка отменена'})
                }

            # Неизвестный статус
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'status': 'ok', 'message': f'Статус {payment_status} обработан'})
            }

        except Exception as e:
            return error_response(500, f'Ошибка обработки webhook: {str(e)}')

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