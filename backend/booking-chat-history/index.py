"""Получение истории чата Telegram для конкретного бронирования."""
import json
import os
import base64

import psycopg2
from jwt_utils import get_user_id


# =============================================================================
# CONSTANTS
# =============================================================================

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
    'Content-Type': 'application/json'
}


# =============================================================================
# DATABASE
# =============================================================================

def get_connection():
    """Get database connection."""
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_schema() -> str:
    """Get database schema prefix."""
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    return f"{schema}." if schema else ""


# =============================================================================
# HANDLER
# =============================================================================

def handler(event, context):
    """
    Получение истории чата из Telegram для конкретного бронирования.
    
    Query params:
    - booking_id: ID бронирования
    
    Возвращает:
    - История сообщений из telegram_messages
    - Информацию о госте
    """
    
    # CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if event.get('httpMethod') != 'GET':
        return {
            'statusCode': 405,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Method not allowed'})
        }

    # Extract auth token
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    if not auth_header:
        return {
            'statusCode': 401,
            'headers': HEADERS,
            'body': json.dumps({'error': 'Unauthorized'})
        }

    # Extract user_id from JWT token
    try:
        user_id = get_user_id(auth_header)
    except ValueError as e:
        return {
            'statusCode': 401,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }

    # Get booking_id from query params
    query_params = event.get('queryStringParameters') or {}
    booking_id = query_params.get('booking_id')

    if not booking_id:
        return {
            'statusCode': 400,
            'headers': HEADERS,
            'body': json.dumps({'error': 'booking_id is required'})
        }

    S = get_schema()
    conn = get_connection()

    try:
        cur = conn.cursor()

        # Get booking info and verify ownership
        cur.execute(f"""
            SELECT id, guest_name, guest_phone, guest_email, owner_id
            FROM {S}bookings
            WHERE id = %s
        """, (booking_id,))

        booking = cur.fetchone()
        if not booking:
            conn.close()
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Booking not found'})
            }

        b_id, guest_name, guest_phone, guest_email, owner_id = booking

        # Verify ownership
        if owner_id != user_id:
            conn.close()
            return {
                'statusCode': 403,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Access denied'})
            }

        # Get telegram messages by telegram_id (phone-based) or booking_id
        # Try to find messages by guest_phone first
        telegram_id = None
        if guest_phone:
            # Find telegram_id from conversations
            cur.execute(f"""
                SELECT DISTINCT external_chat_id
                FROM {S}conversations
                WHERE guest_phone = %s AND channel = 'telegram'
                LIMIT 1
            """, (guest_phone,))
            conv = cur.fetchone()
            if conv:
                telegram_id = conv[0]

        messages = []
        
        # Get messages by booking_id first
        cur.execute(f"""
            SELECT id, telegram_id, sender, message_text, created_at
            FROM {S}telegram_messages
            WHERE booking_id = %s
            ORDER BY created_at ASC
        """, (booking_id,))
        
        for row in cur.fetchall():
            messages.append({
                'id': row[0],
                'telegram_id': row[1],
                'sender': row[2],
                'message': row[3],
                'timestamp': row[4].isoformat() if row[4] else None
            })

        # If no messages by booking_id, try by telegram_id
        if not messages and telegram_id:
            cur.execute(f"""
                SELECT id, telegram_id, sender, message_text, created_at
                FROM {S}telegram_messages
                WHERE telegram_id = %s
                ORDER BY created_at ASC
                LIMIT 100
            """, (int(telegram_id),))
            
            for row in cur.fetchall():
                messages.append({
                    'id': row[0],
                    'telegram_id': row[1],
                    'sender': row[2],
                    'message': row[3],
                    'timestamp': row[4].isoformat() if row[4] else None
                })

        conn.close()

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({
                'booking': {
                    'id': b_id,
                    'guest_name': guest_name,
                    'guest_phone': guest_phone,
                    'guest_email': guest_email
                },
                'messages': messages,
                'total_messages': len(messages)
            })
        }

    except Exception as e:
        conn.close()
        return {
            'statusCode': 500,
            'headers': HEADERS,
            'body': json.dumps({'error': str(e)})
        }
