import json
import os
from datetime import datetime, timedelta
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """
    Pricing Engine API - централизованное управление динамическим ценообразованием.
    Поддерживает профили, правила, расчёт цен и логирование.
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return error_response('Database connection not configured', 500)
    
    # Извлечь owner_id из заголовков
    headers = event.get('headers') or {}
    owner_id_str = headers.get('x-owner-id') or headers.get('X-Owner-Id')
    owner_id = int(owner_id_str) if owner_id_str else None
    
    conn = psycopg2.connect(dsn)
    
    try:
        params = event.get('queryStringParameters') or {}
        action = params.get('action', 'get_profiles')
        
        if action == 'get_profiles':
            return get_pricing_profiles(conn)
        elif action == 'get_profile':
            profile_id = params.get('profile_id')
            return get_profile_details(conn, profile_id)
        elif action == 'get_rules':
            profile_id = params.get('profile_id')
            return get_profile_rules(conn, profile_id)
        elif action == 'calculate_price':
            unit_id = params.get('unit_id')
            date_str = params.get('date')
            return calculate_dynamic_price(conn, unit_id, date_str, owner_id)
        elif action == 'get_price_calendar':
            unit_id = params.get('unit_id')
            start_date = params.get('start_date')
            end_date = params.get('end_date')
            return get_price_calendar(conn, unit_id, start_date, end_date)
        elif action == 'get_logs':
            unit_id = params.get('unit_id')
            date_str = params.get('date')
            return get_price_logs(conn, unit_id, date_str)
        elif action == 'update_profile' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return update_pricing_profile(conn, body)
        elif action == 'update_rule' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return update_pricing_rule(conn, body)
        elif action == 'delete_rule' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return delete_pricing_rule(conn, body)
        elif action == 'toggle_dynamic' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return toggle_dynamic_pricing(conn, body)
        else:
            return error_response('Unknown action', 400)
            
    except Exception as e:
        return error_response(str(e), 500)
    finally:
        conn.close()


def get_pricing_profiles(conn) -> dict:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                pp.id, pp.name, pp.mode,
                pp.min_price, pp.max_price, pp.is_default, pp.enabled,
                COUNT(u.id) as units_count
            FROM pricing_profiles pp
            LEFT JOIN units u ON u.pricing_profile_id = pp.id
            GROUP BY pp.id
            ORDER BY pp.is_default DESC, pp.name
        """)
        profiles = cur.fetchall()
    
    return success_response({'profiles': profiles})


def get_profile_details(conn, profile_id: str) -> dict:
    if not profile_id:
        return error_response('profile_id required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT * FROM pricing_profiles WHERE id = %s
        """, (profile_id,))
        profile = cur.fetchone()
        
        if not profile:
            return error_response('Profile not found', 404)
        
        cur.execute("""
            SELECT * FROM pricing_rules 
            WHERE profile_id = %s 
            ORDER BY priority DESC, id
        """, (profile_id,))
        rules = cur.fetchall()
    
    return success_response({'profile': profile, 'rules': rules})


def get_profile_rules(conn, profile_id: str) -> dict:
    if not profile_id:
        return error_response('profile_id required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT * FROM pricing_rules 
            WHERE profile_id = %s 
            ORDER BY priority DESC, id
        """, (profile_id,))
        rules = cur.fetchall()
    
    return success_response({'rules': rules})


