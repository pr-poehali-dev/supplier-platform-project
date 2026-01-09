import json
import os
import hashlib
import psycopg2
from urllib.parse import parse_qs
import urllib.request


def calculate_signature(*args) -> str:
    """Создание MD5 подписи по документации Robokassa"""
    joined = ':'.join(str(arg) for arg in args)
    return hashlib.md5(joined.encode()).hexdigest().upper()


def send_telegram_message(chat_id: int, text: str):
    '''Отправляет сообщение в Telegram через Bot API'''
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
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Получаем telegram_chat_id владельца (только если status='owner')
    cur.execute("""
        SELECT channel_user_id FROM conversations
        WHERE user_id = %s
        AND channel = 'telegram'
        AND status = 'owner'
        LIMIT 1
    """, (owner_id,))
    
    owner_chat = cur.fetchone()
    cur.close()
    conn.close()
    
    if owner_chat:
        send_telegram_message(int(owner_chat[0]), f'🔔 <b>Уведомление</b>\n\n{message}')


def get_db_connection():
    """Получение подключения к БД"""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(dsn)


HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/plain'
}


def handler(event: dict, context) -> dict:
    '''
    Result URL вебхук от Robokassa для подтверждения оплаты.
    Robokassa отправляет: OutSum, InvId, SignatureValue
    Returns: OK{InvId} если подпись верна и заказ обновлён
    '''
    method = event.get('httpMethod', 'GET').upper()

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': '', 'isBase64Encoded': False}

    password_2 = os.environ.get('ROBOKASSA_PASSWORD_2')
    if not password_2:
        return {'statusCode': 500, 'headers': HEADERS, 'body': 'Configuration error', 'isBase64Encoded': False}

    # Парсинг параметров из body или query string
    params = {}
    body = event.get('body', '')

    if method == 'POST' and body:
        if event.get('isBase64Encoded', False):
            import base64
            body = base64.b64decode(body).decode('utf-8')
        parsed = parse_qs(body)
        params = {k: v[0] for k, v in parsed.items()}

    if not params:
        params = event.get('queryStringParameters') or {}

    out_sum = params.get('OutSum', params.get('out_summ', ''))
    inv_id = params.get('InvId', params.get('inv_id', ''))
    signature_value = params.get('SignatureValue', params.get('crc', '')).upper()

    if not out_sum or not inv_id or not signature_value:
        return {'statusCode': 400, 'headers': HEADERS, 'body': 'Missing required parameters', 'isBase64Encoded': False}

    # Проверка подписи
    expected_signature = calculate_signature(out_sum, inv_id, password_2)
    if signature_value != expected_signature:
        return {'statusCode': 400, 'headers': HEADERS, 'body': 'Invalid signature', 'isBase64Encoded': False}

    # Обновление статуса заказа
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE orders
        SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE robokassa_inv_id = %s AND status = 'pending'
        RETURNING id, order_number, user_email
    """, (int(inv_id),))

    result = cur.fetchone()

    if not result:
        # Проверяем, может уже оплачен
        cur.execute("SELECT status FROM orders WHERE robokassa_inv_id = %s", (int(inv_id),))
        existing = cur.fetchone()
        conn.close()

        if existing and existing[0] == 'paid':
            return {'statusCode': 200, 'headers': HEADERS, 'body': f'OK{inv_id}', 'isBase64Encoded': False}
        return {'statusCode': 404, 'headers': HEADERS, 'body': 'Order not found', 'isBase64Encoded': False}

    conn.commit()
    
    # Проверяем, есть ли pending_booking с этим robokassa_inv_id
    cur.execute("""
        SELECT pb.id, pb.unit_id, pb.check_in, pb.check_out, pb.guest_name, pb.guest_contact, pb.telegram_chat_id, u.name
        FROM pending_bookings pb
        JOIN units u ON pb.unit_id = u.id
        WHERE pb.robokassa_inv_id = %s AND pb.verification_status = 'pending'
    """, (int(inv_id),))
    
    pending_booking = cur.fetchone()
    
    if pending_booking:
        pending_id, unit_id, check_in, check_out, guest_name, guest_contact, telegram_chat_id, unit_name = pending_booking
        
        # Создаем подтвержденное бронирование
        cur.execute("""
            INSERT INTO bookings 
            (unit_id, guest_name, guest_phone, check_in, check_out, 
             guests_count, total_price, status, source)
            VALUES (%s, %s, %s, %s, %s, 1, %s, 'confirmed', 'telegram')
            RETURNING id
        """, (unit_id, guest_name, guest_contact, check_in, check_out, float(out_sum)))
        
        booking_id = cur.fetchone()[0]
        
        # Обновляем pending_booking
        cur.execute("""
            UPDATE pending_bookings
            SET verification_status = 'verified',
                verification_notes = 'Robokassa payment confirmed'
            WHERE id = %s
        """, (pending_id,))
        
        conn.commit()
        
        # Отправляем уведомление клиенту
        if telegram_chat_id:
            send_telegram_message(
                telegram_chat_id,
                f'✅ <b>Оплата подтверждена!</b>\n\n'
                f'🎉 Ваше бронирование активировано (№{booking_id})\n'
                f'🏠 {unit_name}\n'
                f'📅 {check_in} — {check_out}\n\n'
                f'Ждем вас! При заезде назовите номер брони.'
            )
        
        # Уведомление владельцу
        cur.execute("SELECT created_by FROM units WHERE id = %s", (unit_id,))
        owner_id_row = cur.fetchone()
        if owner_id_row:
            owner_id = owner_id_row[0]
            notify_owner(
                owner_id,
                f'💰 <b>Оплата подтверждена!</b>\n\n'
                f'Объект: {unit_name}\n'
                f'Гость: {guest_name}\n'
                f'Даты: {check_in} — {check_out}\n'
                f'Сумма: {int(float(out_sum))} ₽\n'
                f'Бронь №{booking_id}'
            )
    
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': HEADERS, 'body': f'OK{inv_id}', 'isBase64Encoded': False}