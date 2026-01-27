import json
import os
import psycopg2
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
                """)
            else:
                # Последний разговор владельца
                cur.execute(f"""
                    SELECT c.id, m.role, m.content, m.created_at
                    FROM ai_conversations c
                    JOIN ai_messages m ON m.conversation_id = c.id
                    WHERE c.owner_id = {owner_id} AND c.context_type = 'owner_chat'
                    ORDER BY c.created_at DESC, m.created_at ASC
                    LIMIT 50
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
            
            # Получаем историю разговора
            cur.execute(f"""
                SELECT role, content FROM ai_messages
                WHERE conversation_id = {conversation_id}
                ORDER BY created_at ASC
                LIMIT 20
            """)
            
            messages = [{'role': row[0], 'content': row[1]} for row in cur.fetchall()]
            
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
            
            # Сохраняем ответ
            cur.execute(f"""
                INSERT INTO ai_messages (conversation_id, role, content)
                VALUES ({conversation_id}, 'assistant', $${assistant_message}$$)
            """)
            conn.commit()
            
            return success_response({
                'message': assistant_message,
                'conversation_id': conversation_id
            })
        
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
    '''Получает полный контекст владельца для AI'''
    
    # Объекты размещения
    cur.execute(f"""
        SELECT id, name, type, base_price, max_guests, dynamic_pricing_enabled
        FROM units
        WHERE owner_id = {owner_id}
        LIMIT 20
    """)
    
    units = []
    for row in cur.fetchall():
        units.append({
            'id': row[0],
            'name': row[1],
            'type': row[2],
            'price': float(row[3]),
            'max_guests': row[4],
            'dynamic_pricing': row[5]
        })
    
    # Допродажи
    cur.execute(f"""
        SELECT name, price, category, enabled
        FROM additional_services
        WHERE owner_id = {owner_id} AND enabled = true
    """)
    
    services = []
    for row in cur.fetchall():
        services.append({
            'name': row[0],
            'price': float(row[1]) if row[1] else 0,
            'category': row[2]
        })
    
    # КРИТИЧНО: Актуальный календарь бронирований (±30 дней)
    cur.execute(f"""
        SELECT 
            b.check_in,
            b.check_out,
            b.status,
            b.total_price,
            b.guest_name,
            b.guest_phone,
            u.name as unit_name,
            b.payment_deadline
        FROM bookings b
        JOIN units u ON b.unit_id = u.id
        WHERE u.owner_id = {owner_id}
        AND b.check_in >= CURRENT_DATE - INTERVAL '7 days'
        AND b.check_in <= CURRENT_DATE + INTERVAL '30 days'
        AND b.status IN ('confirmed', 'pending')
        ORDER BY b.check_in
    """)
    
    bookings = []
    for row in cur.fetchall():
        booking = {
            'check_in': row[0].isoformat(),
            'check_out': row[1].isoformat(),
            'status': row[2],
            'price': float(row[3]),
            'guest_name': row[4],
            'guest_phone': row[5],
            'unit_name': row[6]
        }
        
        # Для pending добавляем дедлайн оплаты
        if row[2] == 'pending' and row[7]:
            booking['payment_deadline'] = row[7].isoformat()
        
        bookings.append(booking)
    
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
    confirmed_count = stats_row[0] or 0
    
    # Процент загрузки текущего месяца (приблизительно)
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
    days_in_month = (datetime.now().replace(day=28) + timedelta(days=4)).day
    occupancy_rate = (occupied_days / days_in_month * 100) if days_in_month > 0 else 0
    
    stats = {
        'bookings_this_month': confirmed_count,
        'avg_price': float(stats_row[1]) if stats_row[1] else 0,
        'revenue_this_month': float(stats_row[2]) if stats_row[2] else 0,
        'occupancy_rate': round(occupancy_rate, 1)
    }
    
    # Настройки бота
    cur.execute(f"""
        SELECT bot_name, communication_style, reminder_enabled, reminder_days
        FROM bot_settings
        WHERE owner_id = {owner_id}
    """)
    
    settings_row = cur.fetchone()
    if settings_row:
        bot_settings = {
            'name': settings_row[0],
            'style': settings_row[1],
            'reminders': settings_row[2],
            'reminder_days': settings_row[3]
        }
    else:
        bot_settings = {'name': 'Ассистент', 'style': 'Дружелюбный'}
    
    # Ближайшие праздники
    cur.execute(f"""
        SELECT date, holiday_name
        FROM production_calendar
        WHERE date >= CURRENT_DATE AND is_holiday = true
        ORDER BY date
        LIMIT 5
    """)
    
    holidays = [{'date': row[0].isoformat(), 'name': row[1]} for row in cur.fetchall()]
    
    return {
        'units': units,
        'services': services,
        'bookings': bookings,
        'stats': stats,
        'bot_settings': bot_settings,
        'holidays': holidays,
        'today': datetime.now().strftime('%Y-%m-%d')
    }


def build_system_prompt(context: dict) -> str:
    '''Строит системный промпт с контекстом владельца'''
    
    units_text = '\n'.join([
        f"- {u['name']} ({u['type']}): {u['price']}₽/ночь, до {u['max_guests']} гостей"
        for u in context['units']
    ]) if context['units'] else 'Объекты пока не добавлены'
    
    services_text = '\n'.join([
        f"- {s['name']} ({s['category']}): {s['price']}₽"
        for s in context['services']
    ]) if context['services'] else 'Допродажи пока не добавлены'
    
    # КРИТИЧНО: Календарь бронирований
    bookings_text = ''
    if context['bookings']:
        confirmed = [b for b in context['bookings'] if b['status'] == 'confirmed']
        pending = [b for b in context['bookings'] if b['status'] == 'pending']
        
        if confirmed:
            bookings_text += 'ПОДТВЕРЖДЁННЫЕ БРОНИРОВАНИЯ:\n'
            for b in confirmed:
                bookings_text += f"- {b['check_in']} → {b['check_out']}: {b['unit_name']}, {b['guest_name']}, {b['price']:.0f}₽\n"
        
        if pending:
            bookings_text += '\nОЖИДАЮТ ОПЛАТЫ:\n'
            for b in pending:
                deadline = b.get('payment_deadline', 'не указан')
                bookings_text += f"- {b['check_in']} → {b['check_out']}: {b['unit_name']}, {b['guest_name']}, до {deadline}\n"
    else:
        bookings_text = 'Ближайших бронирований нет'
    
    holidays_text = '\n'.join([
        f"- {h['date']}: {h['name']}"
        for h in context['holidays']
    ]) if context['holidays'] else 'Праздников в ближайшее время нет'
    
    bot_name = context['bot_settings']['name']
    style = context['bot_settings']['style']
    
    return f"""Ты — {bot_name}, личный AI-ассистент владельца турбазы.

Стиль общения: {style}
Сегодня: {context['today']}

ТВОИ ОБЪЕКТЫ:
{units_text}

ДОПРОДАЖИ:
{services_text}

АКТУАЛЬНЫЙ КАЛЕНДАРЬ (±30 дней):
{bookings_text}

СТАТИСТИКА ТЕКУЩЕГО МЕСЯЦА:
- Подтверждённых броней: {context['stats']['bookings_this_month']}
- Загрузка: {context['stats']['occupancy_rate']}%
- Средний чек: {context['stats']['avg_price']:.0f}₽
- Выручка: {context['stats']['revenue_this_month']:.0f}₽

БЛИЖАЙШИЕ ПРАЗДНИКИ:
{holidays_text}

ТВОИ ЗАДАЧИ:
1. Отвечай на вопросы о календаре, загрузке, статистике — ТОЛЬКО по реальным данным выше
2. Анализируй бронирования и предлагай оптимизацию
3. Напоминай о праздниках и советуй акции
4. Помогай с ценообразованием и допродажами
5. Предлагай стратегии увеличения загрузки

КРИТИЧЕСКИ ВАЖНО:
- Ты ВСЕГДА видишь актуальные данные системы (календарь, бронирования, суммы)
- Используй ТОЛЬКО данные из контекста выше — НИКОГДА не выдумывай цифры, даты, бронирования
- Если данных нет — так и скажи прямо («Ближайших броней пока нет», «Объекты не добавлены»)
- НИКОГДА не отвечай «у меня нет доступа к календарю» — календарь выше
- Если вопрос вне переданных данных — предложи создать заявку или открыть раздел в системе
- Будь конкретным: называй даты, суммы, имена из календаря"""


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