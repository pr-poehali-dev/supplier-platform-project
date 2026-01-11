import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''Вспомогательная функция для удаления объектов с каскадным удалением связанных данных'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'DELETE':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    unit_id = query_params.get('unit_id')
    
    if not unit_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'unit_id is required'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
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
            'body': json.dumps({'message': 'Unit deleted successfully', 'unit_id': int(unit_id)}),
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
    finally:
        cur.close()
        conn.close()
