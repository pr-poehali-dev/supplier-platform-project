import json
import hashlib
import os
from urllib.parse import urlencode

def handler(event: dict, context) -> dict:
    """
    API для создания платежной ссылки Robokassa
    POST: создание ссылки на оплату
    GET: обработка callback от Robokassa
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method == 'POST':
        return create_payment_link(event)
    elif method == 'GET':
        return handle_result_callback(event)
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }


def create_payment_link(event: dict) -> dict:
    """Создание ссылки на оплату"""
    try:
        body = json.loads(event.get('body', '{}'))
        
        merchant_login = os.environ.get('ROBOKASSA_MERCHANT_LOGIN')
        password1 = os.environ.get('ROBOKASSA_PASSWORD1')
        
        if not merchant_login or not password1:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Robokassa credentials not configured'})
            }
        
        plan_id = body.get('plan_id')
        amount = body.get('amount')
        email = body.get('email')
        phone = body.get('phone', '')
        name = body.get('name', '')
        
        inv_id = f"{plan_id}_{int(os.urandom(4).hex(), 16)}"
        description = f"Подписка TourConnect {plan_id.upper()}"
        
        signature_string = f"{merchant_login}:{amount}:{inv_id}:{password1}"
        signature = hashlib.md5(signature_string.encode()).hexdigest()
        
        params = {
            'MerchantLogin': merchant_login,
            'OutSum': amount,
            'InvId': inv_id,
            'Description': description,
            'SignatureValue': signature,
            'Email': email,
            'Shp_plan': plan_id,
            'Shp_phone': phone,
            'Shp_name': name,
            'IsTest': '1' if os.environ.get('ROBOKASSA_TEST_MODE') == '1' else '0'
        }
        
        payment_url = f"https://auth.robokassa.ru/Merchant/Index.aspx?{urlencode(params)}"
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'payment_url': payment_url,
                'inv_id': inv_id
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def handle_result_callback(event: dict) -> dict:
    """Обработка уведомления от Robokassa (ResultURL)"""
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
        
        my_signature_string = f"{out_sum}:{inv_id}:{password2}"
        my_signature = hashlib.md5(my_signature_string.encode()).hexdigest().upper()
        
        if my_signature != signature_value:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'text/plain'},
                'body': 'bad sign'
            }
        
        plan_id = params.get('Shp_plan', 'unknown')
        
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
