import json
import os
import psycopg2
import jwt

def handler(event: dict, context) -> dict:
    '''
    API для администрирования: управление пользователями и постами блога.
    Требует админские права.
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    auth_header = headers.get('X-Authorization', headers.get('x-authorization', ''))
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No token provided'}),
            'isBase64Encoded': False
        }
    
    token = auth_header.replace('Bearer ', '')
    
    try:
        secret = os.environ.get('JWT_SECRET')
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute(f"SELECT is_admin FROM users WHERE id = {payload['user_id']}")
        admin_check = cur.fetchone()
        
        if not admin_check or not admin_check[0]:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Admin access required'}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            query_params = event.get('queryStringParameters', {}) or {}
            limit = int(query_params.get('limit', '100'))
            offset = int(query_params.get('offset', '0'))
            
            cur.execute(f"""
                SELECT id, email, full_name, provider, avatar_url, 
                       created_at, last_login, telegram_invited, is_admin
                FROM users
                ORDER BY created_at DESC
                LIMIT {limit} OFFSET {offset}
            """)
            
            users = []
            for row in cur.fetchall():
                users.append({
                    'id': row[0],
                    'email': row[1],
                    'full_name': row[2],
                    'provider': row[3],
                    'avatar_url': row[4],
                    'created_at': row[5].isoformat() if row[5] else None,
                    'last_login': row[6].isoformat() if row[6] else None,
                    'telegram_invited': row[7],
                    'is_admin': row[8]
                })
            
            cur.execute("SELECT COUNT(*) FROM users")
            total = cur.fetchone()[0]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'users': users,
                    'total': total,
                    'limit': limit,
                    'offset': offset
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            action = body.get('action')
            
            if action == 'toggle_admin':
                cur.execute(f"""
                    UPDATE users 
                    SET is_admin = NOT is_admin 
                    WHERE id = {user_id}
                    RETURNING is_admin
                """)
                new_status = cur.fetchone()[0]
                conn.commit()
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'is_admin': new_status}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            # Удаление поста блога
            query_params = event.get('queryStringParameters', {}) or {}
            post_id = query_params.get('post_id')
            
            if not post_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'post_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"DELETE FROM blog_posts WHERE id = {int(post_id)} RETURNING id")
            deleted = cur.fetchone()
            
            if not deleted:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Post not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Пост успешно удален'}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except jwt.ExpiredSignatureError:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Token expired'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }