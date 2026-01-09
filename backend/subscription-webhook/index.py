import json
import hashlib
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """
    Webhook для обработки результата оплаты от Robokassa
    Активирует подписку пользователя после успешной оплаты
    """
    method = event.get('httpMethod', 'GET')
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'text/plain'},
            'body': 'Method not allowed'
        }
    
    try:
        params = event.get('queryStringParameters', {})
        
        out_sum = params.get('OutSum')
        inv_id = params.get('InvId')
        signature_value = params.get('SignatureValue', '').upper()
        
        password2 = os.environ.get('ROBOKASSA_PASSWORD2')
        
        if not password2:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'text/plain'},
                'body': 'bad configuration'
            }
        
        shp_plan = params.get('Shp_plan', '')
        shp_email = params.get('Shp_email', '')
        
        my_signature_string = f"{out_sum}:{inv_id}:{password2}:Shp_email={shp_email}:Shp_plan={shp_plan}"
        my_signature = hashlib.md5(my_signature_string.encode()).hexdigest().upper()
        
        if my_signature != signature_value:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'text/plain'},
                'body': 'bad sign'
            }
        
        activate_subscription(shp_email, shp_plan, inv_id, out_sum)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'text/plain'},
            'body': f'OK{inv_id}'
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'text/plain'},
            'body': f'error: {str(e)}'
        }


def activate_subscription(email: str, plan: str, invoice_id: str, amount: str):
    """Активация подписки в базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users 
            SET subscription_plan = %s,
                subscription_updated_at = NOW()
            WHERE email = %s
        """, (plan, email))
        
        cursor.execute("""
            INSERT INTO subscription_payments (email, plan, invoice_id, amount, paid_at)
            VALUES (%s, %s, %s, %s, NOW())
        """, (email, plan, invoice_id, amount))
        
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Database error: {str(e)}")
