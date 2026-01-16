import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''
    API для блога TOURCONNECT - получение списка постов и отдельных статей
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        query_params = event.get('queryStringParameters') or {}
        
        if method == 'GET':
            post_id = query_params.get('id')
            
            if post_id:
                cur.execute(f"""
                    SELECT id, title, content, excerpt, image_url, video_url, media_type,
                           category, channel_type, published_at, created_at
                    FROM blog_posts
                    WHERE id = {post_id}
                """)
                
                row = cur.fetchone()
                if not row:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пост не найден'}),
                        'isBase64Encoded': False
                    }
                
                post = {
                    'id': row[0],
                    'title': row[1],
                    'content': row[2],
                    'excerpt': row[3],
                    'image_url': row[4],
                    'video_url': row[5],
                    'media_type': row[6],
                    'category': row[7],
                    'channel_type': row[8],
                    'published_at': row[9].isoformat() if row[9] else None,
                    'created_at': row[10].isoformat() if row[10] else None
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'post': post}),
                    'isBase64Encoded': False
                }
            
            limit = int(query_params.get('limit', 20))
            offset = int(query_params.get('offset', 0))
            category = query_params.get('category', '')
            channel_type = query_params.get('channel_type', 'free')
            
            where_clauses = [f"channel_type = '{channel_type}'"]
            if category:
                where_clauses.append(f"category = '{category}'")
            
            where_sql = ' AND '.join(where_clauses)
            
            cur.execute(f"""
                SELECT id, title, excerpt, image_url, video_url, media_type,
                       category, channel_type, published_at
                FROM blog_posts
                WHERE {where_sql}
                ORDER BY published_at DESC
                LIMIT {limit} OFFSET {offset}
            """)
            
            posts = []
            for row in cur.fetchall():
                posts.append({
                    'id': row[0],
                    'title': row[1],
                    'excerpt': row[2],
                    'image_url': row[3],
                    'video_url': row[4],
                    'media_type': row[5],
                    'category': row[6],
                    'channel_type': row[7],
                    'published_at': row[8].isoformat() if row[8] else None
                })
            
            cur.execute(f"SELECT COUNT(*) FROM blog_posts WHERE {where_sql}")
            total = cur.fetchone()[0]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'posts': posts, 'total': total}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()