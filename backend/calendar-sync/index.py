import json
import os
import psycopg2
from datetime import datetime
import requests

def handler(event: dict, context) -> dict:
    '''
    API для синхронизации календарей бронирования с внешними площадками.
    Поддерживает импорт и экспорт дат брони через iCalendar формат.
    Работает с Авито, Яндекс.Путешествиями и другими платформами.
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
        
        # GET /export - экспорт календаря
        if method == 'GET' and action == 'export':
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
            
            bookings = cur.fetchall()
            ical = generate_ical(bookings)
            
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
        
        # GET /get-sync-settings - настройки синхронизации
        if method == 'GET' and action == 'get-sync-settings':
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
        
        # POST /add-sync - добавить синхронизацию
        if method == 'POST' and action == 'add-sync':
            body = json.loads(event.get('body', '{}'))
            unit_id = body.get('unit_id')
            platform = body.get('platform')
            calendar_url = body.get('calendar_url', '')
            
            if not unit_id or not platform:
                return error_response('unit_id and platform are required', 400)
            
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
        
        # PUT /update-sync
        if method == 'PUT' and action == 'update-sync':
            body = json.loads(event.get('body', '{}'))
            sync_id = body.get('id')
            calendar_url = body.get('calendar_url')
            is_active = body.get('is_active')
            
            if not sync_id:
                return error_response('id is required', 400)
            
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
        
        # POST /sync-now
        if method == 'POST' and action == 'sync-now':
            body = json.loads(event.get('body', '{}'))
            sync_id = body.get('id')
            
            if not sync_id:
                return error_response('id is required', 400)
            
            cur.execute(f"""
                SELECT unit_id, platform, calendar_url, is_active
                FROM calendar_sync
                WHERE id = {sync_id}
            """)
            
            sync_row = cur.fetchone()
            if not sync_row:
                return error_response('Sync not found', 404)
            
            unit_id, platform, calendar_url, is_active = sync_row
            
            if not is_active or not calendar_url:
                return error_response('Sync is disabled or URL not set', 400)
            
            imported_count = import_from_ical(cur, unit_id, platform, calendar_url)
            
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
                    'imported_events': imported_count
                }),
                'isBase64Encoded': False
            }
        
        # GET /get-units
        if method == 'GET' and action == 'get-units':
            cur.execute("""
                SELECT id, name, type
                FROM units
                ORDER BY id
            """)
            
            units = []
            for row in cur.fetchall():
                units.append({'id': row[0], 'name': row[1], 'type': row[2]})
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'units': units}),
                'isBase64Encoded': False
            }
        
        return error_response('Unknown action', 400)
        
    except Exception as e:
        conn.rollback()
        return error_response(str(e), 500)
    
    finally:
        cur.close()
        conn.close()


def generate_ical(bookings) -> str:
    '''Генерирует iCalendar'''
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


def import_from_ical(cur, unit_id: int, platform: str, calendar_url: str) -> int:
    '''Импорт из внешнего календаря'''
    try:
        response = requests.get(calendar_url, timeout=10)
        response.raise_for_status()
        
        events = parse_ical(response.text)
        imported = 0
        
        for event in events:
            check_in = event['start']
            check_out = event['end']
            
            cur.execute(f"""
                SELECT COUNT(*)
                FROM bookings
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
        
        return imported
    except:
        return 0


def parse_ical(content: str):
    '''Парсер iCalendar'''
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
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }