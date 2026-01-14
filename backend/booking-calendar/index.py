import json
import os
import psycopg2
from datetime import datetime, timedelta
from decimal import Decimal

# Updated: 2026-01-14 - Added dynamic_pricing_enabled and pricing_profile_id to units GET response

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
    Поддерживает синхронизацию с внешними календарями (Авито, Яндекс).
    Исправлено каскадное удаление объектов с очисткой всех связанных данных.
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
        
        # GET /get_payment_links - получить платежные ссылки
        if method == 'GET' and action == 'get_payment_links':
            cur.execute("""
                SELECT pl.id, pl.unit_id, u.name, pl.payment_system, 
                       pl.payment_link, pl.recipient_name
                FROM payment_links pl
                JOIN units u ON pl.unit_id = u.id
                ORDER BY u.id
            """)
            
            links = []
            for row in cur.fetchall():
                links.append({
                    'id': row[0],
                    'unit_id': row[1],
                    'unit_name': row[2],
                    'payment_system': row[3],
                    'payment_link': row[4],
                    'recipient_name': row[5]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'links': links}),
                'isBase64Encoded': False
            }
        
        # GET /get_pending_bookings - получить ожидающие брони
        if method == 'GET' and action == 'get_pending_bookings':
            cur.execute("""
                SELECT pb.id, u.name, pb.check_in, pb.check_out, pb.guest_name, 
                       pb.guest_contact, pb.amount, pb.payment_screenshot_url,
                       pb.verification_status, pb.verification_notes, pb.created_at
                FROM pending_bookings pb
                JOIN units u ON pb.unit_id = u.id
                WHERE pb.verification_status IN ('pending', 'verified')
                ORDER BY pb.created_at DESC
            """)
            
            bookings = []
            for row in cur.fetchall():
                bookings.append({
                    'id': row[0],
                    'unit_name': row[1],
                    'check_in': row[2].isoformat(),
                    'check_out': row[3].isoformat(),
                    'guest_name': row[4],
                    'guest_contact': row[5],
                    'amount': float(row[6]),
                    'payment_screenshot_url': row[7],
                    'verification_status': row[8],
                    'verification_notes': row[9],
                    'created_at': row[10].isoformat()
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'bookings': bookings}),
                'isBase64Encoded': False
            }
        
        # POST /approve_booking - подтвердить бронь вручную
        if method == 'POST' and action == 'approve_booking':
            body = json.loads(event.get('body', '{}'))
            booking_id = body.get('booking_id')
            
            cur.execute(f"""
                SELECT unit_id, check_in, check_out, guest_name, guest_contact, amount
                FROM pending_bookings
                WHERE id = {booking_id}
            """)
            
            pending = cur.fetchone()
            if not pending:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Booking not found'}),
                    'isBase64Encoded': False
                }
            
            unit_id, check_in, check_out, guest_name, guest_contact, amount = pending
            
            cur.execute(f"""
                INSERT INTO bookings 
                (unit_id, guest_name, guest_phone, check_in, check_out, 
                 guests_count, total_price, status, source)
                VALUES ({unit_id}, '{guest_name.replace("'", "''")}', '{guest_contact.replace("'", "''")}',
                        '{check_in}', '{check_out}', 1, {amount}, 'confirmed', 'telegram')
                RETURNING id
            """)
            
            new_booking_id = cur.fetchone()[0]
            
            cur.execute(f"""
                UPDATE pending_bookings
                SET verification_status = 'verified'
                WHERE id = {booking_id}
            """)
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'booking_id': new_booking_id, 'message': 'Booking approved'}),
                'isBase64Encoded': False
            }
        
        # POST /reject_booking - отклонить бронь
        if method == 'POST' and action == 'reject_booking':
            body = json.loads(event.get('body', '{}'))
            booking_id = body.get('booking_id')
            
            cur.execute(f"""
                UPDATE pending_bookings
                SET verification_status = 'rejected'
                WHERE id = {booking_id}
            """)
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Booking rejected'}),
                'isBase64Encoded': False
            }
        
        # POST /save_payment_link - сохранить платежную ссылку
        if method == 'POST' and action == 'save_payment_link':
            body = json.loads(event.get('body', '{}'))
            unit_id = body.get('unit_id')
            payment_system = body.get('payment_system', 'sbp')
            payment_link = body.get('payment_link', '')
            recipient_name = body.get('recipient_name', '')
            
            # Upsert - обновить или создать
            cur.execute(f"""
                INSERT INTO payment_links (unit_id, payment_system, payment_link, recipient_name, updated_at)
                VALUES ({unit_id}, '{payment_system}', '{payment_link.replace("'", "''")}', 
                        '{recipient_name.replace("'", "''")}', NOW())
                ON CONFLICT (unit_id, payment_system) 
                DO UPDATE SET 
                    payment_link = '{payment_link.replace("'", "''")}',
                    recipient_name = '{recipient_name.replace("'", "''")}',
                    updated_at = NOW()
            """)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Payment link saved successfully'}),
                'isBase64Encoded': False
            }
        
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
        
        # PUT /update-unit - обновить объект
        if method == 'PUT' and action == 'update-unit':
            unit_id = query_params.get('unit_id')
            if not unit_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'unit_id is required'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', '')
            unit_type = body.get('type', 'house')
            description = body.get('description', '')
            base_price = float(body.get('base_price', 0))
            max_guests = int(body.get('max_guests', 2))
            
            cur.execute(f"""
                UPDATE units 
                SET name = '{name.replace("'", "''")}',
                    type = '{unit_type}',
                    description = '{description.replace("'", "''")}',
                    base_price = {base_price},
                    max_guests = {max_guests}
                WHERE id = {unit_id}
            """)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Unit updated successfully'}),
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
            
            try:
                cur.execute(f"DELETE FROM price_modifiers WHERE unit_id = {unit_id}")
                cur.execute(f"DELETE FROM pending_bookings WHERE unit_id = {unit_id}")
                cur.execute(f"DELETE FROM payment_links WHERE unit_id = {unit_id}")
                cur.execute(f"DELETE FROM bookings WHERE unit_id = {unit_id}")
                cur.execute(f"DELETE FROM units WHERE id = {unit_id}")
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Unit deleted successfully'}),
                    'isBase64Encoded': False
                }
            except Exception as e:
                conn.rollback()
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Failed to delete unit: {str(e)}'}),
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
                       b.guest_name, b.guest_phone, b.total_price, b.status, b.source
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
                    'status': row[8],
                    'source': row[9]
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
                SELECT id, name, type, description, base_price, max_guests, 
                       dynamic_pricing_enabled, pricing_profile_id
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
                SELECT id, name, type, description, base_price, max_guests, created_at,
                       dynamic_pricing_enabled, pricing_profile_id
                FROM units
                ORDER BY id
            """)
            
            today = datetime.now().date()
            month_end = today + timedelta(days=30)
            
            units = []
            for row in cur.fetchall():
                unit_id = row[0]
                
                # Подсчитываем свободные слоты на ближайший месяц
                cur.execute(f"""
                    SELECT COUNT(DISTINCT date)
                    FROM generate_series('{today}'::date, '{month_end}'::date, '1 day'::interval) AS date
                    WHERE NOT EXISTS (
                        SELECT 1 FROM bookings
                        WHERE unit_id = {unit_id}
                        AND status IN ('tentative', 'confirmed')
                        AND date::date >= check_in
                        AND date::date < check_out
                    )
                """)
                available_slots = cur.fetchone()[0]
                total_slots = 30
                
                units.append({
                    'id': unit_id,
                    'name': row[1],
                    'type': row[2],
                    'description': row[3],
                    'base_price': float(row[4]),
                    'max_guests': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                    'dynamic_pricing_enabled': row[7] if row[7] is not None else False,
                    'pricing_profile_id': row[8],
                    'available_slots': available_slots,
                    'total_slots': total_slots
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
        
        # Calendar Sync Endpoints
        
        # GET /calendar-export - экспорт календаря в iCal
        if method == 'GET' and action == 'calendar-export':
            unit_id = query_params.get('unit_id')
            if not unit_id:
                return error_response('unit_id is required', 400)
            
            cur.execute(f"""
                SELECT check_in, check_out, guest_name, id
                FROM bookings
                WHERE unit_id = {unit_id} 
                AND status IN ('confirmed', 'pending')
                AND check_out >= CURRENT_DATE
                ORDER BY check_in
            """)
            
            ical = generate_ical_calendar(cur.fetchall())
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'text/calendar; charset=utf-8',
                    'Content-Disposition': f'inline; filename="calendar_{unit_id}.ics"',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': ical,
                'isBase64Encoded': False
            }
        
        # GET /calendar-sync-list - список синхронизаций
        if method == 'GET' and action == 'calendar-sync-list':
            unit_id = query_params.get('unit_id')
            
            if unit_id:
                cur.execute(f"""
                    SELECT id, unit_id, platform, calendar_url, is_active, 
                           last_sync_at, created_at
                    FROM calendar_sync
                    WHERE unit_id = {unit_id}
                    ORDER BY platform
                """)
            else:
                cur.execute("""
                    SELECT cs.id, cs.unit_id, u.name, cs.platform, cs.calendar_url, 
                           cs.is_active, cs.last_sync_at, cs.created_at
                    FROM calendar_sync cs
                    JOIN units u ON cs.unit_id = u.id
                    ORDER BY u.id, cs.platform
                """)
            
            syncs = []
            for row in cur.fetchall():
                if unit_id:
                    syncs.append({
                        'id': row[0],
                        'unit_id': row[1],
                        'platform': row[2],
                        'calendar_url': row[3],
                        'is_active': row[4],
                        'last_sync_at': row[5].isoformat() if row[5] else None,
                        'created_at': row[6].isoformat()
                    })
                else:
                    syncs.append({
                        'id': row[0],
                        'unit_id': row[1],
                        'unit_name': row[2],
                        'platform': row[3],
                        'calendar_url': row[4],
                        'is_active': row[5],
                        'last_sync_at': row[6].isoformat() if row[6] else None,
                        'created_at': row[7].isoformat()
                    })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'syncs': syncs}),
                'isBase64Encoded': False
            }
        
        # POST /calendar-sync-add - добавить синхронизацию
        if method == 'POST' and action == 'calendar-sync-add':
            body = json.loads(event.get('body', '{}'))
            unit_id = body.get('unit_id')
            platform = body.get('platform')
            calendar_url = body.get('calendar_url', '')
            
            if not unit_id or not platform:
                return error_response('unit_id and platform required', 400)
            
            cur.execute(f"""
                INSERT INTO calendar_sync (unit_id, platform, calendar_url, is_active, created_at)
                VALUES ({unit_id}, '{platform}', '{calendar_url.replace("'", "''")}', true, NOW())
                RETURNING id
            """)
            
            sync_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': sync_id, 'message': 'Sync added'}),
                'isBase64Encoded': False
            }
        
        # PUT /calendar-sync-update - обновить синхронизацию
        if method == 'PUT' and action == 'calendar-sync-update':
            body = json.loads(event.get('body', '{}'))
            sync_id = body.get('id')
            calendar_url = body.get('calendar_url')
            is_active = body.get('is_active')
            
            if not sync_id:
                return error_response('id required', 400)
            
            updates = []
            if calendar_url is not None:
                updates.append(f"calendar_url = '{calendar_url.replace(\"'\", \"''\")}'"  )
            if is_active is not None:
                updates.append(f"is_active = {str(is_active).lower()}")
            
            if updates:
                cur.execute(f"""
                    UPDATE calendar_sync
                    SET {', '.join(updates)}
                    WHERE id = {sync_id}
                """)
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Sync updated'}),
                'isBase64Encoded': False
            }
        
        # DELETE /calendar-sync-delete - удалить синхронизацию
        if method == 'DELETE' and action == 'calendar-sync-delete':
            sync_id = query_params.get('id')
            if not sync_id:
                return error_response('id required', 400)
            
            cur.execute(f"""
                DELETE FROM calendar_sync WHERE id = {sync_id}
            """)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Sync deleted'}),
                'isBase64Encoded': False
            }
        
        # POST /calendar-sync-now - запустить синхронизацию
        if method == 'POST' and action == 'calendar-sync-now':
            import requests
            
            body = json.loads(event.get('body', '{}'))
            sync_id = body.get('id')
            
            if not sync_id:
                return error_response('id required', 400)
            
            cur.execute(f"""
                SELECT unit_id, platform, calendar_url, is_active
                FROM calendar_sync WHERE id = {sync_id}
            """)
            
            sync_row = cur.fetchone()
            if not sync_row:
                return error_response('Sync not found', 404)
            
            unit_id, platform, calendar_url, is_active = sync_row
            
            if not is_active or not calendar_url:
                return error_response('Sync disabled or URL not set', 400)
            
            # Импорт из внешнего календаря
            try:
                response = requests.get(calendar_url, timeout=10)
                response.raise_for_status()
                events = parse_ical_events(response.text)
                
                imported = 0
                for event in events:
                    check_in = event['start']
                    check_out = event['end']
                    
                    cur.execute(f"""
                        SELECT COUNT(*) FROM bookings
                        WHERE unit_id = {unit_id}
                        AND status IN ('confirmed', 'pending')
                        AND (
                            (check_in <= '{check_in}' AND check_out > '{check_in}')
                            OR (check_in < '{check_out}' AND check_out >= '{check_out}')
                        )
                    """)
                    
                    if cur.fetchone()[0] == 0:
                        cur.execute(f"""
                            INSERT INTO bookings 
                            (unit_id, guest_name, guest_phone, check_in, check_out,
                             guests_count, total_price, status, source)
                            VALUES ({unit_id}, 'Sync {platform}', 'external',
                                    '{check_in}', '{check_out}', 1, 0, 'confirmed', '{platform}')
                        """)
                        imported += 1
                
                cur.execute(f"""
                    UPDATE calendar_sync
                    SET last_sync_at = NOW()
                    WHERE id = {sync_id}
                """)
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Sync completed',
                        'imported_events': imported
                    }),
                    'isBase64Encoded': False
                }
            except Exception as sync_error:
                return error_response(f'Sync failed: {str(sync_error)}', 500)
        
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


def generate_ical_calendar(bookings) -> str:
    '''Генерирует iCalendar из списка броней'''
    lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TourConnect//RU',
        'CALSCALE:GREGORIAN'
    ]
    
    for booking in bookings:
        check_in, check_out, guest_name, booking_id = booking
        dtstart = check_in.strftime('%Y%m%d')
        dtend = check_out.strftime('%Y%m%d')
        uid = f'booking-{booking_id}@tourconnect.ru'
        
        lines.extend([
            'BEGIN:VEVENT',
            f'UID:{uid}',
            f'DTSTART;VALUE=DATE:{dtstart}',
            f'DTEND;VALUE=DATE:{dtend}',
            f'SUMMARY:Забронировано - {guest_name}',
            'STATUS:CONFIRMED',
            'END:VEVENT'
        ])
    
    lines.append('END:VCALENDAR')
    return '\r\n'.join(lines)


def parse_ical_events(content: str):
    '''Парсит события из iCalendar'''
    events = []
    lines = content.replace('\r\n ', '').split('\r\n')
    current = None
    
    for line in lines:
        if line == 'BEGIN:VEVENT':
            current = {}
        elif line == 'END:VEVENT' and current:
            if 'start' in current and 'end' in current:
                events.append(current)
            current = None
        elif current is not None:
            if line.startswith('DTSTART'):
                date_str = line.split(':')[1][:8]
                current['start'] = datetime.strptime(date_str, '%Y%m%d').date()
            elif line.startswith('DTEND'):
                date_str = line.split(':')[1][:8]
                current['end'] = datetime.strptime(date_str, '%Y%m%d').date()
    
    return events


def error_response(message: str, status_code: int) -> dict:
    '''Формирует ответ с ошибкой'''
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }