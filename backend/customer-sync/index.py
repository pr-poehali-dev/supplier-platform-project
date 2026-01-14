import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''
    Синхронизация базы клиентов с бронированиями.
    Автоматически обновляет информацию о клиентах на основе новых броней.
    '''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return cors_response()
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        # Сначала очищаем все данные customers и пересчитываем с нуля
        cur.execute("DELETE FROM customers")
        
        # Группируем бронирования по телефону (один клиент = один телефон)
        # Все имена с одним телефоном объединяем в одну строку
        cur.execute("""
            WITH phone_mapping AS (
                SELECT 
                    u.created_by as owner_id,
                    COALESCE(NULLIF(b.guest_phone, ''), 'no_phone') as phone_key,
                    b.guest_name,
                    b.guest_email,
                    b.status,
                    b.total_price,
                    b.check_in
                FROM bookings b
                LEFT JOIN units u ON b.unit_id = u.id
                WHERE u.created_by IS NOT NULL
            ),
            customer_bookings AS (
                SELECT 
                    owner_id,
                    phone_key,
                    STRING_AGG(DISTINCT guest_name, ', ' ORDER BY guest_name) as all_names,
                    MAX(COALESCE(guest_email, '')) as guest_email,
                    COUNT(*) FILTER (WHERE status IN ('confirmed', 'tentative')) as total_bookings,
                    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
                    SUM(total_price) FILTER (WHERE status IN ('confirmed', 'tentative')) as total_spent,
                    MAX(check_in) as last_booking_date
                FROM phone_mapping
                GROUP BY owner_id, phone_key
            )
            INSERT INTO customers 
                (owner_id, name, phone, email, total_bookings, total_spent, last_booking_date, notes)
            SELECT 
                owner_id, 
                all_names,
                CASE WHEN phone_key = 'no_phone' THEN '' ELSE phone_key END,
                guest_email,
                total_bookings,
                COALESCE(total_spent, 0),
                last_booking_date,
                CASE 
                    WHEN cancelled_bookings > 0 THEN 'Отменено броней: ' || cancelled_bookings
                    ELSE ''
                END
            FROM customer_bookings
        """)
        
        created = cur.rowcount
        
        conn.commit()
        
        return success_response({
            'message': 'Customer sync completed',
            'synced': 0,
            'created': created
        })
        
    except Exception as e:
        conn.rollback()
        return error_response(str(e), 500)
    finally:
        cur.close()
        conn.close()


def cors_response():
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        },
        'body': '',
        'isBase64Encoded': False
    }


def success_response(data: dict):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, ensure_ascii=False),
        'isBase64Encoded': False
    }


def error_response(message: str, status: int):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}, ensure_ascii=False),
        'isBase64Encoded': False
    }