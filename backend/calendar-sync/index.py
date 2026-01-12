import json
import os
import psycopg2
from datetime import datetime, timedelta
import requests
import re

def handler(event: dict, context) -> dict:
    '''
    API для синхронизации календарей бронирования с внешними площадками (Авито, Яндекс Путешествия).
    Импортирует занятые даты через iCal, экспортирует наш календарь в iCal формате.
    Автосинхронизация каждые 30 минут через frontend.
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
        
        if method == 'GET' and action == 'calendar-export':
            unit_id = query_params.get('unit_id')
            
            if not unit_id:
                return error_response('unit_id обязателен', 400)
            
            cur.execute(f"""
                SELECT check_in, check_out, guest_name, id
                FROM bookings
                WHERE unit_id = {unit_id} 
                AND status IN ('confirmed', 'pending')
                AND check_out >= CURRENT_DATE
                ORDER BY check_in
            """)
            
            bookings = cur.fetchall()
            ical = generate_ical(bookings, unit_id)
            
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
        
        if method == 'GET' and action == 'calendar-sync-list':
            cur.execute("""
                SELECT id, unit_id, platform, calendar_url, is_active, last_sync_at
                FROM calendar_syncs
                ORDER BY unit_id, platform
            """)
            
            syncs = []
            for row in cur.fetchall():
                syncs.append({
                    'id': row[0],
                    'unit_id': row[1],
                    'platform': row[2],
                    'calendar_url': row[3] or '',
                    'is_active': row[4],
                    'last_sync_at': row[5].isoformat() if row[5] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'syncs': syncs}),
                'isBase64Encoded': False
            }
        
        if method == 'POST' and action == 'calendar-sync-add':
            body = json.loads(event.get('body', '{}'))
            unit_id = body.get('unit_id')
            platform = body.get('platform')
            calendar_url = body.get('calendar_url', '')
            
            if not unit_id or not platform:
                return error_response('unit_id и platform обязательны', 400)
            
            cur.execute(f"""
                INSERT INTO calendar_syncs (unit_id, platform, calendar_url, is_active, created_at)
                VALUES ({unit_id}, '{platform}', '{calendar_url.replace("'", "''")}', true, NOW())
                RETURNING id
            """)
            
            sync_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': sync_id, 'message': 'Синхронизация добавлена'}),
                'isBase64Encoded': False
            }
        
        if method == 'PUT' and action == 'calendar-sync-update':
            body = json.loads(event.get('body', '{}'))
            sync_id = body.get('id')
            calendar_url = body.get('calendar_url')
            is_active = body.get('is_active')
            
            if not sync_id:
                return error_response('id обязателен', 400)
            
            updates = []
            if calendar_url is not None:
                updates.append(f"calendar_url = '{calendar_url.replace(\"'\", \"''\")}'"  )
            if is_active is not None:
                updates.append(f"is_active = {str(is_active).lower()}")
            
            if updates:
                cur.execute(f"""
                    UPDATE calendar_syncs
                    SET {', '.join(updates)}
                    WHERE id = {sync_id}
                """)
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Обновлено'}),
                'isBase64Encoded': False
            }
        
        if method == 'DELETE' and action == 'calendar-sync-delete':
            body = json.loads(event.get('body', '{}'))
            sync_id = body.get('id')
            
            if not sync_id:
                return error_response('id обязателен', 400)
            
            cur.execute(f"DELETE FROM calendar_syncs WHERE id = {sync_id}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Удалено'}),
                'isBase64Encoded': False
            }
        
        if method == 'POST' and action == 'calendar-sync-now':
            body = json.loads(event.get('body', '{}'))
            sync_id = body.get('id')
            
            if not sync_id:
                return error_response('id обязателен', 400)
            
            cur.execute(f"""
                SELECT unit_id, platform, calendar_url, is_active
                FROM calendar_syncs
                WHERE id = {sync_id}
            """)
            
            sync_row = cur.fetchone()
            if not sync_row:
                return error_response('Синхронизация не найдена', 404)
            
            unit_id, platform, calendar_url, is_active = sync_row
            
            if not is_active or not calendar_url:
                return error_response('Синхронизация отключена или URL не указан', 400)
            
            imported_count = import_from_ical(cur, conn, unit_id, platform, calendar_url)
            
            cur.execute(f"""
                UPDATE calendar_syncs
                SET last_sync_at = NOW()
                WHERE id = {sync_id}
            """)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'imported_events': imported_count, 'message': 'Синхронизация выполнена'}),
                'isBase64Encoded': False
            }
        
        return error_response('Unknown action', 400)
        
    except Exception as e:
        conn.rollback()
        return error_response(str(e), 500)
    finally:
        cur.close()
        conn.close()


def import_from_ical(cur, conn, unit_id: int, platform: str, calendar_url: str) -> int:
    '''
    Загружает iCal по ссылке, парсит занятые даты, создаёт блокировки в календаре.
    Отправляет уведомление владельцу о каждой новой брони.
    '''
    try:
        response = requests.get(calendar_url, timeout=30)
        response.raise_for_status()
        ical_data = response.text
    except Exception as e:
        raise Exception(f'Ошибка загрузки iCal: {str(e)}')
    
    cur.execute(f"SELECT name FROM units WHERE id = {unit_id}")
    unit_result = cur.fetchone()
    unit_name = unit_result[0] if unit_result else f"Объект #{unit_id}"
    
    cur.execute(f"SELECT user_id FROM units WHERE id = {unit_id}")
    owner_result = cur.fetchone()
    owner_id = owner_result[0] if owner_result else None
    
    events = parse_ical(ical_data)
    imported = 0
    
    platform_names = {
        'avito': 'Авито',
        'yandex': 'Яндекс Путешествия',
        'booking': 'Booking.com'
    }
    platform_display = platform_names.get(platform, platform)
    
    for event in events:
        start_date = event['start']
        end_date = event['end']
        summary = event.get('summary', f'Бронь с {platform_display}')
        
        cur.execute(f"""
            SELECT id FROM bookings
            WHERE unit_id = {unit_id}
            AND check_in = '{start_date}'
            AND check_out = '{end_date}'
            AND source = '{platform}_sync'
        """)
        
        if cur.fetchone():
            continue
        
        cur.execute(f"""
            INSERT INTO bookings 
            (unit_id, guest_name, guest_phone, check_in, check_out, 
             guests_count, total_price, status, source, created_at)
            VALUES ({unit_id}, '{summary.replace("'", "''")}', '', 
                    '{start_date}', '{end_date}', 
                    1, 0, 'confirmed', '{platform}_sync', NOW())
            RETURNING id
        """)
        booking_id = cur.fetchone()[0]
        imported += 1
        
        if owner_id:
            notify_owner_about_sync(
                owner_id,
                f'🔔 <b>Новая бронь импортирована!</b>\n\n'
                f'📍 Площадка: {platform_display}\n'
                f'🏠 Объект: {unit_name}\n'
                f'📅 Даты: {start_date} — {end_date}\n'
                f'📝 {summary}\n\n'
                f'Бронь №{booking_id} автоматически добавлена в календарь.'
            )
    
    conn.commit()
    return imported


def notify_owner_about_sync(owner_id: int, message: str):
    '''
    Отправляет уведомление владельцу в Telegram о новой импортированной брони
    '''
    try:
        import psycopg2
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute(f"""
            SELECT channel_user_id FROM conversations
            WHERE user_id = {owner_id}
            AND channel = 'telegram'
            AND channel_user_id LIKE 'owner_%'
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        result = cur.fetchone()
        if result:
            owner_chat_id = result[0].replace('owner_', '')
            send_telegram_message(owner_chat_id, message)
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f'Ошибка отправки уведомления владельцу: {e}')


def send_telegram_message(chat_id: str, text: str):
    '''
    Отправляет сообщение в Telegram
    '''
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not bot_token:
        return
    
    try:
        url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        data = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }
        requests.post(url, json=data, timeout=10)
    except Exception as e:
        print(f'Ошибка отправки в Telegram: {e}')


def parse_ical(ical_text: str) -> list:
    '''
    Парсит iCalendar формат, извлекает события (VEVENT)
    '''
    events = []
    lines = ical_text.split('\n')
    current_event = {}
    in_event = False
    
    for line in lines:
        line = line.strip()
        
        if line == 'BEGIN:VEVENT':
            in_event = True
            current_event = {}
        elif line == 'END:VEVENT':
            in_event = False
            if 'start' in current_event and 'end' in current_event:
                events.append(current_event)
        elif in_event:
            if line.startswith('DTSTART'):
                date_match = re.search(r':(\d{8})', line)
                if date_match:
                    date_str = date_match.group(1)
                    current_event['start'] = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            elif line.startswith('DTEND'):
                date_match = re.search(r':(\d{8})', line)
                if date_match:
                    date_str = date_match.group(1)
                    current_event['end'] = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            elif line.startswith('SUMMARY'):
                summary = line.split(':', 1)[1] if ':' in line else 'Бронь'
                current_event['summary'] = summary
    
    return events


def generate_ical(bookings: list, unit_id: int) -> str:
    '''
    Генерирует iCalendar формат из списка бронирований
    '''
    now = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    
    ical = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TOURCONNECT//Booking Calendar//RU
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Календарь бронирований (Объект {unit_id})
X-WR-TIMEZONE:Europe/Moscow
"""
    
    for booking in bookings:
        check_in, check_out, guest_name, booking_id = booking
        
        start_str = check_in.strftime('%Y%m%d') if isinstance(check_in, datetime) else check_in.replace('-', '')
        end_str = check_out.strftime('%Y%m%d') if isinstance(check_out, datetime) else check_out.replace('-', '')
        
        ical += f"""BEGIN:VEVENT
UID:booking-{booking_id}@tourconnect.ru
DTSTAMP:{now}
DTSTART;VALUE=DATE:{start_str}
DTEND;VALUE=DATE:{end_str}
SUMMARY:Занято - {guest_name}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
"""
    
    ical += "END:VCALENDAR"
    return ical


def error_response(message: str, code: int) -> dict:
    return {
        'statusCode': code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }