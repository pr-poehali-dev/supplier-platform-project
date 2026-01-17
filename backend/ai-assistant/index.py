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
                       reminder_enabled, reminder_days, production_calendar_enabled
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
                    'production_calendar_enabled': row[5]
                }
            else:
                settings = {
                    'bot_name': 'Ассистент',
                    'greeting_message': 'Привет! Я ваш AI-помощник. Чем могу помочь?',
                    'communication_style': 'Дружелюбный и профессиональный',
                    'reminder_enabled': True,
                    'reminder_days': 30,
                    'production_calendar_enabled': True
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
    
    # Статистика бронирований за месяц
    cur.execute(f"""
        SELECT COUNT(*), AVG(total_price), SUM(total_price)
        FROM bookings
        WHERE check_in >= CURRENT_DATE - INTERVAL '30 days'
    """)
    
    stats_row = cur.fetchone()
    stats = {
        'bookings_last_month': stats_row[0] or 0,
        'avg_price': float(stats_row[1]) if stats_row[1] else 0,
        'revenue_last_month': float(stats_row[2]) if stats_row[2] else 0
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
    ])
    
    services_text = '\n'.join([
        f"- {s['name']} ({s['category']}): {s['price']}₽"
        for s in context['services']
    ]) if context['services'] else 'Пока не добавлено'
    
    holidays_text = '\n'.join([
        f"- {h['date']}: {h['name']}"
        for h in context['holidays']
    ])
    
    bot_name = context['bot_settings']['name']
    style = context['bot_settings']['style']
    
    return f"""Ты — {bot_name}, личный AI-ассистент владельца турбазы.

Стиль общения: {style}

Сегодня: {context['today']}

ТВОИ ОБЪЕКТЫ:
{units_text}

ДОПРОДАЖИ:
{services_text}

СТАТИСТИКА ЗА МЕСЯЦ:
- Бронирований: {context['stats']['bookings_last_month']}
- Средний чек: {context['stats']['avg_price']:.0f}₽
- Выручка: {context['stats']['revenue_last_month']:.0f}₽

БЛИЖАЙШИЕ ПРАЗДНИКИ:
{holidays_text}

ТВОИ ЗАДАЧИ:
1. Анализируй данные и давай советы по оптимизации бизнеса
2. Отвечай на вопросы о загрузке, ценах, статистике
3. Предлагай стратегии по увеличению загрузки в низкий сезон
4. Напоминай о праздниках и советуй запустить акции
5. Помогай с настройкой допродаж и ценообразования
6. Анализируй конкурентов, если владелец спросит
7. Поддерживай владельца и мотивируй

ВАЖНО:
- Используй только реальные данные из контекста
- Будь конкретным в рекомендациях
- Если не знаешь точно — скажи об этом
- Можешь предлагать автоматизацию через бота
- Следи за праздниками и предлагай акции заранее"""


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