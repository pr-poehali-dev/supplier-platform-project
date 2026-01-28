"""Отмена подписки (отвязка карты)."""
import json
import os
import base64
from datetime import datetime

import psycopg2


# =============================================================================
# CONSTANTS
# =============================================================================

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
    'Content-Type': 'application/json'
}


# =============================================================================
# DATABASE
# =============================================================================

def get_connection():
    """Get database connection."""
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    """Get database schema prefix."""
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


# =============================================================================
# HANDLER
# =============================================================================

def handler(event, context):
    """
    Отмена подписки пользователя.
    
    Действия:
    - Помечает payment_method как неактивный
    - Устанавливает cancel_at_period_end = true (подписка закончится в конце периода)
    - НЕ отправляет запросы в ЮKassa (отвязка происходит локально)
    """
    
    # CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    # Parse body
    body = event.get('body', '{}')
    if not body or body.strip() == '':
        body = '{}'
    
    if event.get('isBase64Encoded'):
        body = base64.b64decode(body).decode('utf-8')

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Invalid JSON'})
        }

    subscription_id = data.get('subscription_id')
    if not subscription_id:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'subscription_id is required'})
        }

    # Extract auth token
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    if not auth_header:
        return {
            'statusCode': 401,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Unauthorized'})
        }

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()
        now = datetime.utcnow()

        # TODO: Extract user_id from JWT token
        user_id = 1

        # Find subscription
        cur.execute(f"""
            SELECT id, payment_method_id, status, current_period_end
            FROM {S}subscriptions
            WHERE id = %s AND user_id = %s
        """, (subscription_id, user_id))

        sub = cur.fetchone()
        if not sub:
            conn.close()
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Subscription not found'})
            }

        _, payment_method_id, status, period_end = sub

        if status in ('canceled', 'expired'):
            conn.close()
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Subscription already canceled'})
            }

        # Deactivate payment method (отвязка карты)
        if payment_method_id:
            cur.execute(f"""
                UPDATE {S}payment_methods
                SET is_active = false, deactivated_at = %s
                WHERE id = %s
            """, (now, payment_method_id))

        # Mark subscription as cancel_at_period_end
        cur.execute(f"""
            UPDATE {S}subscriptions
            SET cancel_at_period_end = true, cancelled_at = %s
            WHERE id = %s
        """, (now, subscription_id))

        conn.commit()
        conn.close()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'message': 'Subscription will be canceled at period end',
                'period_end': period_end.isoformat() if period_end else None
            })
        }

    except Exception as e:
        conn.rollback()
        conn.close()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }