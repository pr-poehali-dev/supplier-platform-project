"""Получение данных о подписке пользователя."""
import json
import os
import base64

import psycopg2
from jwt_utils import get_user_id


# =============================================================================
# CONSTANTS
# =============================================================================

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    Получение данных о подписке пользователя.
    
    Возвращает:
    - Информацию о текущей подписке
    - Данные сохранённого способа оплаты (без токена)
    - Историю платежей
    """
    
    # CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if event.get('httpMethod') != 'GET':
        return {
            'statusCode': 405,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    # Extract auth token
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    if not auth_header:
        return {
            'statusCode': 401,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Unauthorized'})
        }

    # Extract user_id from JWT token
    try:
        user_id = get_user_id(auth_header)
    except ValueError as e:
        return {
            'statusCode': 401,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()

        # Get active subscription with payment method
        cur.execute(f"""
            SELECT 
                s.id,
                s.plan_code,
                s.amount,
                s.status,
                s.current_period_start,
                s.current_period_end,
                s.cancel_at_period_end,
                s.activated_at,
                pm.card_type,
                pm.card_last4,
                pm.card_expiry_month,
                pm.card_expiry_year,
                pm.is_active
            FROM {S}subscriptions s
            LEFT JOIN {S}payment_methods pm ON s.payment_method_id = pm.id
            WHERE s.user_id = %s AND s.status IN ('active', 'pending', 'payment_failed')
            ORDER BY s.created_at DESC
            LIMIT 1
        """, (user_id,))

        row = cur.fetchone()
        
        if not row:
            conn.close()
            return {
                'statusCode': 200,
                'headers': HEADERS,
                'body': json.dumps({'subscription': None})
            }

        subscription = {
            'id': row[0],
            'plan_code': row[1],
            'amount': float(row[2]),
            'status': row[3],
            'current_period_start': row[4].isoformat() if row[4] else None,
            'current_period_end': row[5].isoformat() if row[5] else None,
            'cancel_at_period_end': row[6],
            'activated_at': row[7].isoformat() if row[7] else None,
        }

        # Add payment method if exists
        if row[8]:
            subscription['payment_method'] = {
                'card_type': row[8],
                'card_last4': row[9],
                'card_expiry_month': row[10],
                'card_expiry_year': row[11],
                'is_active': row[12]
            }

        # Get recent payments
        cur.execute(f"""
            SELECT 
                yookassa_payment_id,
                amount,
                status,
                payment_type,
                created_at,
                updated_at
            FROM {S}subscription_payments
            WHERE subscription_id = %s
            ORDER BY created_at DESC
            LIMIT 10
        """, (subscription['id'],))

        payments = []
        for p in cur.fetchall():
            payments.append({
                'payment_id': p[0],
                'amount': float(p[1]),
                'status': p[2],
                'payment_type': p[3],
                'created_at': p[4].isoformat() if p[4] else None,
                'updated_at': p[5].isoformat() if p[5] else None
            })

        conn.close()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'subscription': subscription,
                'payments': payments
            })
        }

    except Exception as e:
        conn.close()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }