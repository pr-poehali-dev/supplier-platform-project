import json
import os
import psycopg2
import calendar
from datetime import datetime, timedelta

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

def handler(event: dict, context) -> dict:
    '''
    AI-ассистент для владельцев турбаз с изоляцией по owner_id.
    Анализирует объекты, дает советы, управляет допродажами, помнит клиентов.
    Интегрирован с производственным календарем РФ.
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return cors_response()
    
    headers = event.get('headers', {})
    owner_id = headers.get('X-Owner-Id') or headers.get('x-owner-id')
    
    if not owner_id:
        return error_response('Owner ID required in X-Owner-Id header', 401)
    
    owner_id = int(owner_id)
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', '')
        
        # GET /chat - получить историю чата владельца
        if method == 'GET' and action == 'chat':
            conversation_id = query_params.get('conversation_id')
            
            if conversation_id:
                cur.execute(f"""
                    SELECT id, role, content, created_at
                    FROM ai_messages
                    WHERE conversation_id = {conversation_id}
                    ORDER BY created_at ASC
                    LIMIT 100
                """)
            else:
                # Последний разговор владельца
                cur.execute(f"""
                    SELECT m.id, m.role, m.content, m.created_at
                    FROM ai_conversations c
                    JOIN ai_messages m ON m.conversation_id = c.id
                    WHERE c.owner_id = {owner_id} AND c.context_type = 'owner_chat'
                    ORDER BY m.created_at ASC
                    LIMIT 100
                """)
            
            messages = []
            for row in cur.fetchall():
                messages.append({
                    'id': row[0] if not conversation_id else None,
                    'role': row[1],
                    'content': row[2],
                    'created_at': row[3].isoformat()
                })
            
            return success_response({'messages': messages})
        
        # POST /chat - отправить сообщение AI
        if method == 'POST' and action == 'chat':
            if not OPENAI_AVAILABLE:
                return error_response('OpenAI not available', 503)
            
            body = json.loads(event.get('body', '{}'))
            user_message = body.get('message', '').strip()
            conversation_id = body.get('conversation_id')
            
            if not user_message:
                return error_response('Message is required', 400)
            
            # Создаём или получаем разговор
            if not conversation_id:
                cur.execute(f"""
                    INSERT INTO ai_conversations (owner_id, context_type, status)
                    VALUES ({owner_id}, 'owner_chat', 'active')
                    RETURNING id
                """)
                conversation_id = cur.fetchone()[0]
                conn.commit()
            
            # Сохраняем сообщение пользователя
            cur.execute(f"""
                INSERT INTO ai_messages (conversation_id, role, content)
                VALUES ({conversation_id}, 'user', $${user_message}$$)
            """)
            conn.commit()
            
            # Получаем контекст владельца
            context = get_owner_context(cur, owner_id)
            
            # Получаем историю разговора (последние 30 сообщений для контекста AI)
            cur.execute(f"""
                SELECT role, content FROM ai_messages
                WHERE conversation_id = {conversation_id}
                ORDER BY created_at DESC
                LIMIT 30
            """)
            
            # Переворачиваем в хронологическом порядке
            messages = [{'role': row[0], 'content': row[1]} for row in reversed(cur.fetchall())]
            
            # Системный промпт
            system_prompt = build_system_prompt(context)
            
            # Вызываем Polza.ai API (OpenAI-совместимый)
            client = openai.OpenAI(
                base_url='https://api.polza.ai/api/v1',
                api_key=os.environ.get('POLZA_AI_API_KEY')
            )
            
            response = client.chat.completions.create(
                model='openai/gpt-4o',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    *messages
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            assistant_message = response.choices[0].message.content
            
            # Проверяем, есть ли intent для массовой рассылки
            intent_data = None
            if user_message.lower().find('отправ') != -1 and (user_message.lower().find('клиент') != -1 or user_message.lower().find('всем') != -1 or user_message.lower().find('рассыл') != -1):
                # Запрос на рассылку — формируем intent
                intent_data = {
                    'intent': 'broadcast_message',
                    'original_request': user_message,
                    'suggested_text': assistant_message,
                    'audience': 'all'  # all | with_bookings | past_guests
                }
            
            # Сохраняем ответ
            cur.execute(f"""
                INSERT INTO ai_messages (conversation_id, role, content)
                VALUES ({conversation_id}, 'assistant', $${assistant_message}$$)
            """)
            conn.commit()
            
            result = {
                'message': assistant_message,
                'conversation_id': conversation_id
            }
            
            if intent_data:
                result['intent'] = intent_data
            
            return success_response(result)
        
        # DELETE /chat - очистить историю чата владельца
        if method == 'DELETE' and action == 'chat':
            conversation_id = query_params.get('conversation_id')
            
            if conversation_id:
                # Удаляем сообщения конкретного разговора
                cur.execute(f"""
                    DELETE FROM ai_messages
                    WHERE conversation_id = {conversation_id}
                """)
                
                # Удаляем сам разговор
                cur.execute(f"""
                    DELETE FROM ai_conversations
                    WHERE id = {conversation_id} AND owner_id = {owner_id}
                """)
            else:
                # Удаляем ВСЕ разговоры владельца с типом owner_chat
                cur.execute(f"""
                    DELETE FROM ai_messages
                    WHERE conversation_id IN (
                        SELECT id FROM ai_conversations
                        WHERE owner_id = {owner_id} AND context_type = 'owner_chat'
                    )
                """)
                
                cur.execute(f"""
                    DELETE FROM ai_conversations
                    WHERE owner_id = {owner_id} AND context_type = 'owner_chat'
                """)
            
            conn.commit()
            return success_response({'message': 'Chat history cleared'})
        
        # GET /settings - получить настройки бота
        if method == 'GET' and action == 'settings':
            cur.execute(f"""
                SELECT bot_name, greeting_message, communication_style,
                       reminder_enabled, reminder_days, production_calendar_enabled,
                       sbp_phone, sbp_recipient_name
                FROM bot_settings
                WHERE owner_id = {owner_id}
            """)
            
            row = cur.fetchone()
            if row:
                settings = {
                    'bot_name': row[0],
                    'greeting_message': row[1],
                    'communication_style': row[2],
                    'reminder_enabled': row[3],
                    'reminder_days': row[4],
                    'production_calendar_enabled': row[5],
                    'sbp_phone': row[6] or '',
                    'sbp_recipient_name': row[7] or ''
                }
            else:
                settings = {
                    'bot_name': 'Ассистент',
                    'greeting_message': 'Привет! Я ваш AI-помощник. Чем могу помочь?',
                    'communication_style': 'Дружелюбный и профессиональный',
                    'reminder_enabled': True,
                    'reminder_days': 30,
                    'production_calendar_enabled': True,
                    'sbp_phone': '',
                    'sbp_recipient_name': ''
                }
            
            return success_response({'settings': settings})
        
        # POST /settings - сохранить настройки бота
        if method == 'POST' and action == 'settings':
            body = json.loads(event.get('body', '{}'))
            
            cur.execute(f"""
                INSERT INTO bot_settings 
                (owner_id, bot_name, greeting_message, communication_style,
                 reminder_enabled, reminder_days, production_calendar_enabled)
                VALUES ({owner_id}, 
                        $${body.get('bot_name', 'Ассистент')}$$,
                        $${body.get('greeting_message', '')}$$,
                        $${body.get('communication_style', '')}$$,
                        {str(body.get('reminder_enabled', True)).lower()},
                        {body.get('reminder_days', 30)},
                        {str(body.get('production_calendar_enabled', True)).lower()})
                ON CONFLICT (owner_id) DO UPDATE SET
                    bot_name = $${body.get('bot_name', 'Ассистент')}$$,
                    greeting_message = $${body.get('greeting_message', '')}$$,
                    communication_style = $${body.get('communication_style', '')}$$,
                    reminder_enabled = {str(body.get('reminder_enabled', True)).lower()},
                    reminder_days = {body.get('reminder_days', 30)},
                    production_calendar_enabled = {str(body.get('production_calendar_enabled', True)).lower()},
                    updated_at = CURRENT_TIMESTAMP
            """)
            conn.commit()
            
            return success_response({'message': 'Settings saved'})
        
        # PUT /settings - обновить любые настройки (включая СБП)
        if method == 'PUT' and action == 'settings':
            body = json.loads(event.get('body', '{}'))
            updates = []
            
            if 'sbp_phone' in body:
                updates.append(f"sbp_phone = $${body['sbp_phone']}$$")
            if 'sbp_recipient_name' in body:
                updates.append(f"sbp_recipient_name = $${body['sbp_recipient_name']}$$")
            if 'bot_name' in body:
                updates.append(f"bot_name = $${body['bot_name']}$$")
            if 'greeting_message' in body:
                updates.append(f"greeting_message = $${body['greeting_message']}$$")
            
            if updates:
                # Check if settings exist
                cur.execute(f"SELECT id FROM bot_settings WHERE owner_id = {owner_id}")
                if cur.fetchone():
                    cur.execute(f"""
                        UPDATE bot_settings 
                        SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                        WHERE owner_id = {owner_id}
                    """)
                else:
                    # Insert with defaults
                    sbp_phone = body.get('sbp_phone', '')
                    sbp_name = body.get('sbp_recipient_name', '')
                    cur.execute(f"""
                        INSERT INTO bot_settings (owner_id, sbp_phone, sbp_recipient_name)
                        VALUES ({owner_id}, $${sbp_phone}$$, $${sbp_name}$$)
                    """)
                conn.commit()
            
            return success_response({'message': 'Settings updated'})
        
        # POST /save_telegram_id - сохранить Telegram ID владельца
        if method == 'POST' and action == 'save_telegram_id':
            body = json.loads(event.get('body', '{}'))
            telegram_owner_id = body.get('telegram_owner_id', '').strip()
            
            if not telegram_owner_id:
                return error_response('telegram_owner_id is required', 400)
            
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            if not user_id:
                return error_response('User ID required', 401)
            
            cur.execute(f"""
                INSERT INTO bot_settings (owner_id, telegram_owner_id)
                VALUES ({owner_id}, $${telegram_owner_id}$$)
                ON CONFLICT (owner_id) DO UPDATE SET
                    telegram_owner_id = $${telegram_owner_id}$$,
                    updated_at = CURRENT_TIMESTAMP
            """)
            conn.commit()
            
            return success_response({'message': 'Telegram ID saved'})
        
        # GET /services - получить допродажи
        if method == 'GET' and action == 'services':
            cur.execute(f"""
                SELECT id, name, description, price, category, enabled
                FROM additional_services
                WHERE owner_id = {owner_id}
                ORDER BY category, name
            """)
            
            services = []
            for row in cur.fetchall():
                services.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'price': float(row[3]) if row[3] else None,
                    'category': row[4],
                    'enabled': row[5]
                })
            
            return success_response({'services': services})
        
        # POST /services - добавить допродажу
        if method == 'POST' and action == 'services':
            body = json.loads(event.get('body', '{}'))
            
            cur.execute(f"""
                INSERT INTO additional_services 
                (owner_id, name, description, price, category, enabled)
                VALUES ({owner_id}, $${body.get('name')}$$, $${body.get('description', '')}$$,
                        {body.get('price', 'NULL')}, $${body.get('category', 'Прочее')}$$,
                        {str(body.get('enabled', True)).lower()})
                RETURNING id
            """)
            
            service_id = cur.fetchone()[0]
            conn.commit()
            
            return success_response({'id': service_id, 'message': 'Service added'})
        
        # PUT /services - обновить допродажу
        if method == 'PUT' and action == 'services':
            service_id = query_params.get('id')
            body = json.loads(event.get('body', '{}'))
            
            cur.execute(f"""
                UPDATE additional_services SET
                    name = $${body.get('name')}$$,
                    description = $${body.get('description', '')}$$,
                    price = {body.get('price', 'NULL')},
                    category = $${body.get('category', 'Прочее')}$$,
                    enabled = {str(body.get('enabled', True)).lower()}
                WHERE id = {service_id} AND owner_id = {owner_id}
            """)
            conn.commit()
            
            return success_response({'message': 'Service updated'})
        
        # DELETE /services - удалить допродажу
        if method == 'DELETE' and action == 'services':
            service_id = query_params.get('id')
            
            cur.execute(f"""
                DELETE FROM additional_services
                WHERE id = {service_id} AND owner_id = {owner_id}
            """)
            conn.commit()
            
            return success_response({'message': 'Service deleted'})
        
        # GET /customers - получить базу клиентов
        if method == 'GET' and action == 'customers':
            cur.execute(f"""
                SELECT id, name, phone, email, telegram_id, last_booking_date,
                       total_bookings, total_spent, notes, created_at
                FROM customers
                WHERE owner_id = {owner_id}
                ORDER BY last_booking_date DESC NULLS LAST
            """)
            
            customers = []
            for row in cur.fetchall():
                customers.append({
                    'id': row[0],
                    'name': row[1],
                    'phone': row[2],
                    'email': row[3],
                    'telegram_id': row[4],
                    'last_booking_date': row[5].isoformat() if row[5] else None,
                    'total_bookings': row[6],
                    'total_spent': float(row[7]),
                    'notes': row[8],
                    'created_at': row[9].isoformat()
                })
            
            return success_response({'customers': customers})
        
        # GET /holidays - получить праздники на период
        if method == 'GET' and action == 'holidays':
            start_date = query_params.get('start', datetime.now().strftime('%Y-%m-%d'))
            end_date = query_params.get('end', (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d'))
            
            cur.execute(f"""
                SELECT date, holiday_name, is_working_day, is_holiday
                FROM production_calendar
                WHERE date BETWEEN '{start_date}' AND '{end_date}'
                AND is_holiday = true
                ORDER BY date
            """)
            
            holidays = []
            for row in cur.fetchall():
                holidays.append({
                    'date': row[0].isoformat(),
                    'name': row[1],
                    'is_working_day': row[2],
                    'is_holiday': row[3]
                })
            
            return success_response({'holidays': holidays})
        
        return error_response('Unknown action', 404)
        
    except Exception as e:
        conn.rollback()
        return error_response(str(e), 500)
    finally:
        cur.close()
        conn.close()


def get_owner_context(cur, owner_id: int) -> dict:
    '''Получает полный контекст владельца для AI. Всегда возвращает валидный dict, даже если данных нет.'''
    
    # Инициализация дефолтных значений
    units = []
    services = []
    bookings = []
    pending_bookings = []
    past_bookings = []
    stats = {
        'bookings_this_month': 0,
        'avg_price': 0,
        'revenue_this_month': 0,
        'occupancy_rate': 0
    }
    bot_settings = {'name': 'Ассистент', 'style': 'Дружелюбный'}
    holidays = []
    
    try:
        # Объекты размещения
        cur.execute(f"""
            SELECT id, name, type, base_price, max_guests, dynamic_pricing_enabled
            FROM units
            WHERE owner_id = {owner_id}
            LIMIT 20
        """)
        
        for row in cur.fetchall():
            try:
                units.append({
                    'id': row[0],
                    'name': row[1] or 'Без названия',
                    'type': row[2] or 'Объект',
                    'price': float(row[3]) if row[3] else 0,
                    'max_guests': row[4] or 1,
                    'dynamic_pricing': row[5] or False
                })
            except:
                continue
    except:
        pass
    
    try:
        # Допродажи
        cur.execute(f"""
            SELECT name, price, category, enabled
            FROM additional_services
            WHERE owner_id = {owner_id} AND enabled = true
        """)
        
        for row in cur.fetchall():
            try:
                services.append({
                    'name': row[0] or 'Услуга',
                    'price': float(row[1]) if row[1] else 0,
                    'category': row[2] or 'Прочее'
                })
            except:
                continue
    except:
        pass
    
    try:
        # КРИТИЧНО: Актуальный календарь ПОДТВЕРЖДЁННЫХ бронирований (±30 дней)
        cur.execute(f"""
            SELECT 
                b.check_in,
                b.check_out,
                b.total_price,
                b.guest_name,
                b.guest_phone,
                u.name as unit_name
            FROM bookings b
            JOIN units u ON b.unit_id = u.id
            WHERE u.owner_id = {owner_id}
            AND b.check_in >= CURRENT_DATE - INTERVAL '7 days'
            AND b.check_in <= CURRENT_DATE + INTERVAL '30 days'
            AND b.status = 'confirmed'
            ORDER BY b.check_in
        """)
        
        for row in cur.fetchall():
            try:
                bookings.append({
                    'check_in': row[0].isoformat() if row[0] else 'н/д',
                    'check_out': row[1].isoformat() if row[1] else 'н/д',
                    'price': float(row[2]) if row[2] else 0,
                    'guest_name': row[3] or 'не указано',
                    'guest_phone': row[4] or '',
                    'unit_name': row[5] or 'объект не найден'
                })
            except:
                continue
    except:
        pass
    
    try:
        # КРИТИЧНО: ЗАЯВКИ БЕЗ ОПЛАТЫ (pending_bookings)
        cur.execute(f"""
            SELECT 
                pb.id,
                pb.check_in,
                pb.check_out,
                pb.guest_name,
                pb.guest_contact,
                pb.amount,
                pb.verification_status,
                pb.expires_at,
                pb.created_at,
                u.name as unit_name
            FROM pending_bookings pb
            JOIN units u ON pb.unit_id = u.id
            WHERE u.owner_id = {owner_id}
            AND pb.verification_status = 'pending'
            AND pb.expires_at > CURRENT_TIMESTAMP
            ORDER BY pb.created_at DESC
        """)
        
        for row in cur.fetchall():
            try:
                pending_bookings.append({
                    'id': row[0],
                    'check_in': row[1].isoformat() if row[1] else 'н/д',
                    'check_out': row[2].isoformat() if row[2] else 'н/д',
                    'guest_name': row[3] or 'не указано',
                    'guest_phone': row[4] or '',
                    'amount': float(row[5]) if row[5] else 0,
                    'verification_status': row[6] or 'pending',
                    'expires_at': row[7].isoformat() if row[7] else 'н/д',
                    'created_at': row[8].isoformat() if row[8] else 'н/д',
                    'unit_name': row[9] or 'объект не найден'
                })
            except:
                continue
    except:
        pass
    
    try:
        # Статистика текущего месяца
        cur.execute(f"""
            SELECT COUNT(*), AVG(total_price), SUM(total_price)
            FROM bookings b
            JOIN units u ON b.unit_id = u.id
            WHERE u.owner_id = {owner_id}
            AND b.check_in >= DATE_TRUNC('month', CURRENT_DATE)
            AND b.check_in < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            AND b.status = 'confirmed'
        """)
        
        stats_row = cur.fetchone()
        if stats_row:
            confirmed_count = stats_row[0] or 0
            
            # Процент загрузки текущего месяца
            try:
                cur.execute(f"""
                    SELECT COUNT(DISTINCT b.check_in)
                    FROM bookings b
                    JOIN units u ON b.unit_id = u.id
                    WHERE u.owner_id = {owner_id}
                    AND b.check_in >= DATE_TRUNC('month', CURRENT_DATE)
                    AND b.check_in < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                    AND b.status = 'confirmed'
                """)
                
                occupied_days = cur.fetchone()[0] or 0
                now = datetime.now()
                days_in_month = calendar.monthrange(now.year, now.month)[1]
                occupancy_rate = (occupied_days / days_in_month * 100) if days_in_month > 0 else 0
            except:
                occupancy_rate = 0
            
            stats = {
                'bookings_this_month': confirmed_count,
                'avg_price': float(stats_row[1]) if stats_row[1] else 0,
                'revenue_this_month': float(stats_row[2]) if stats_row[2] else 0,
                'occupancy_rate': round(occupancy_rate, 1)
            }
    except:
        pass
    
    try:
        # Настройки бота
        cur.execute(f"""
            SELECT bot_name, communication_style, reminder_enabled, reminder_days
            FROM bot_settings
            WHERE owner_id = {owner_id}
        """)
        
        settings_row = cur.fetchone()
        if settings_row:
            bot_settings = {
                'name': settings_row[0] or 'Ассистент',
                'style': settings_row[1] or 'Дружелюбный',
                'reminders': settings_row[2] if settings_row[2] is not None else True,
                'reminder_days': settings_row[3] or 30
            }
    except:
        pass
    
    try:
        # Ближайшие праздники
        cur.execute(f"""
            SELECT date, holiday_name
            FROM production_calendar
            WHERE date >= CURRENT_DATE AND is_holiday = true
            ORDER BY date
            LIMIT 5
        """)
        
        for row in cur.fetchall():
            try:
                if row[0] and row[1]:
                    holidays.append({'date': row[0].isoformat(), 'name': row[1]})
            except:
                continue
    except:
        pass
    
    try:
        # ИСТОРИЯ БРОНИРОВАНИЙ (последние 60 дней)
        cur.execute(f"""
            SELECT 
                b.check_in,
                b.check_out,
                u.name as unit_name,
                b.guest_name,
                b.status,
                b.total_price
            FROM bookings b
            JOIN units u ON b.unit_id = u.id
            WHERE u.owner_id = {owner_id}
            AND b.check_in >= CURRENT_DATE - INTERVAL '60 days'
            AND b.check_in < CURRENT_DATE
            AND b.status IN ('confirmed', 'completed', 'cancelled')
            ORDER BY b.check_in DESC
            LIMIT 50
        """)
        
        for row in cur.fetchall():
            try:
                past_bookings.append({
                    'check_in': row[0].isoformat() if row[0] else 'н/д',
                    'check_out': row[1].isoformat() if row[1] else 'н/д',
                    'unit_name': row[2] or 'объект не найден',
                    'guest_name': row[3] or 'не указано',
                    'status': row[4] or 'unknown',
                    'price': float(row[5]) if row[5] else 0
                })
            except:
                continue
    except:
        pass
    
    return {
        'units': units,
        'services': services,
        'bookings': bookings,
        'pending_bookings': pending_bookings,
        'past_bookings': past_bookings,
        'stats': stats,
        'bot_settings': bot_settings,
        'holidays': holidays,
        'today': datetime.now().strftime('%Y-%m-%d')
    }


def build_system_prompt(context: dict) -> str:
    '''Строит системный промпт с контекстом владельца. Безопасно обрабатывает пустые данные.'''
    
    try:
        units_text = '\n'.join([
            f"- {u.get('name', 'Без названия')} ({u.get('type', 'Объект')}): {u.get('price', 0)}₽/ночь, до {u.get('max_guests', 1)} гостей"
            for u in context.get('units', [])
        ]) if context.get('units') else 'Объекты пока не добавлены'
    except:
        units_text = 'Объекты пока не добавлены'
    
    try:
        services_text = '\n'.join([
            f"- {s.get('name', 'Услуга')} ({s.get('category', 'Прочее')}): {s.get('price', 0)}₽"
            for s in context.get('services', [])
        ]) if context.get('services') else 'Допродажи пока не добавлены'
    except:
        services_text = 'Допродажи пока не добавлены'
    
    # КРИТИЧНО: Календарь бронирований с защитой от ошибок
    bookings_text = 'Ближайших бронирований нет'
    try:
        parts = []
        
        if context.get('bookings'):
            parts.append('✅ ПОДТВЕРЖДЁННЫЕ БРОНИРОВАНИЯ:')
            for b in context['bookings']:
                try:
                    line = f"- {b.get('check_in', 'н/д')} → {b.get('check_out', 'н/д')}: {b.get('unit_name', 'объект')}, {b.get('guest_name', 'не указано')}, {b.get('price', 0):.0f}₽"
                    parts.append(line)
                except:
                    continue
        
        if context.get('pending_bookings'):
            parts.append('\n⏳ ЗАЯВКИ БЕЗ ОПЛАТЫ (ОЖИДАЮТ ПОДТВЕРЖДЕНИЯ):')
            for pb in context['pending_bookings']:
                try:
                    expires = pb.get('expires_at', 'н/д')
                    line = f"- {pb.get('check_in', 'н/д')} → {pb.get('check_out', 'н/д')}: {pb.get('unit_name', 'объект')}, {pb.get('guest_name', 'не указано')}, {pb.get('amount', 0):.0f}₽, истекает {expires}"
                    parts.append(line)
                except:
                    continue
        
        if parts:
            bookings_text = '\n'.join(parts)
    except:
        pass
    
    # История бронирований
    past_bookings_text = 'История за последние 60 дней пуста'
    try:
        if context.get('past_bookings'):
            past_lines = []
            for b in context['past_bookings'][:20]:  # Ограничим вывод 20 записями
                try:
                    status_emoji = {
                        'confirmed': '✓',
                        'completed': '✓',
                        'cancelled': '✗'
                    }.get(b.get('status'), '?')
                    
                    line = f"{status_emoji} {b.get('check_in', 'н/д')} → {b.get('check_out', 'н/д')}: {b.get('unit_name', 'объект')}, {b.get('guest_name', 'не указано')}, {b.get('price', 0):.0f}₽"
                    past_lines.append(line)
                except:
                    continue
            
            if past_lines:
                past_bookings_text = '\n'.join(past_lines)
    except:
        pass
    
    try:
        holidays_text = '\n'.join([
            f"- {h.get('date', 'н/д')}: {h.get('name', 'Праздник')}"
            for h in context.get('holidays', [])
        ]) if context.get('holidays') else 'Праздников в ближайшее время нет'
    except:
        holidays_text = 'Праздников в ближайшее время нет'
    
    bot_name = context.get('bot_settings', {}).get('name', 'Ассистент')
    style = context.get('bot_settings', {}).get('style', 'Дружелюбный')
    today = context.get('today', datetime.now().strftime('%Y-%m-%d'))
    
    stats = context.get('stats', {})
    bookings_count = stats.get('bookings_this_month', 0)
    occupancy = stats.get('occupancy_rate', 0)
    avg_price = stats.get('avg_price', 0)
    revenue = stats.get('revenue_this_month', 0)
    
    return f"""Ты — {bot_name}, личный AI-ассистент владельца турбазы TourConnect.

Стиль общения: {style}
Сегодня: {today}

═══════════════════════════════════
ДАННЫЕ СИСТЕМЫ (АКТУАЛЬНЫЕ)
═══════════════════════════════════

ТВОИ ОБЪЕКТЫ:
{units_text}

ДОПРОДАЖИ:
{services_text}

КАЛЕНДАРЬ БУДУЩИХ БРОНИРОВАНИЙ (от {today}):
{bookings_text}

ИСТОРИЯ БРОНИРОВАНИЙ (последние 60 дней до {today}):
{past_bookings_text}

СТАТИСТИКА ТЕКУЩЕГО МЕСЯЦА:
- Подтверждённых броней: {bookings_count}
- Загрузка: {occupancy}%
- Средний чек: {avg_price:.0f}₽
- Выручка: {revenue:.0f}₽

БЛИЖАЙШИЕ ПРАЗДНИКИ:
{holidays_text}

═══════════════════════════════════
ПРАВИЛА РАБОТЫ С ДАННЫМИ
═══════════════════════════════════

1. ВРЕМЕННЫЕ РАМКИ:
   - Ты видишь будущие бронирования (от {today})
   - Ты видишь историю бронирований за последние 60 дней (до {today})
   - История используется ТОЛЬКО для ответов владельцу

2. ВОПРОСЫ О ПРОШЛЫХ ДАТАХ:
   
   ЕСЛИ дата входит в последние 60 дней:
   → Ищи в разделе "ИСТОРИЯ БРОНИРОВАНИЙ"
   → Если найдено — отвечай конкретно: «[дата]: [объект], гость [имя], статус [статус]»
   → Если не найдено — «В эту дату бронирований не было»
   
   ЕСЛИ дата старше 60 дней:
   → «Эта бронь вне доступной истории. Можно посмотреть в разделе "Заявки".»

3. ВОПРОСЫ О БУДУЩИХ ДАТАХ (дата >= {today}):
   - Используй ТОЛЬКО данные из раздела "КАЛЕНДАРЬ БУДУЩИХ БРОНИРОВАНИЙ"
   - Если даты нет в списке → бронирований на эту дату НЕТ
   - Отвечай уверенно и конкретно

4. КРИТИЧНО — РАЗЛИЧАЙ СТАТУСЫ БРОНИРОВАНИЙ:
   
   ✅ ПОДТВЕРЖДЁННЫЕ БРОНИРОВАНИЯ (confirmed):
   - Оплачены и подтверждены
   - Занимают даты в календаре
   - При вопросе "Есть ли брони?" — учитывай ТОЛЬКО эти
   
   ⏳ ЗАЯВКИ БЕЗ ОПЛАТЫ (pending_bookings):
   - НЕ оплачены, ждут подтверждения оплаты
   - НЕ занимают даты в календаре
   - Имеют срок действия (expires_at)
   - При вопросе "Есть ли заявки без оплаты?" — показывай ТОЛЬКО эти
   - При вопросе "Свободны ли даты?" — НЕ учитывай pending (это НЕ брони!)
   
   ПРАВИЛО: НИКОГДА не говори "заявок нет", если в разделе "ЗАЯВКИ БЕЗ ОПЛАТЫ" есть записи!

5. ЗАПРЕЩЁННЫЕ ФРАЗЫ:
   ❌ "у меня нет доступа к календарю"
   ❌ "возможно", "может быть", "скорее всего"
   ❌ "данные могут быть неточными"
   ❌ "проверьте в системе"
   ❌ "заявок нет" (если есть pending_bookings)
   
   ✅ Если данных нет — говори прямо: "Бронирований не было", "Объекты не добавлены"

6. ДОСТОВЕРНОСТЬ:
   - Ты ВСЕГДА видишь актуальный календарь будущих бронирований
   - Ты ВСЕГДА видишь ВСЕ заявки без оплаты (pending_bookings)
   - Ты ВСЕГДА видишь историю за последние 60 дней
   - НЕ выдумывай цифры, даты, имена гостей
   - НЕ используй процент загрузки для ответов о конкретных датах
   - Называй КОНКРЕТНЫЕ даты, суммы, имена из календаря или истории

7. СТАТИСТИКА:
   - Процент загрузки — это агрегат, НЕ список конкретных дат
   - НЕ упоминай "загрузка включает прошлые брони"
   - НЕ связывай процент с конкретными прошедшими датами
   - Для ответов о конкретных датах используй ТОЛЬКО историю бронирований

═══════════════════════════════════
ТВОИ ЗАДАЧИ
═══════════════════════════════════

1. Отвечай на вопросы о будущих бронированиях — по данным календаря выше
2. Показывай заявки без оплаты при запросе владельца
3. Анализируй загрузку и давай советы по оптимизации
4. Напоминай о праздниках и предлагай акции
5. Помогай настраивать цены и допродажи
6. Поддерживай владельца и давай рекомендации

═══════════════════════════════════
МАССОВАЯ РАССЫЛКА КЛИЕНТАМ
═══════════════════════════════════

Если владелец просит:
- "Отправь всем клиентам..."
- "Разошли акцию..."
- "Напиши клиентам про..."

Твои действия:
1. Составь ГОТОВЫЙ текст сообщения для рассылки
2. Сделай текст кратким (2-4 предложения)
3. Добавь эмодзи для привлечения внимания
4. Укажи конкретные детали (цены, даты, условия)
5. НЕ добавляй кнопки и ссылки в текст
6. Система АВТОМАТИЧЕСКИ определит это как intent для рассылки

ФОРМАТ ОТВЕТА:
Сформируй готовый текст, который можно сразу отправить клиентам.

Пример:
Владелец: "Отправь всем скидку на 23 февраля"
Ты: "🎉 Специальная акция к 23 февраля! Скидка 15% на все объекты при бронировании с 20 по 25 февраля. Успейте забронировать лучшие даты!"

Помни: лучше честно сказать "данных нет", чем выдумать или сказать "нет доступа"."""


def cors_response():
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id, X-User-Id',
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