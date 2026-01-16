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
    
    try:
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', '')
        
        # GET /units - получить список объектов
        if method == 'GET' and action == 'units':
            cur.execute(f"""
                SELECT id, name, description, capacity, price_per_night, amenities, 
                       photos, created_at, dynamic_pricing_enabled, pricing_profile_id
                FROM units 
                WHERE owner_id = {owner_id}
                ORDER BY id
            """)
            
            units = []
            for row in cur.fetchall():
                units.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'capacity': row[3],
                    'price_per_night': float(row[4]) if row[4] else 0,
                    'amenities': row[5] or '',
                    'photos': row[6] or '',
                    'created_at': row[7].isoformat() if row[7] else None,
                    'calendars': [],
                    'dynamic_pricing_enabled': row[8] if len(row) > 8 else False,
                    'pricing_profile_id': row[9] if len(row) > 9 else None
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
                       u.name as unit_name
                FROM bookings b
                JOIN units u ON b.unit_id = u.id
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
                    'unit_name': row[10]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'bookings': bookings}),
                'isBase64Encoded': False
            }
        
        # POST /add-unit - добавить объект
        if method == 'POST' and action == 'add-unit':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', '')
            unit_type = body.get('type', 'room')
            description = body.get('description', '')
            base_price = float(body.get('base_price', 0))
            max_guests = int(body.get('max_guests', 1))
            
            cur.execute(f"""
                INSERT INTO units (name, description, capacity, price_per_night, amenities, owner_id, created_at)
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
        
        # DELETE /delete-unit - удалить объект
        if method == 'DELETE' and action == 'delete-unit':
            unit_id = query_params.get('unit_id')
            
            # Verify ownership
            cur.execute(f"SELECT id FROM units WHERE id = {unit_id} AND owner_id = {owner_id}")
            if not cur.fetchone():
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"DELETE FROM units WHERE id = {unit_id}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Unit deleted'}),
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
