"""YooKassa webhook handler for payment notifications."""
import json
import os
import base64
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2

# =============================================================================
# CONSTANTS
# =============================================================================

HEADERS = {
    'Content-Type': 'application/json'
}

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"


# =============================================================================
# SECURITY
# =============================================================================

def verify_payment_via_api(payment_id: str, shop_id: str, secret_key: str) -> dict | None:
    """Verify payment status via YooKassa API.

    YooKassa doesn't use webhook signatures. The recommended approach is to
    verify payment status by making a GET request to the API.
    """
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()

    request = Request(
        f"{YOOKASSA_API_URL}/{payment_id}",
        headers={
            'Authorization': f'Basic {auth_bytes}',
            'Content-Type': 'application/json'
        },
        method='GET'
    )

    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode())
    except (HTTPError, Exception):
        return None


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
    """Handle YooKassa webhook notification."""
    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    # Parse body
    body = event.get('body', '{}')
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

    # Extract payment info
    event_type = data.get('event', '')
    payment_object = data.get('object', {})
    payment_id = payment_object.get('id', '')
    payment_method_id = payment_object.get('payment_method', {}).get('id', '')
    metadata = payment_object.get('metadata', {})

    if not payment_id:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Missing payment id'})
        }

    # Security: Verify payment via API (most reliable)
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')

    if shop_id and secret_key:
        verified_payment = verify_payment_via_api(payment_id, shop_id, secret_key)
        if not verified_payment:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Payment verification failed'})
            }
        # Use verified status instead of webhook data
        payment_status = verified_payment.get('status', '')
        payment_method_id = verified_payment.get('payment_method', {}).get('id', '')
    else:
        # Fallback to webhook data (less secure, only if credentials missing)
        payment_status = payment_object.get('status', '')

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()
        now = datetime.utcnow().isoformat()

        # Find order by payment_id
        cur.execute(f"""
            SELECT id, status FROM {S}orders
            WHERE yookassa_payment_id = %s
        """, (payment_id,))

        row = cur.fetchone()

        if not row:
            # Try to find by order_id from metadata
            order_id_meta = metadata.get('order_id')
            if order_id_meta:
                cur.execute(f"""
                    SELECT id, status FROM {S}orders WHERE id = %s
                """, (int(order_id_meta),))
                row = cur.fetchone()

        if not row:
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Order not found'})
            }

        order_id, current_status = row

        # Handle subscription payments
        subscription_id = metadata.get('subscription_id')
        if subscription_id:
            # This is a subscription payment
            if payment_status == 'succeeded':
                # Save payment method if available
                if payment_method_id:
                    user_id = metadata.get('user_id', 0)
                    card_info = payment_object.get('payment_method', {})
                    card_type = card_info.get('card', {}).get('card_type', '')
                    card_last4 = card_info.get('card', {}).get('last4', '')
                    card_exp_month = card_info.get('card', {}).get('expiry_month', '')
                    card_exp_year = card_info.get('card', {}).get('expiry_year', '')

                    # Check if payment method exists
                    cur.execute(f"""
                        SELECT id FROM {S}payment_methods
                        WHERE yookassa_payment_method_id = %s
                    """, (payment_method_id,))
                    pm_row = cur.fetchone()

                    if not pm_row:
                        # Insert new payment method
                        cur.execute(f"""
                            INSERT INTO {S}payment_methods
                            (user_id, yookassa_payment_method_id, card_type, card_last4, 
                             card_expiry_month, card_expiry_year, is_active, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s, true, %s)
                            RETURNING id
                        """, (user_id, payment_method_id, card_type, card_last4,
                              card_exp_month, card_exp_year, now))
                        pm_id = cur.fetchone()[0]
                    else:
                        pm_id = pm_row[0]

                    # Update subscription with payment_method_id and activate
                    cur.execute(f"""
                        UPDATE {S}subscriptions
                        SET payment_method_id = %s, status = 'active', 
                            activated_at = %s
                        WHERE id = %s
                    """, (pm_id, now, subscription_id))

                # Update payment record
                cur.execute(f"""
                    UPDATE {S}subscription_payments
                    SET status = 'succeeded', paid_at = %s, updated_at = %s
                    WHERE yookassa_payment_id = %s
                """, (now, now, payment_id))

                conn.commit()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': HEADERS,
                    'body': json.dumps({'status': 'ok', 'type': 'subscription'})
                }

            elif payment_status == 'canceled':
                # Update payment record as failed
                cur.execute(f"""
                    UPDATE {S}subscription_payments
                    SET status = 'canceled', updated_at = %s
                    WHERE yookassa_payment_id = %s
                """, (now, payment_id))
                conn.commit()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': HEADERS,
                    'body': json.dumps({'status': 'ok', 'type': 'subscription'})
                }

        # Update based on verified payment status (orders)
        if payment_status == 'succeeded':
            if current_status != 'paid':
                cur.execute(f"""
                    UPDATE {S}orders
                    SET status = 'paid', paid_at = %s, updated_at = %s
                    WHERE id = %s
                """, (now, now, order_id))
                conn.commit()

        elif payment_status == 'canceled':
            if current_status not in ('paid', 'canceled'):
                cur.execute(f"""
                    UPDATE {S}orders
                    SET status = 'canceled', updated_at = %s
                    WHERE id = %s
                """, (now, order_id))
                conn.commit()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({'status': 'ok'})
        }

    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Internal error'})
        }
    finally:
        conn.close()