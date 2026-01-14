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
        
        # Группируем бронирования по клиентам и пересчитываем статистику
        cur.execute("""
            WITH customer_bookings AS (
                SELECT 
                    u.created_by as owner_id,
                    b.guest_name,
                    COALESCE(NULLIF(b.guest_phone, ''), 'no_phone_' || b.guest_name) as guest_phone,
                    COALESCE(b.guest_email, '') as guest_email,
                    COUNT(*) as total_bookings,
                    SUM(b.total_price) as total_spent,
                    MAX(b.check_in) as last_booking_date
                FROM bookings b
                LEFT JOIN units u ON b.unit_id = u.id
                WHERE b.status IN ('confirmed', 'tentative')
                    AND u.created_by IS NOT NULL
                GROUP BY u.created_by, b.guest_name, guest_phone, b.guest_email
            )
            INSERT INTO customers 
                (owner_id, name, phone, email, total_bookings, total_spent, last_booking_date)
            SELECT 
                owner_id, 
                guest_name, 
                CASE WHEN guest_phone LIKE 'no_phone_%' THEN '' ELSE guest_phone END,
                guest_email,
                total_bookings,
                total_spent,
                last_booking_date
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