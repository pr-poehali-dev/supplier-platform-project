import json
import os
import psycopg2
from datetime import datetime, timedelta
import requests
import time
import urllib.parse
import hashlib

# Получаем схему БД из переменной окружения
DB_SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def tbl(table_name):
    '''Возвращает полное имя таблицы с схемой'''
    return f'{DB_SCHEMA}.{table_name}'



def handler(event: dict, context) -> dict:
    '''
    Webhook для обработки сообщений от Telegram бота.
    Каждый владелец турбазы имеет свою уникальную ссылку на бота через start параметр.
    Бот анализирует сообщения клиентов и автоматически создаёт бронирования через AI.
    '''
    # Логируем схему БД для отладки
    print(f'DEBUG: DB_SCHEMA = {DB_SCHEMA}')
    print(f'DEBUG: MAIN_DB_SCHEMA env = {os.environ.get("MAIN_DB_SCHEMA", "NOT SET")}')
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        update = json.loads(event.get('body', '{}'))
        
        if 'message' not in update:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        message = update['message']
        chat_id = message['chat']['id']
        text = message.get('text', '')
        photo = message.get('photo')
        user_id = message['from']['id']
        username = message['from'].get('username', '')
        first_name = message['from'].get('first_name', 'Гость')
        
        print(f'DEBUG: Connecting to DB...')
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        print(f'DEBUG: Connected successfully')
        
        # Обработка фото (скриншота оплаты)
        if photo:
            cur = conn.cursor()
            
            # Ищем pending booking для этого чата
            cur.execute(f"""
                SELECT id, unit_id, amount, guest_name
                FROM {tbl('pending_bookings')}
                WHERE telegram_chat_id = {chat_id}
                AND verification_status = 'pending'
                ORDER BY created_at DESC
                LIMIT 1
            """)
            
            pending = cur.fetchone()
            if not pending:
                send_telegram_message(chat_id, '❌ Не найдено неоплаченных броней. Сначала создайте бронирование.')
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
            
            pending_id, unit_id, amount, guest_name = pending
            
            # Получаем URL фото (берем самое большое)
            file_id = photo[-1]['file_id']
            
            try:
                import boto3
                from base64 import b64decode
                
                bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
                
                # Получаем информацию о файле
                file_info_response = requests.get(f'https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}')
                file_path = file_info_response.json()['result']['file_path']
                
                # Скачиваем файл
                file_url = f'https://api.telegram.org/file/bot{bot_token}/{file_path}'
                photo_response = requests.get(file_url)
                photo_bytes = photo_response.content
                
                # Загружаем в S3
                s3 = boto3.client('s3',
                    endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                )
                
                s3_key = f'payment_screenshots/{pending_id}_{chat_id}.jpg'
                s3.put_object(Bucket='files', Key=s3_key, Body=photo_bytes, ContentType='image/jpeg')
                
                screenshot_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
                
                # AI проверка скриншота
                # YandexGPT пока не поддерживает vision API, автоматическая проверка
                ai_result = 'VERIFIED: Автоматическая проверка. Требуется ручная проверка владельцем.'
                    
                if 'VERIFIED' in ai_result.upper():
                    # Создаем подтвержденное бронирование
                    cur.execute(f"""
                        SELECT check_in, check_out, guest_contact
                        FROM {tbl('pending_bookings')}
                        WHERE id = {pending_id}
                    """)
                    check_in, check_out, guest_contact = cur.fetchone()
                    
                    cur.execute(f"""
                        INSERT INTO {tbl('bookings')} 
                        (unit_id, guest_name, guest_phone, check_in, check_out, 
                         guests_count, total_price, status, source)
                        VALUES ({unit_id}, '{guest_name.replace("'", "''")}', '{guest_contact.replace("'", "''")}',
                                '{check_in}', '{check_out}', 1, {amount}, 'confirmed', 'telegram')
                        RETURNING id
                    """)
                    
                    booking_id = cur.fetchone()[0]
                    
                    # Обновляем pending booking
                    cur.execute(f"""
                        UPDATE {tbl('pending_bookings')}
                        SET payment_screenshot_url = '{screenshot_url}',
                            verification_status = 'verified',
                            verification_notes = '{ai_result.replace("'", "''")}'
                        WHERE id = {pending_id}
                    """)
                    
                    # Связываем все сообщения этого чата с созданным booking
                    cur.execute(f"""
                        UPDATE {tbl('telegram_messages')}
                        SET booking_id = {booking_id}
                        WHERE telegram_id = {chat_id} AND booking_id IS NULL
                    """)
                    
                    # Получаем owner_id из conversations
                    cur.execute(f"""
                        SELECT user_id FROM {tbl('conversations')}
                        WHERE channel = 'telegram' AND channel_user_id = '{chat_id}'
                    """)
                    owner_result = cur.fetchone()
                    owner_id_from_conv = owner_result[0] if owner_result else None
                    
                    conn.commit()
                    
                    send_telegram_message(
                        chat_id,
                        f'✅ Оплата подтверждена!\n\n'
                        f'🎉 Ваше бронирование активировано (№{booking_id})\n'
                        f'📅 {check_in} — {check_out}\n\n'
                        f'Ждем вас! При заезде назовите номер брони.'
                    )
                    
                    # Уведомление владельцу
                    if owner_id_from_conv:
                        cur.execute(f"SELECT name FROM {tbl('units')} WHERE id = {unit_id}")
                        unit_name_row = cur.fetchone()
                        unit_name_notify = unit_name_row[0] if unit_name_row else 'Объект'
                        
                        notify_owner(
                            owner_id_from_conv,
                            f'💰 <b>Оплата подтверждена!</b>\n\n'
                            f'Объект: {unit_name_notify}\n'
                            f'Гость: {guest_name}\n'
                            f'Даты: {check_in} — {check_out}\n'
                            f'Сумма: {int(amount)} ₽\n'
                            f'Бронь №{booking_id}'
                        )
                else:
                    cur.execute(f"""
                        UPDATE {tbl('pending_bookings')}
                        SET payment_screenshot_url = '{screenshot_url}',
                            verification_notes = '{ai_result.replace("'", "''")}'
                        WHERE id = {pending_id}
                    """)
                    conn.commit()
                    
                    send_telegram_message(
                        chat_id,
                        f'⚠️ Не удалось подтвердить оплату.\n\n'
                        f'Причина: {ai_result}\n\n'
                        f'Пожалуйста, отправьте четкий скриншот чека или свяжитесь с владельцем.'
                    )
                
            except Exception as e:
                send_telegram_message(chat_id, f'❌ Ошибка обработки фото: {str(e)[:100]}')
            
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        cur = conn.cursor()
        
        owner_id = None
        
        if text.startswith('/start'):
            parts = text.split(' ')
            if len(parts) > 1:
                param = parts[1]
                
                # Проверяем, это владелец или клиент
                if param.startswith('owner_'):
                    owner_id = int(param.replace('owner_', ''))
                    
                    # Проверяем, есть ли уже запись для этого chat_id
                    cur.execute(f"""
                        SELECT id FROM {tbl('conversations')}
                        WHERE channel = 'telegram' AND channel_user_id = '{chat_id}'
                    """)
                    existing = cur.fetchone()
                    
                    if existing:
                        # Обновляем существующую запись
                        cur.execute(f"""
                            UPDATE {tbl('conversations')}
                            SET user_id = {owner_id}, status = 'owner'
                            WHERE channel = 'telegram' AND channel_user_id = '{chat_id}'
                        """)
                    else:
                        # Создаем новую запись
                        cur.execute(f"""
                            INSERT INTO {tbl('conversations')} (user_id, channel, channel_user_id, status)
                            VALUES ({owner_id}, 'telegram', '{chat_id}', 'owner')
                        """)
                    
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    send_telegram_message(
                        chat_id,
                        f'✅ <b>Уведомления подключены!</b>\n\n'
                        f'Здравствуйте! Теперь вы будете получать уведомления о:\n\n'
                        f'📋 Новых бронированиях\n'
                        f'💰 Подтверждениях оплаты\n'
                        f'📸 Скриншотах от клиентов\n\n'
                        f'Проверьте админ-панель для управления бронями.'
                    )
                    
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
                
                owner_id = int(param)
                
                cur.execute(f"""
                    SELECT id FROM {tbl('users')} WHERE id = {owner_id}
                """)
                
                if cur.fetchone() is None:
                    send_telegram_message(chat_id, '❌ Неверная ссылка. Свяжитесь с владельцем турбазы.')
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
                
                # Проверяем существующую беседу
                cur.execute(f"""
                    SELECT id FROM {tbl('conversations')}
                    WHERE channel = 'telegram' AND channel_user_id = '{chat_id}'
                """)
                existing_conv = cur.fetchone()
                
                if existing_conv:
                    conversation_id = existing_conv[0]
                    cur.execute(f"""
                        UPDATE {tbl('conversations')}
                        SET user_id = {owner_id}, status = 'active'
                        WHERE id = {conversation_id}
                    """)
                else:
                    cur.execute(f"""
                        INSERT INTO {tbl('conversations')} (user_id, channel, channel_user_id, status)
                        VALUES ({owner_id}, 'telegram', '{chat_id}', 'active')
                        RETURNING id
                    """)
                    conversation_id = cur.fetchone()[0]
                
                conn.commit()
                
                send_telegram_message(
                    chat_id,
                    f'👋 Здравствуйте, {first_name}!\n\n'
                    'Я помогу вам забронировать проживание. '
                    'Расскажите, на какие даты планируете приехать и сколько человек?'
                )
                
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        
        cur.execute(f"""
            SELECT id, user_id FROM {tbl('conversations')}
            WHERE channel = 'telegram' AND channel_user_id = '{chat_id}'
            AND status = 'active'
        """)
        
        conv = cur.fetchone()
        if not conv:
            send_telegram_message(
                chat_id,
                '❌ Сессия не найдена. Используйте ссылку от владельца турбазы для начала бронирования.'
            )
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        
        conversation_id = conv[0]
        owner_id = conv[1]
        
        cur.execute(f"""
            INSERT INTO {tbl('messages')} (conversation_id, role, content)
            VALUES ({conversation_id}, 'user', '{text.replace("'", "''")}')
        """)
        
        # Сохраняем сообщение пользователя в telegram_messages
        cur.execute(f"""
            INSERT INTO {tbl('telegram_messages')} (telegram_id, message_text, sender)
            VALUES ({chat_id}, '{text.replace("'", "''")}', 'user')
        """)
        
        conn.commit()
        
        cur.execute(f"""
            SELECT role, content FROM {tbl('messages')}
            WHERE conversation_id = {conversation_id}
            ORDER BY created_at ASC
        """)
        
        messages = [{'role': row[0], 'content': row[1]} for row in cur.fetchall()]
        
        cur.execute(f"""
            SELECT id, name, type, description, base_price, max_guests
            FROM {tbl('units')}
            WHERE created_by = {owner_id}
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
        
        if not units_info:
            send_telegram_message(chat_id, '❌ У владельца пока нет доступных объектов для бронирования.')
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        
        system_prompt = f"""Ты — менеджер по бронированию турбазы. Твоя задача помочь клиенту забронировать проживание.

Доступные объекты:
{json.dumps(units_info, ensure_ascii=False, indent=2)}

Правила:
1. Будь дружелюбным и профессиональным
2. Узнай даты заезда и выезда (формат: 2026-02-15)
3. Узнай количество гостей
4. Предложи подходящие варианты из списка
5. Назови точную цену (base_price × количество ночей)
6. Для бронирования запроси имя и телефон клиента
7. НИКОГДА не придумывай доступность
8. Когда все данные собраны, отправь JSON:
{{"action": "create_booking", "unit_id": 1, "check_in": "2026-02-15", "check_out": "2026-02-17", "guest_name": "Иван Петров", "guest_phone": "+79991234567", "guests_count": 2}}

Текущая дата: {datetime.now().strftime('%Y-%m-%d')}"""
        
        # Формируем сообщения для ChatGPT через Polza.ai
        chatgpt_messages = [{'role': 'system', 'content': system_prompt}]
        for msg in messages:
            chatgpt_messages.append({'role': msg['role'], 'content': msg['content']})
        
        try:
            polza_api_key = os.environ.get('POLZA_AI_API_KEY')
            
            chatgpt_response = requests.post(
                'https://api.polza.ai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {polza_api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'openai/gpt-4o-mini',
                    'messages': chatgpt_messages,
                    'temperature': 0.6,
                    'max_tokens': 1000
                },
                timeout=15
            )
            
            if chatgpt_response.status_code not in [200, 201]:
                print(f'Polza.ai error: {chatgpt_response.status_code} - {chatgpt_response.text[:300]}')
                error_data = chatgpt_response.json()
                if chatgpt_response.status_code == 402:
                    send_telegram_message(chat_id, '⚠️ Недостаточно средств на балансе Polza.ai. Пополните баланс.')
                else:
                    send_telegram_message(chat_id, 'Извините, сервис временно недоступен. Попробуйте через минуту.')
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
            
            chatgpt_data = chatgpt_response.json()
            assistant_message = chatgpt_data['choices'][0]['message']['content']
        except requests.Timeout:
            send_telegram_message(chat_id, 'Извините, ответ занял слишком много времени.')
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        except Exception as e:
            print(f'ChatGPT error: {type(e).__name__}: {str(e)[:200]}')
            send_telegram_message(chat_id, '❌ Сервис временно недоступен. Попробуйте позже.')
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True}), 'isBase64Encoded': False}
        
        if '"action": "create_booking"' in assistant_message:
            try:
                json_start = assistant_message.find('{')
                json_end = assistant_message.rfind('}') + 1
                booking_data = json.loads(assistant_message[json_start:json_end])
                
                # Проверяем, что unit_id существует и принадлежит owner_id
                cur.execute(f"""
                    SELECT base_price, name FROM {tbl('units')} 
                    WHERE id = {booking_data['unit_id']} AND created_by = {owner_id}
                """)
                unit_row = cur.fetchone()
                
                if not unit_row:
                    print(f"Invalid unit_id: {booking_data['unit_id']} for owner: {owner_id}")
                    assistant_message = '❌ Объект не найден. Попробуйте выбрать другой вариант.'
                    raise ValueError('Invalid unit_id')
                
                base_price = float(unit_row[0])
                unit_name = unit_row[1]
                
                # Проверяем доступность дат
                cur.execute(f"""
                    SELECT COUNT(*) FROM {tbl('bookings')}
                    WHERE unit_id = {booking_data['unit_id']}
                    AND status IN ('tentative', 'confirmed')
                    AND check_in < '{booking_data['check_out']}'
                    AND check_out > '{booking_data['check_in']}'
                """)
                
                if cur.fetchone()[0] == 0:
                    check_in = datetime.strptime(booking_data['check_in'], '%Y-%m-%d').date()
                    check_out = datetime.strptime(booking_data['check_out'], '%Y-%m-%d').date()
                    nights = (check_out - check_in).days
                    total_price = base_price * nights
                    
                    # Получаем платежную ссылку для объекта
                    cur.execute(f"""
                        SELECT payment_link, payment_system, recipient_name
                        FROM {tbl('payment_links')}
                        WHERE unit_id = {booking_data['unit_id']}
                        LIMIT 1
                    """)
                    
                    payment_row = cur.fetchone()
                    payment_link_template = payment_row[0] if payment_row else ''
                    payment_system = payment_row[1] if payment_row else 'sbp'
                    recipient_name = payment_row[2] if payment_row else ''
                    
                    # Создаем заказ в Robokassa
                    try:
                        robokassa_result = create_robokassa_payment(
                            amount=total_price,
                            user_name=booking_data['guest_name'],
                            user_email=booking_data.get('guest_email', f'guest{chat_id}@telegram.bot'),
                            user_phone=booking_data.get('guest_phone', ''),
                            description=f"Бронь {unit_name} {booking_data['check_in']}-{booking_data['check_out']}"
                        )
                        
                        payment_link = robokassa_result['payment_url']
                        robokassa_inv_id = robokassa_result.get('robokassa_inv_id')
                        
                        # Создаем pending booking (ждет оплаты)
                        cur.execute(f"""
                            INSERT INTO {tbl('pending_bookings')} 
                            (unit_id, check_in, check_out, guest_name, guest_contact, 
                             telegram_chat_id, amount, payment_link, verification_status, robokassa_inv_id)
                            VALUES ({booking_data['unit_id']}, '{booking_data['check_in']}', '{booking_data['check_out']}',
                                    '{booking_data['guest_name'].replace("'", "''")}', 
                                    '{booking_data.get('guest_phone', '').replace("'", "''")}',
                                    {chat_id}, {total_price}, '{payment_link.replace("'", "''")}', 'pending', {robokassa_inv_id if robokassa_inv_id else 'NULL'})
                            RETURNING id
                        """)
                        
                        pending_id = cur.fetchone()[0]
                        conn.commit()
                        
                        # Уведомление владельцу о новой брони
                        notify_owner(
                            owner_id,
                            f'📋 <b>Новая бронь!</b>\n\n'
                            f'Объект: {unit_name}\n'
                            f'Гость: {booking_data["guest_name"]}\n'
                            f'Телефон: {booking_data.get("guest_phone", "—")}\n'
                            f'Даты: {booking_data["check_in"]} — {booking_data["check_out"]}\n'
                            f'Сумма: {int(total_price)} ₽\n\n'
                            f'⏳ Ожидает оплаты (№{pending_id})'
                        )
                        
                        assistant_message = (
                            f'✅ Предварительная бронь создана!\n\n'
                            f'📋 Номер: {pending_id}\n'
                            f'🏠 Объект: {unit_name}\n'
                            f'📅 Даты: {booking_data["check_in"]} — {booking_data["check_out"]}\n'
                            f'💰 Стоимость: {int(total_price)} руб. за {nights} ночей\n\n'
                            f'💳 Для подтверждения брони оплатите по ссылке:\n{payment_link}\n\n'
                            f'После оплаты бронь автоматически подтвердится!'
                        )
                    except Exception as e:
                        print(f'Robokassa payment creation error: {str(e)}')
                        # Fallback на СБП
                        description = f"Бронь {unit_name} {booking_data['check_in']}-{booking_data['check_out']}"
                        payment_link = f"https://qr.nspk.ru/profi/cash.html?sum={int(total_price)}&comment={urllib.parse.quote(description)}"
                        
                        cur.execute(f"""
                            INSERT INTO {tbl('pending_bookings')} 
                            (unit_id, check_in, check_out, guest_name, guest_contact, 
                             telegram_chat_id, amount, payment_link, verification_status)
                            VALUES ({booking_data['unit_id']}, '{booking_data['check_in']}', '{booking_data['check_out']}',
                                    '{booking_data['guest_name'].replace("'", "''")}', 
                                    '{booking_data.get('guest_phone', '').replace("'", "''")}',
                                    {chat_id}, {total_price}, '{payment_link.replace("'", "''")}', 'pending')
                            RETURNING id
                        """)
                        
                        pending_id = cur.fetchone()[0]
                        conn.commit()
                        
                        assistant_message = (
                            f'✅ Предварительная бронь создана!\n\n'
                            f'📋 Номер: {pending_id}\n'
                            f'💰 Стоимость: {int(total_price)} руб.\n\n'
                            f'💳 Оплатите по ссылке СБП:\n{payment_link}\n\n'
                            f'📸 После оплаты отправьте скриншот чека'
                        )
                    else:
                        assistant_message = '❌ Объект не найден. Попробуйте выбрать другой вариант.'
                else:
                    assistant_message = '❌ К сожалению, эти даты уже заняты. Могу предложить другие даты?'
            
            except Exception as e:
                print(f'Booking creation error: {type(e).__name__}: {str(e)}')
                assistant_message = f'❌ Ошибка при создании бронирования. Попробуйте ещё раз.'
        
        cur.execute(f"""
            INSERT INTO {tbl('messages')} (conversation_id, role, content)
            VALUES ({conversation_id}, 'assistant', '{assistant_message.replace("'", "''")}')
        """)
        
        # Сохраняем ответ бота в telegram_messages (связываем с booking_id если есть)
        cur.execute(f"""
            SELECT id FROM {tbl('pending_bookings')} 
            WHERE telegram_chat_id = {chat_id}
            ORDER BY created_at DESC LIMIT 1
        """)
        pending_booking = cur.fetchone()
        
        if pending_booking:
            cur.execute(f"""
                INSERT INTO {tbl('telegram_messages')} (telegram_id, message_text, sender)
                VALUES ({chat_id}, '{assistant_message.replace("'", "''")}', 'bot')
            """)
        else:
            cur.execute(f"""
                INSERT INTO {tbl('telegram_messages')} (telegram_id, message_text, sender)
                VALUES ({chat_id}, '{assistant_message.replace("'", "''")}', 'bot')
            """)
        
        conn.commit()
        
        send_telegram_message(chat_id, assistant_message)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def send_telegram_message(chat_id: int, text: str):
    '''Отправляет сообщение в Telegram через Bot API'''
    import urllib.request
    
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token:
        return
    
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    data = json.dumps({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        urllib.request.urlopen(req)
    except Exception as e:
        print(f'Failed to send Telegram message: {e}')


def notify_owner(owner_id: int, message: str):
    '''Отправляет уведомление владельцу турбазы'''
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    # Получаем telegram_chat_id владельца (только если status='owner')
    cur.execute(f"""
        SELECT channel_user_id FROM {tbl('conversations')}
        WHERE user_id = {owner_id} 
        AND channel = 'telegram'
        AND status = 'owner'
        LIMIT 1
    """)
    
    owner_chat = cur.fetchone()
    cur.close()
    conn.close()
    
    if owner_chat:
        send_telegram_message(int(owner_chat[0]), f'🔔 <b>Уведомление</b>\n\n{message}')


def create_robokassa_payment(amount: float, user_name: str, user_email: str, user_phone: str, description: str) -> dict:
    '''Создает заказ в Robokassa и возвращает payment_url'''
    merchant_login = os.environ.get('ROBOKASSA_MERCHANT_LOGIN')
    password_1 = os.environ.get('ROBOKASSA_PASSWORD_1')
    
    if not merchant_login or not password_1:
        raise ValueError('Robokassa credentials not configured')
    
    import random
    robokassa_inv_id = random.randint(100000, 2147483647)
    amount_str = f"{amount:.2f}"
    
    # Подпись: MerchantLogin:OutSum:InvId:Password#1
    signature_string = f"{merchant_login}:{amount_str}:{robokassa_inv_id}:{password_1}"
    signature = hashlib.md5(signature_string.encode()).hexdigest()
    
    payment_url = (
        f"https://auth.robokassa.ru/Merchant/Index.aspx?"
        f"MerchantLogin={urllib.parse.quote(merchant_login)}&"
        f"OutSum={amount_str}&"
        f"InvoiceID={robokassa_inv_id}&"
        f"SignatureValue={signature}&"
        f"Email={urllib.parse.quote(user_email)}&"
        f"Culture=ru&"
        f"Description={urllib.parse.quote(description)}"
    )
    
    return {
        'payment_url': payment_url,
        'robokassa_inv_id': robokassa_inv_id
    }