"""Cron-функция для автоматического списания подписок через ЮKassa."""
import json
import os
import uuid
import base64
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import HTTPError

import psycopg2


# =============================================================================
# CONSTANTS
# =============================================================================

YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments"

HEADERS = {
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

def create_recurring_payment(
    shop_id: str,
    secret_key: str,
    payment_method_id: str,
    amount: float,
    description: str,
    metadata: dict = None
) -> dict:
    """Create recurring payment using saved payment method."""
    auth_string = f"{shop_id}:{secret_key}"
    auth_bytes = base64.b64encode(auth_string.encode()).decode()

    # Generate unique idempotency key
    idempotence_key = metadata.get('idempotency_key', str(uuid.uuid4()))

    payload = {
        "amount": {
            "value": f"{amount:.2f}",
            "currency": "RUB"
        },
        "capture": True,
        "payment_method_id": payment_method_id,
        "description": description
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
    """
    Cron функция для автоматического списания платежей по активным подпискам.
    
    Запускается периодически (каждый день), проверяет подписки у которых:
    - status = 'active'
    - current_period_end <= now + 1 day (скоро истечёт)
    - payment_method_id существует и активен
    - cancel_at_period_end = false
    """
    
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
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)

        # Find subscriptions that need charging
        cur.execute(f"""
            SELECT 
                s.id,
                s.user_id,
                s.amount,
                s.plan_code,
                s.current_period_end,
                pm.yookassa_payment_method_id,
                pm.id as payment_method_id
            FROM {S}subscriptions s
            JOIN {S}payment_methods pm ON s.payment_method_id = pm.id
            WHERE s.status = 'active'
              AND s.cancel_at_period_end = false
              AND s.current_period_end <= %s
              AND pm.is_active = true
        """, (tomorrow,))

        subscriptions = cur.fetchall()
        
        results = []
        for sub in subscriptions:
            subscription_id, user_id, amount, plan_code, period_end, yk_pm_id, pm_id = sub
            
            # Generate idempotency key (unique per subscription + billing cycle)
            idempotency_key = f"sub-{subscription_id}-{period_end.strftime('%Y%m%d')}"
            
            # Check if payment already attempted
            cur.execute(f"""
                SELECT id, status FROM {S}subscription_payments
                WHERE idempotency_key = %s
            """, (idempotency_key,))
            
            existing = cur.fetchone()
            if existing:
                # Payment already attempted, skip
                results.append({
                    'subscription_id': subscription_id,
                    'status': 'skipped',
                    'reason': 'already_charged'
                })
                continue
            
            # Create payment record BEFORE charging (for idempotency)
            cur.execute(f"""
                INSERT INTO {S}subscription_payments
                (subscription_id, yookassa_payment_id, amount, status, payment_type, 
                 idempotency_key, created_at, updated_at)
                VALUES (%s, %s, %s, 'pending', 'recurring', %s, %s, %s)
                RETURNING id
            """, (subscription_id, '', float(amount), idempotency_key, now, now))
            
            payment_record_id = cur.fetchone()[0]
            conn.commit()
            
            # Attempt to charge via YooKassa
            try:
                metadata = {
                    "subscription_id": subscription_id,
                    "user_id": str(user_id),
                    "plan_code": plan_code,
                    "payment_type": "recurring",
                    "idempotency_key": idempotency_key
                }
                
                payment_response = create_recurring_payment(
                    shop_id=shop_id,
                    secret_key=secret_key,
                    payment_method_id=yk_pm_id,
                    amount=float(amount),
                    description=f"Подписка {plan_code} (автопродление)",
                    metadata=metadata
                )
                
                payment_id = payment_response.get('id')
                payment_status = payment_response.get('status')
                
                # Update payment record with YooKassa payment_id
                cur.execute(f"""
                    UPDATE {S}subscription_payments
                    SET yookassa_payment_id = %s, status = %s, updated_at = %s
                    WHERE id = %s
                """, (payment_id, payment_status, now, payment_record_id))
                
                # If succeeded immediately, extend subscription period
                if payment_status == 'succeeded':
                    new_period_start = period_end
                    new_period_end = period_end + timedelta(days=30)
                    
                    cur.execute(f"""
                        UPDATE {S}subscriptions
                        SET current_period_start = %s,
                            current_period_end = %s,
                            next_charge_date = %s
                        WHERE id = %s
                    """, (new_period_start, new_period_end, new_period_end, subscription_id))
                    
                    cur.execute(f"""
                        UPDATE {S}subscription_payments
                        SET paid_at = %s
                        WHERE id = %s
                    """, (now, payment_record_id))
                
                conn.commit()
                
                results.append({
                    'subscription_id': subscription_id,
                    'payment_id': payment_id,
                    'status': payment_status
                })
                
            except HTTPError as e:
                # Payment failed - log error
                error_body = e.read().decode('utf-8')
                
                cur.execute(f"""
                    UPDATE {S}subscription_payments
                    SET status = 'failed', error_message = %s, updated_at = %s
                    WHERE id = %s
                """, (error_body[:500], now, payment_record_id))
                
                # Check if payment method should be deactivated
                if e.code in (400, 403):
                    # Likely card issue - deactivate payment method
                    cur.execute(f"""
                        UPDATE {S}payment_methods
                        SET is_active = false, deactivated_at = %s
                        WHERE id = %s
                    """, (now, pm_id))
                    
                    # Mark subscription as payment_failed
                    cur.execute(f"""
                        UPDATE {S}subscriptions
                        SET status = 'payment_failed'
                        WHERE id = %s
                    """, (subscription_id,))
                
                conn.commit()
                
                results.append({
                    'subscription_id': subscription_id,
                    'status': 'failed',
                    'error': error_body[:200]
                })
                
            except Exception as e:
                # Unexpected error
                cur.execute(f"""
                    UPDATE {S}subscription_payments
                    SET status = 'error', error_message = %s, updated_at = %s
                    WHERE id = %s
                """, (str(e)[:500], now, payment_record_id))
                conn.commit()
                
                results.append({
                    'subscription_id': subscription_id,
                    'status': 'error',
                    'error': str(e)[:200]
                })
        
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'processed': len(subscriptions),
                'results': results
            })
        }
        
    except Exception as e:
        conn.close()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }
