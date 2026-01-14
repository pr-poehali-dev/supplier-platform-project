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
        # Получаем все бронирования
        cur.execute("""
            SELECT b.id, b.unit_id, b.guest_name, b.guest_phone, b.guest_email,
                   b.check_in, b.check_out, b.total_price, b.telegram_id, b.created_at
            FROM bookings b
            WHERE b.status IN ('confirmed', 'tentative')
            ORDER BY b.created_at DESC
        """)
        
        bookings = cur.fetchall()
        synced = 0
        created = 0
        
        for booking in bookings:
            (booking_id, unit_id, guest_name, guest_phone, guest_email,
             check_in, check_out, total_price, telegram_id, booking_created_at) = booking
            
            # Ищем owner_id через unit_id (предполагаем, что есть связь)
            # Для простоты используем owner_id = 1 (можно добавить таблицу units с owner_id)
            owner_id = 1
            
            # Проверяем, есть ли клиент
            if guest_phone:
                cur.execute(f"""
                    SELECT id, total_bookings, total_spent
                    FROM customers
                    WHERE owner_id = {owner_id}
                    AND (phone = $${guest_phone}$$ OR email = $${guest_email or ''}$$)
                    LIMIT 1
                """)
            else:
                cur.execute(f"""
                    SELECT id, total_bookings, total_spent
                    FROM customers
                    WHERE owner_id = {owner_id}
                    AND name = $${guest_name}$$
                    LIMIT 1
                """)
            
            customer_row = cur.fetchone()
            
            if customer_row:
                # Обновляем существующего клиента
                customer_id = customer_row[0]
                new_total_bookings = customer_row[1] + 1
                new_total_spent = float(customer_row[2]) + float(total_price)
                
                cur.execute(f"""
                    UPDATE customers SET
                        last_booking_date = '{check_in}',
                        total_bookings = {new_total_bookings},
                        total_spent = {new_total_spent},
                        updated_at = CURRENT_TIMESTAMP,
                        telegram_id = {telegram_id or 'NULL'}
                    WHERE id = {customer_id}
                """)
                synced += 1
            else:
                # Создаём нового клиента
                cur.execute(f"""
                    INSERT INTO customers 
                    (owner_id, name, phone, email, telegram_id, last_booking_date,
                     total_bookings, total_spent)
                    VALUES ({owner_id}, $${guest_name}$$, $${guest_phone or ''}$$,
                            $${guest_email or ''}$$, {telegram_id or 'NULL'},
                            '{check_in}', 1, {total_price})
                """)
                created += 1
        
        conn.commit()
        
        return success_response({
            'message': 'Customer sync completed',
            'synced': synced,
            'created': created,
            'total_bookings': len(bookings)
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
