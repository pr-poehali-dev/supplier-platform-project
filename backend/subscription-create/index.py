"""Создание подписки с сохранением способа оплаты через ЮKassa."""
import json
import os
import re
import uuid
import base64
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2


# =============================================================================
# VALIDATION
# =============================================================================

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')

def is_valid_email(email: str) -> bool:
    """Validate email format."""
    return bool(EMAIL_REGEX.match(email))


# =============================================================================
# CONSTANTS
# =============================================================================

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"

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
# YOOKASSA API
# =============================================================================

def create_yookassa_payment_with_save(
    shop_id: str,
    secret_key: str,
    amount: float,
    description: str,
    return_url: str,
    customer_email: str,
    metadata: dict = None
) -> dict:
    """Create payment with save_payment_method = true."""
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()

    idempotence_key = str(uuid.uuid4())

    payload = {
        "amount": {
            "value": f"{amount:.2f}",
            "currency": "RUB"
        },
        "capture": True,
        "save_payment_method": True,
        "confirmation": {
            "type": "redirect",
            "return_url": return_url
        },
        "description": description,
        "receipt": {
            "customer": {
                "email": customer_email
            },
            "items": [{
                "description": description[:128],
                "quantity": "1.000",
                "amount": {
                    "value": f"{amount:.2f}",
                    "currency": "RUB"
                },
                "vat_code": 1,
                "payment_subject": "service",
                "payment_mode": "full_payment"
            }]
        }
    }

    if metadata:
        payload["metadata"] = metadata

    request = Request(
        YOOKASSA_API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Basic {auth_bytes}',
            'Idempotence-Key': idempotence_key,
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode())


# =============================================================================
# HANDLER
# =============================================================================

def handler(event, context):
    """Создание первого платежа с сохранением карты для подписки."""
    
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

    # Extract auth token
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    if not auth_header:
        return {
            'statusCode': 401,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Unauthorized'})
        }

    # Validate required fields
    plan_id = data.get('plan_id')
    user_email = data.get('user_email', '').strip()
    return_url = data.get('return_url', '').strip()

    if not plan_id:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'plan_id is required'})
        }

    if not user_email or not is_valid_email(user_email):
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Valid email is required'})
        }

    if not return_url.startswith('https://'):
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'return_url must be HTTPS'})
        }

    # Get YooKassa credentials
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY', '')

    if not shop_id or not secret_key:
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': 'YooKassa credentials not configured'})
        }

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()

        # Get plan details
        cur.execute(f"""
            SELECT id, name, price FROM {S}subscription_plans
            WHERE id = %s AND is_active = true
        """, (plan_id,))
        
        plan = cur.fetchone()
        if not plan:
            conn.close()
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Plan not found'})
            }

        plan_id, plan_name, plan_price = plan
        plan_price = float(plan_price)

        # TODO: Extract user_id from JWT token (auth_header)
        # For now using placeholder
        user_id = 1

        # Create subscription record
        subscription_id = str(uuid.uuid4())
        now = datetime.utcnow()
        period_end = now + timedelta(days=30)

        cur.execute(f"""
            INSERT INTO {S}subscriptions
            (id, user_id, plan_code, amount, status, current_period_start, current_period_end, created_at)
            VALUES (%s, %s, %s, %s, 'pending', %s, %s, %s)
            RETURNING id
        """, (subscription_id, user_id, plan_name.lower(), int(plan_price), now, period_end, now))

        # Generate idempotency key
        idempotency_key = f"sub-{subscription_id}-initial"

        # Create YooKassa payment with save_payment_method
        metadata = {
            "subscription_id": subscription_id,
            "user_id": str(user_id),
            "plan_id": str(plan_id),
            "plan_price": str(plan_price),
            "payment_type": "initial"
        }

        payment_response = create_yookassa_payment_with_save(
            shop_id=shop_id,
            secret_key=secret_key,
            amount=plan_price,
            description=f"Подписка {plan_name} (первый платёж)",
            return_url=return_url,
            customer_email=user_email,
            metadata=metadata
        )

        payment_id = payment_response.get('id')
        confirmation_url = payment_response.get('confirmation', {}).get('confirmation_url', '')

        # Save payment record
        cur.execute(f"""
            INSERT INTO {S}subscription_payments
            (subscription_id, yookassa_payment_id, amount, status, payment_type, idempotency_key, created_at, updated_at)
            VALUES (%s, %s, %s, 'pending', 'initial', %s, %s, %s)
        """, (subscription_id, payment_id, plan_price, idempotency_key, now, now))

        conn.commit()
        conn.close()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'subscription_id': subscription_id,
                'payment_id': payment_id,
                'confirmation_url': confirmation_url,
                'amount': plan_price,
                'plan_name': plan_name
            })
        }

    except HTTPError as e:
        conn.rollback()
        conn.close()
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': e.code,
            'headers': HEADERS,
            'body': json.dumps({'error': f'YooKassa API error: {error_body}'})
        }

    except Exception as e:
        conn.rollback()
        conn.close()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }
