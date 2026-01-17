import json
import os
import psycopg2
from datetime import datetime
from decimal import Decimal

def handler(event: dict, context) -> dict:
    '''
    Упрощённый API для календаря бронирований с мультитенантностью.
    Управляет объектами размещения и бронированиями.
    Требует X-Owner-Id заголовок для изоляции данных владельцев.
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Extract owner_id from headers
    headers = event.get('headers') or {}
    owner_id = headers.get('x-owner-id') or headers.get('X-Owner-Id')
    
    if not owner_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized: X-Owner-Id header required'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    try:
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', '')
        
        # GET /units - получить список объектов
        if method == 'GET' and action == 'units':
            cur.execute(f"""
                SELECT id, name, description, max_guests, base_price, type, 
                       created_at, dynamic_pricing_enabled, pricing_profile_id
                FROM {schema}.units 
                WHERE owner_id = {owner_id}
                ORDER BY id
            """)
            
            units = []
            for row in cur.fetchall():
                units.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2] or '',
                    'max_guests': row[3],
                    'base_price': float(row[4]) if row[4] else 0,
                    'type': row[5] or 'room',
                    'created_at': row[6].isoformat() if row[6] else None,
                    'dynamic_pricing_enabled': row[7] if row[7] is not None else False,
                    'pricing_profile_id': row[8]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'units': units}),
                'isBase64Encoded': False
            }
        
        # GET /bookings - получить список броней
        if method == 'GET' and action == 'bookings':
            cur.execute(f"""
                SELECT b.id, b.unit_id, b.guest_name, b.guest_email, b.guest_phone,
                       b.check_in, b.check_out, b.total_price, b.status, b.created_at,
                       u.name as unit_name, b.source, b.payment_status, b.is_pending_confirmation
                FROM {schema}.bookings b
                JOIN {schema}.units u ON b.unit_id = u.id
                WHERE u.owner_id = {owner_id}
                ORDER BY b.check_in DESC
            """)
            
            bookings = []
            for row in cur.fetchall():
                bookings.append({
                    'id': row[0],
                    'unit_id': row[1],
                    'guest_name': row[2],
                    'guest_email': row[3],
                    'guest_phone': row[4],
                    'check_in': row[5].isoformat() if row[5] else None,
                    'check_out': row[6].isoformat() if row[6] else None,
                    'total_price': float(row[7]) if row[7] else 0,
                    'status': row[8],
                    'created_at': row[9].isoformat() if row[9] else None,
                    'unit_name': row[10],
                    'source': row[11],
                    'payment_status': row[12],
                    'is_pending_confirmation': row[13] if len(row) > 13 else False
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'bookings': bookings}),
                'isBase64Encoded': False
            }
        
        # POST /create-unit - добавить объект
        if method == 'POST' and action == 'create-unit':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', '')
            unit_type = body.get('type', 'room')
            description = body.get('description', '')
            base_price = float(body.get('base_price', 0))
            max_guests = int(body.get('max_guests', 1))
            
            cur.execute(f"""
                INSERT INTO {schema}.units (name, description, max_guests, base_price, type, owner_id, created_at)
                VALUES ('{name.replace("'", "''")}', '{description.replace("'", "''")}', 
                        {max_guests}, {base_price}, '{unit_type}', {owner_id}, NOW())
                RETURNING id
            """)
            unit_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Unit added', 'unit_id': unit_id}),
                'isBase64Encoded': False
            }
        
        # PUT /update-unit - обновить объект
        if method == 'PUT' and action == 'update-unit':
            body = json.loads(event.get('body', '{}'))
            unit_id = query_params.get('unit_id')
            
            # Verify ownership
            cur.execute(f"SELECT id FROM {schema}.units WHERE id = {unit_id} AND owner_id = {owner_id}")
            if not cur.fetchone():
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden'}),
                    'isBase64Encoded': False
                }
            
            name = body.get('name', '')
            unit_type = body.get('type', 'room')
            description = body.get('description', '')
            base_price = float(body.get('base_price', 0))
            max_guests = int(body.get('max_guests', 1))
            
            cur.execute(f"""
                UPDATE {schema}.units 
                SET name = '{name.replace("'", "''")}', 
                    description = '{description.replace("'", "''")}',
                    max_guests = {max_guests},
                    base_price = {base_price},
                    type = '{unit_type}'
                WHERE id = {unit_id}
            """)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Unit updated'}),
                'isBase64Encoded': False
            }
        
        # DELETE /delete-unit - удалить объект
        if method == 'DELETE' and action == 'delete-unit':
            unit_id = query_params.get('unit_id')
            
            # Verify ownership
            cur.execute(f"SELECT id FROM {schema}.units WHERE id = {unit_id} AND owner_id = {owner_id}")
            if not cur.fetchone():
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden'}),
                    'isBase64Encoded': False
                }
            
            # Delete all related data first
            cur.execute(f"DELETE FROM {schema}.bookings WHERE unit_id = {unit_id}")
            cur.execute(f"DELETE FROM {schema}.price_calculation_logs WHERE unit_id = {unit_id}")
            # Then delete the unit
            cur.execute(f"DELETE FROM {schema}.units WHERE id = {unit_id}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Unit deleted'}),
                'isBase64Encoded': False
            }
        
        # POST /create-booking - создать бронь
        if method == 'POST' and action == 'create-booking':
            body = json.loads(event.get('body', '{}'))
            unit_id = body.get('unit_id')
            
            # Verify unit ownership and get unit price
            cur.execute(f"SELECT id, base_price FROM {schema}.units WHERE id = {unit_id} AND owner_id = {owner_id}")
            unit = cur.fetchone()
            if not unit:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden'}),
                    'isBase64Encoded': False
                }
            
            base_price = float(unit[1]) if unit[1] else 0
            
            guest_name = body.get('guest_name', '')
            guest_phone = body.get('guest_phone', '')
            guest_email = body.get('guest_email', '')
            check_in = body.get('check_in')
            check_out = body.get('check_out')
            status = body.get('status', 'confirmed')
            
            # Calculate total price based on number of nights
            from datetime import datetime
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d')
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d')
            nights = (check_out_date - check_in_date).days
            total_price = base_price * max(nights, 1)
            
            cur.execute(f"""
                INSERT INTO {schema}.bookings (unit_id, guest_name, guest_phone, guest_email,
                                      check_in, check_out, total_price, status, created_at)
                VALUES ({unit_id}, '{guest_name.replace("'", "''")}', '{guest_phone}', '{guest_email}',
                        '{check_in}', '{check_out}', {total_price}, '{status}', NOW())
                RETURNING id
            """)
            booking_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Booking created', 'booking_id': booking_id, 'total_price': total_price}),
                'isBase64Encoded': False
            }
        
        # PUT /update-booking-status - обновить статус брони
        if method == 'PUT' and action == 'update-booking-status':
            body = json.loads(event.get('body', '{}'))
            booking_id = body.get('booking_id')
            new_status = body.get('status', 'confirmed')
            payment_status = body.get('payment_status', 'pending')
            is_pending = str(body.get('is_pending_confirmation', False)).lower()
            
            # Verify ownership through unit
            cur.execute(f"""
                SELECT b.id FROM {schema}.bookings b
                JOIN {schema}.units u ON b.unit_id = u.id
                WHERE b.id = {booking_id} AND u.owner_id = {owner_id}
            """)
            if not cur.fetchone():
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                UPDATE {schema}.bookings 
                SET status = '{new_status}',
                    payment_status = '{payment_status}',
                    is_pending_confirmation = {is_pending},
                    updated_at = NOW()
                WHERE id = {booking_id}
            """)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Booking status updated'}),
                'isBase64Encoded': False
            }
        
        # DELETE /delete-booking - удалить бронь
        if method == 'DELETE' and action == 'delete-booking':
            booking_id = query_params.get('booking_id')
            
            # Verify ownership through unit
            cur.execute(f"""
                SELECT b.id FROM {schema}.bookings b
                JOIN {schema}.units u ON b.unit_id = u.id
                WHERE b.id = {booking_id} AND u.owner_id = {owner_id}
            """)
            if not cur.fetchone():
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"DELETE FROM {schema}.bookings WHERE id = {booking_id}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Booking deleted'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid action'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()