def calculate_dynamic_price(conn, unit_id: str, date_str: str, owner_id: int = None) -> dict:
    if not unit_id or not date_str:
        return error_response('unit_id and date required', 400)
    
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Если owner_id указан, проверяем владельца
        if owner_id:
            cur.execute("""
                SELECT 
                    u.id, u.name, u.base_price,
                    u.dynamic_pricing_enabled,
                    pp.id as profile_id, pp.mode,
                    pp.min_price as profile_min_price, pp.max_price as profile_max_price
                FROM units u
                LEFT JOIN pricing_profiles pp ON u.pricing_profile_id = pp.id
                WHERE u.id = %s AND u.owner_id = %s
            """, (unit_id, owner_id))
        else:
            cur.execute("""
                SELECT 
                    u.id, u.name, u.base_price,
                    u.dynamic_pricing_enabled,
                    pp.id as profile_id, pp.mode,
                    pp.min_price as profile_min_price, pp.max_price as profile_max_price
                FROM units u
                LEFT JOIN pricing_profiles pp ON u.pricing_profile_id = pp.id
                WHERE u.id = %s
            """, (unit_id,))
        unit = cur.fetchone()
        
        if not unit:
            return error_response('Unit not found or access denied', 404)
        
        if not unit['dynamic_pricing_enabled']:
            return success_response({
                'unit_id': int(unit_id),
                'date': date_str,
                'price': float(unit['base_price']),
                'original_price': float(unit['base_price']),
                'applied_rules': [],
                'source': 'manual',
                'dynamic_enabled': False
            })
        
        base_price = unit['base_price']
        min_price = unit['profile_min_price'] or base_price * Decimal('0.5')
        max_price = unit['profile_max_price'] or base_price * Decimal('2.0')
        
        cur.execute("""
            SELECT * FROM pricing_rules 
            WHERE profile_id = %s AND enabled = TRUE
            ORDER BY priority DESC
        """, (unit['profile_id'],))
        rules = cur.fetchall()
        
        occupancy = get_occupancy_rate(conn, unit_id, target_date)
        days_before = (target_date - datetime.now().date()).days
        day_of_week = target_date.weekday()
        
        current_price = Decimal(str(base_price))
        applied_rules = []
        
        for rule in rules:
            condition_met = check_rule_condition(
                rule, occupancy, days_before, day_of_week
            )
            
            if condition_met:
                original = current_price
                current_price = apply_rule_action(
                    current_price, rule['action_type'], 
                    rule['action_value'], rule['action_unit']
                )
                applied_rules.append({
                    'rule_id': rule['id'],
                    'rule_name': rule['name'],
                    'price_before': float(original),
                    'price_after': float(current_price),
                    'change': float(current_price - original)
                })
        
        final_price = max(min_price, min(max_price, current_price))
        
        cur.execute("""
            INSERT INTO price_calculation_logs 
            (unit_id, date, original_price, final_price, applied_rules, calculation_source)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (unit_id, date) 
            DO UPDATE SET 
                final_price = EXCLUDED.final_price,
                applied_rules = EXCLUDED.applied_rules,
                created_at = CURRENT_TIMESTAMP
        """, (
            unit_id, target_date, float(base_price), 
            float(final_price), json.dumps(applied_rules), 'automatic'
        ))
        conn.commit()
    
    return success_response({
        'unit_id': int(unit_id),
        'date': date_str,
        'price': float(final_price),
        'original_price': float(base_price),
        'applied_rules': applied_rules,
        'source': 'automatic',
        'dynamic_enabled': True,
        'occupancy': occupancy,
        'days_before': days_before
    })


def get_price_calendar(conn, unit_id: str, start_date: str, end_date: str) -> dict:
    if not unit_id or not start_date or not end_date:
        return error_response('unit_id, start_date, end_date required', 400)
    
    start = datetime.strptime(start_date, '%Y-%m-%d').date()
    end = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    calendar = []
    current = start
    
    while current <= end:
        result = calculate_dynamic_price(conn, unit_id, current.strftime('%Y-%m-%d'))
        if result['statusCode'] == 200:
            data = json.loads(result['body'])
            calendar.append(data)
        current += timedelta(days=1)
    
    return success_response({'calendar': calendar})


def get_price_logs(conn, unit_id: str, date_str: str = None) -> dict:
    if not unit_id:
        return error_response('unit_id required', 400)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if date_str:
            cur.execute("""
                SELECT * FROM price_calculation_logs
                WHERE unit_id = %s AND date = %s
                ORDER BY created_at DESC
                LIMIT 10
            """, (unit_id, date_str))
        else:
            cur.execute("""
                SELECT * FROM price_calculation_logs
                WHERE unit_id = %s
                ORDER BY date DESC, created_at DESC
                LIMIT 30
            """, (unit_id,))
        
        logs = cur.fetchall()
    
    return success_response({'logs': logs})


def update_pricing_profile(conn, data: dict) -> dict:
    profile_id = data.get('profile_id')
    
    with conn.cursor() as cur:
        if profile_id:
            cur.execute("""
                UPDATE pricing_profiles 
                SET name = %s, mode = %s,
                    min_price = %s, max_price = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data['name'], data['mode'],
                data['min_price'], data['max_price'], profile_id
            ))
        else:
            cur.execute("""
                INSERT INTO pricing_profiles 
                (name, mode, min_price, max_price, created_by)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                data['name'], data['mode'],
                data['min_price'], data['max_price'], data.get('user_id', 1)
            ))
            profile_id = cur.fetchone()[0]
        
        conn.commit()
    
    return success_response({'profile_id': profile_id, 'message': 'Profile updated'})


