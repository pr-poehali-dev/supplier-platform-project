import json
import os
import psycopg2
from datetime import datetime, timedelta
from decimal import Decimal

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

def handler(event: dict, context) -> dict:
    '''
    API для работы с календарём бронирований и AI-менеджером турбазы.
    Управляет объектами размещения, проверяет доступность, создаёт бронирования.
    Включает интеллектуального помощника для автоматического общения с клиентами.
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', '')
        
        # POST /create-unit - создать новый объект
        if method == 'POST' and action == 'create-unit':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', '')
            unit_type = body.get('type', 'house')
            description = body.get('description', '')
            base_price = float(body.get('base_price', 0))
            max_guests = int(body.get('max_guests', 2))
            
            cur.execute(f"""
                INSERT INTO units (name, type, description, base_price, max_guests)
                VALUES ('{name.replace("'", "''")}', '{unit_type}', '{description.replace("'", "''")}', {base_price}, {max_guests})
                RETURNING id
            """)
            unit_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': unit_id, 'message': 'Unit created successfully'}),
                'isBase64Encoded': False
            }
        
        # DELETE /delete-unit - удалить объект
        if method == 'DELETE' and action == 'delete-unit':
            unit_id = query_params.get('unit_id')
            if not unit_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'unit_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"DELETE FROM bookings WHERE unit_id = {unit_id}")
            cur.execute(f"DELETE FROM units WHERE id = {unit_id}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Unit deleted successfully'}),
                'isBase64Encoded': False
            }
        
        # DELETE /delete-booking - удалить бронирование
        if method == 'DELETE' and action == 'delete-booking':
            booking_id = query_params.get('booking_id')
            if not booking_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'booking_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"DELETE FROM bookings WHERE id = {booking_id}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Booking deleted successfully'}),
                'isBase64Encoded': False
            }
        
        # POST /create-booking - создать бронирование вручную
        if method == 'POST' and action == 'create-booking':
            body = json.loads(event.get('body', '{}'))
            unit_id = body.get('unit_id')
            check_in = body.get('check_in')
            check_out = body.get('check_out')
            guest_name = body.get('guest_name', '')
            guest_phone = body.get('guest_phone', '')
            
            if not all([unit_id, check_in, check_out, guest_name]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем доступность
            cur.execute(f"""
                SELECT COUNT(*) FROM bookings
                WHERE unit_id = {unit_id}
                AND status IN ('tentative', 'confirmed')
                AND check_in < '{check_out}'
                AND check_out > '{check_in}'
            """)
            
            if cur.fetchone()[0] > 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Dates are already booked'}),
                    'isBase64Encoded': False
                }
            
            # Получаем цену и рассчитываем стоимость
            cur.execute(f"SELECT base_price FROM units WHERE id = {unit_id}")
            base_price = float(cur.fetchone()[0])
            
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            nights = (check_out_date - check_in_date).days
            total_price = base_price * nights
            
            # Создаём бронирование
            cur.execute(f"""
                INSERT INTO bookings 
                (unit_id, guest_name, guest_phone, check_in, check_out, 
                 guests_count, total_price, status, source)
                VALUES ({unit_id}, '{guest_name.replace("'", "''")}', '{guest_phone.replace("'", "''")}', 
                        '{check_in}', '{check_out}', 1, {total_price}, 'confirmed', 'manual')
                RETURNING id
            """)
            
            booking_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': booking_id,
                    'total_price': total_price,
                    'nights': nights,
                    'message': 'Booking created successfully'
                }),
                'isBase64Encoded': False
            }
        
        # GET /bookings - получить все бронирования
        if method == 'GET' and action == 'bookings':
            cur.execute("""
                SELECT b.id, b.unit_id, u.name, b.check_in, b.check_out, 
                       b.guest_name, b.guest_phone, b.total_price, b.status
                FROM bookings b
                JOIN units u ON b.unit_id = u.id
                WHERE b.status != 'cancelled'
                ORDER BY b.check_in DESC
            """)
            
            bookings = []
            for row in cur.fetchall():
                bookings.append({
                    'id': row[0],
                    'unit_id': row[1],
                    'unit_name': row[2],
                    'check_in': row[3].isoformat(),
                    'check_out': row[4].isoformat(),
                    'guest_name': row[5],
                    'guest_phone': row[6],
                    'total_price': float(row[7]),
                    'status': row[8]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'bookings': bookings}),
                'isBase64Encoded': False
            }
        
        # POST /ai-chat - чат с AI-менеджером (для Telegram/WhatsApp)
        if method == 'POST' and action == 'ai-chat':
            if not OPENAI_AVAILABLE:
                return {
                    'statusCode': 503,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'OpenAI library not available'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            user_message = body.get('message', '')
            conversation_id = body.get('conversation_id')
            
            if not user_message:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Message is required'}),
                    'isBase64Encoded': False
                }
            
            # Создаём или получаем разговор
            if not conversation_id:
                cur.execute("""
                    INSERT INTO conversations (channel, status)
                    VALUES ('web', 'active')
                    RETURNING id
                """)
                conversation_id = cur.fetchone()[0]
                conn.commit()
            
            # Сохраняем сообщение пользователя
            cur.execute(f"""
                INSERT INTO messages (conversation_id, role, content)
                VALUES ({conversation_id}, 'user', '{user_message.replace("'", "''")}')
            """)
            conn.commit()
            
            # Получаем историю разговора
            cur.execute(f"""
                SELECT role, content FROM messages
                WHERE conversation_id = {conversation_id}
                ORDER BY created_at ASC
            """)
            
            messages = [{'role': row[0], 'content': row[1]} for row in cur.fetchall()]
            
            # Получаем информацию о доступных объектах
            cur.execute("""
                SELECT id, name, type, description, base_price, max_guests
                FROM units
                ORDER BY id
            """)
            
            units_info = []
            for row in cur.fetchall():
                units_info.append({
                    'id': row[0],
                    'name': row[1],
                    'type': row[2],
                    'description': row[3],
                    'price': float(row[4]),
                    'max_guests': row[5]
                })
            
            # Системный промпт для AI
            system_prompt = f"""Ты — менеджер по бронированию турбазы. Твоя задача помочь клиенту забронировать домик или баню.

Доступные объекты:
{json.dumps(units_info, ensure_ascii=False, indent=2)}

Правила:
1. Будь дружелюбным и профессиональным
2. Узнай даты заезда и выезда
3. Узнай количество гостей
4. Предложи подходящие варианты
5. Назови точную цену
6. Для бронирования запроси имя и телефон
7. НИКОГДА не придумывай доступность — всегда используй реальные данные
8. Если клиент хочет забронировать, отправь JSON в формате:
{{"action": "create_booking", "unit_id": 1, "check_in": "2026-02-15", "check_out": "2026-02-17", "guest_name": "Иван", "guest_phone": "+79991234567", "guests_count": 2}}

Текущая дата: {datetime.now().strftime('%Y-%m-%d')}"""

            # Вызываем OpenAI
            client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
            
            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    *messages
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            assistant_message = response.choices[0].message.content
            
            # Проверяем, есть ли команда на бронирование
            booking_created = False
            booking_id = None
            
            if '"action": "create_booking"' in assistant_message:
                try:
                    json_start = assistant_message.find('{')
                    json_end = assistant_message.rfind('}') + 1
                    booking_data = json.loads(assistant_message[json_start:json_end])
                    
                    # Проверяем доступность
                    cur.execute(f"""
                        SELECT COUNT(*) FROM bookings
                        WHERE unit_id = {booking_data['unit_id']}
                        AND status IN ('tentative', 'confirmed')
                        AND check_in < '{booking_data['check_out']}'
                        AND check_out > '{booking_data['check_in']}'
                    """)
                    
                    if cur.fetchone()[0] == 0:
                        cur.execute(f"SELECT base_price FROM units WHERE id = {booking_data['unit_id']}")
                        base_price = float(cur.fetchone()[0])
                        
                        check_in = datetime.strptime(booking_data['check_in'], '%Y-%m-%d').date()
                        check_out = datetime.strptime(booking_data['check_out'], '%Y-%m-%d').date()
                        nights = (check_out - check_in).days
                        total_price = base_price * nights
                        
                        cur.execute(f"""
                            INSERT INTO bookings 
                            (unit_id, guest_name, guest_phone, check_in, check_out, 
                             guests_count, total_price, status, source)
                            VALUES ({booking_data['unit_id']}, '{booking_data['guest_name']}', 
                                    '{booking_data.get('guest_phone', '')}', '{booking_data['check_in']}', 
                                    '{booking_data['check_out']}', {booking_data.get('guests_count', 1)}, 
                                    {total_price}, 'tentative', 'ai')
                            RETURNING id
                        """)
                        
                        booking_id = cur.fetchone()[0]
                        
                        cur.execute(f"""
                            INSERT INTO conversation_bookings (conversation_id, booking_id)
                            VALUES ({conversation_id}, {booking_id})
                        """)
                        
                        conn.commit()
                        booking_created = True
                        
                        assistant_message = f"✅ Бронирование создано! Номер брони: {booking_id}. Общая стоимость: {total_price} руб. за {nights} ночей. Ожидаем оплату для подтверждения."
                    else:
                        assistant_message = "К сожалению, выбранные даты уже заняты. Могу предложить другие варианты?"
                
                except Exception as e:
                    assistant_message = f"Произошла ошибка при создании бронирования: {str(e)}. Давайте попробуем ещё раз."
            
            # Сохраняем ответ ассистента
            cur.execute(f"""
                INSERT INTO messages (conversation_id, role, content)
                VALUES ({conversation_id}, 'assistant', '{assistant_message.replace("'", "''")}')
            """)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': assistant_message,
                    'conversation_id': conversation_id,
                    'booking_created': booking_created,
                    'booking_id': booking_id
                }),
                'isBase64Encoded': False
            }
        
        # GET /units - список объектов размещения
        if method == 'GET' and action == 'units':
            cur.execute("""
                SELECT id, name, type, description, base_price, max_guests, created_at
                FROM units
                ORDER BY id
            """)
            
            units = []
            for row in cur.fetchall():
                units.append({
                    'id': row[0],
                    'name': row[1],
                    'type': row[2],
                    'description': row[3],
                    'base_price': float(row[4]),
                    'max_guests': row[5],
                    'created_at': row[6].isoformat() if row[6] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'units': units}),
                'isBase64Encoded': False
            }
        
        # GET /availability - проверка доступности
        if method == 'GET' and action == 'availability':
            unit_id = query_params.get('unit_id')
            check_in = query_params.get('check_in')
            check_out = query_params.get('check_out')
            
            if not all([unit_id, check_in, check_out]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'unit_id, check_in, check_out required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT COUNT(*) FROM bookings
                WHERE unit_id = {unit_id}
                AND status IN ('tentative', 'confirmed')
                AND check_in < '{check_out}'
                AND check_out > '{check_in}'
            """)
            
            conflicts = cur.fetchone()[0]
            available = conflicts == 0
            
            cur.execute(f"SELECT base_price FROM units WHERE id = {unit_id}")
            base_price_row = cur.fetchone()
            
            if not base_price_row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unit not found'}),
                    'isBase64Encoded': False
                }
            
            base_price = float(base_price_row[0])
            
            cur.execute(f"""
                SELECT start_date, end_date, multiplier
                FROM price_modifiers
                WHERE unit_id = {unit_id}
                AND start_date <= '{check_out}'
                AND end_date >= '{check_in}'
            """)
            
            modifiers = cur.fetchall()
            
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            total_price = 0
            current_date = check_in_date
            
            while current_date < check_out_date:
                day_price = base_price
                
                for mod in modifiers:
                    if mod[0] <= current_date <= mod[1]:
                        day_price *= float(mod[2])
                
                total_price += day_price
                current_date += timedelta(days=1)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'available': available,
                    'total_price': round(total_price, 2),
                    'nights': (check_out_date - check_in_date).days
                }),
                'isBase64Encoded': False
            }
        
        # POST /bookings - создание бронирования
        if method == 'POST' and action == 'bookings':
            body = json.loads(event.get('body', '{}'))
            
            unit_id = body.get('unit_id')
            guest_name = body.get('guest_name')
            check_in = body.get('check_in')
            check_out = body.get('check_out')
            guests_count = body.get('guests_count', 1)
            source = body.get('source', 'manual')
            
            if not all([unit_id, guest_name, check_in, check_out]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT COUNT(*) FROM bookings
                WHERE unit_id = {unit_id}
                AND status IN ('tentative', 'confirmed')
                AND check_in < '{check_out}'
                AND check_out > '{check_in}'
            """)
            
            if cur.fetchone()[0] > 0:
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unit not available for these dates'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT base_price FROM units WHERE id = {unit_id}")
            base_price = float(cur.fetchone()[0])
            
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            nights = (check_out_date - check_in_date).days
            total_price = base_price * nights
            
            cur.execute(f"""
                INSERT INTO bookings 
                (unit_id, guest_name, guest_phone, guest_email, check_in, check_out, 
                 guests_count, total_price, status, source, notes)
                VALUES ({unit_id}, '{guest_name}', '{body.get('guest_phone', '')}', 
                        '{body.get('guest_email', '')}', '{check_in}', '{check_out}',
                        {guests_count}, {total_price}, '{body.get('status', 'tentative')}', 
                        '{source}', '{body.get('notes', '')}')
                RETURNING id, created_at
            """)
            
            booking = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'booking_id': booking[0],
                    'total_price': total_price,
                    'created_at': booking[1].isoformat()
                }),
                'isBase64Encoded': False
            }
        
        # GET /bookings - список бронирований
        if method == 'GET' and action == 'bookings':
            unit_id = query_params.get('unit_id')
            status = query_params.get('status')
            
            query = "SELECT id, unit_id, guest_name, check_in, check_out, total_price, status, source FROM bookings WHERE 1=1"
            
            if unit_id:
                query += f" AND unit_id = {unit_id}"
            if status:
                query += f" AND status = '{status}'"
            
            query += " ORDER BY check_in DESC"
            
            cur.execute(query)
            
            bookings = []
            for row in cur.fetchall():
                bookings.append({
                    'id': row[0],
                    'unit_id': row[1],
                    'guest_name': row[2],
                    'check_in': row[3].isoformat(),
                    'check_out': row[4].isoformat(),
                    'total_price': float(row[5]),
                    'status': row[6],
                    'source': row[7]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'bookings': bookings}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()