def update_pricing_rule(conn, data: dict) -> dict:
    rule_id = data.get('rule_id')
    
    with conn.cursor() as cur:
        if rule_id:
            cur.execute("""
                UPDATE pricing_rules 
                SET name = %s, condition_type = %s, condition_operator = %s,
                    condition_value = %s, action_type = %s, action_value = %s,
                    action_unit = %s, priority = %s, enabled = %s
                WHERE id = %s
            """, (
                data['name'], data['condition_type'], data['condition_operator'],
                json.dumps(data['condition_value']), data['action_type'], 
                data['action_value'], data['action_unit'], data['priority'],
                data.get('enabled', True), rule_id
            ))
        else:
            cur.execute("""
                INSERT INTO pricing_rules 
                (profile_id, name, condition_type, condition_operator, condition_value,
                 action_type, action_value, action_unit, priority)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                data['profile_id'], data['name'], data['condition_type'],
                data['condition_operator'], json.dumps(data['condition_value']),
                data['action_type'], data['action_value'], data['action_unit'],
                data.get('priority', 0)
            ))
            rule_id = cur.fetchone()[0]
        
        conn.commit()
    
    return success_response({'rule_id': rule_id, 'message': 'Rule updated'})


def delete_pricing_rule(conn, data: dict) -> dict:
    rule_id = data.get('rule_id')
    
    if not rule_id:
        return error_response('rule_id required', 400)
    
    with conn.cursor() as cur:
        cur.execute("DELETE FROM pricing_rules WHERE id = %s", (rule_id,))
        conn.commit()
    
    return success_response({'message': 'Rule deleted'})


def toggle_dynamic_pricing(conn, data: dict) -> dict:
    unit_id = data.get('unit_id')
    enabled = data.get('enabled', True)
    enable_all = data.get('enable_all', False)
    
    with conn.cursor() as cur:
        if enable_all:
            cur.execute("""
                UPDATE units 
                SET dynamic_pricing_enabled = %s
            """, (enabled,))
        elif unit_id:
            cur.execute("""
                UPDATE units 
                SET dynamic_pricing_enabled = %s
                WHERE id = %s
            """, (enabled, unit_id))
        else:
            return error_response('unit_id or enable_all required', 400)
        
        conn.commit()
    
    return success_response({'message': 'Dynamic pricing updated'})


def get_occupancy_rate(conn, unit_id: str, date) -> float:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT COUNT(*) FROM bookings
            WHERE unit_id = %s 
            AND status = 'confirmed'
            AND check_in <= %s 
            AND check_out > %s
        """, (unit_id, date, date))
        
        booked = cur.fetchone()[0]
        return min(100.0, booked * 100.0)


def check_rule_condition(rule: dict, occupancy: float, days_before: int, day_of_week: int) -> bool:
    condition_type = rule['condition_type']
    operator = rule['condition_operator']
    value = rule['condition_value']
    
    if condition_type == 'occupancy':
        threshold = value.get('threshold', 0)
        return compare_values(occupancy, operator, threshold)
    
    elif condition_type == 'days_before':
        days = value.get('days', 0)
        occupancy_max = value.get('occupancy_max', 100)
        return compare_values(days_before, operator, days) and occupancy <= occupancy_max
    
    elif condition_type == 'day_of_week':
        allowed_days = value.get('days', [])
        return day_of_week in allowed_days
    
    return False


def compare_values(actual, operator: str, threshold) -> bool:
    if operator == '>':
        return actual > threshold
    elif operator == '<':
        return actual < threshold
    elif operator == '>=':
        return actual >= threshold
    elif operator == '<=':
        return actual <= threshold
    elif operator == '=':
        return actual == threshold
    return False


def apply_rule_action(price: Decimal, action_type: str, value: float, unit: str) -> Decimal:
    value_decimal = Decimal(str(value))
    
    if action_type == 'increase':
        if unit == 'percent':
            return price * (Decimal('1') + value_decimal / Decimal('100'))
        else:
            return price + value_decimal
    
    elif action_type == 'decrease':
        if unit == 'percent':
            return price * (Decimal('1') - value_decimal / Decimal('100'))
        else:
            return price - value_decimal
    
    elif action_type == 'set':
        return value_decimal
    
    return price


def success_response(data: dict) -> dict:
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, default=str),
        'isBase64Encoded': False
    }


def error_response(message: str, status_code: int) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }