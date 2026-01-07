import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    """
    API для получения списка постов блога из базы данных.
    Поддерживает фильтрацию по категории и типу канала (free/premium).
    """
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }

    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        params = event.get('queryStringParameters') or {}
        category = params.get('category')  # Фильтр по категории
        channel_type = params.get('channel_type', 'free')  # free или premium
        limit = int(params.get('limit', 20))  # Количество постов
        offset = int(params.get('offset', 0))  # Для пагинации

        posts = get_blog_posts(category, channel_type, limit, offset)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'posts': posts,
                'total': len(posts)
            }, default=str)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def get_blog_posts(category: str, channel_type: str, limit: int, offset: int) -> list:
    """Получает список постов из базы данных"""
    db_url = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = f"""
                SELECT 
                    id,
                    title,
                    excerpt,
                    content,
                    image_url,
                    video_url,
                    media_type,
                    category,
                    channel_type,
                    published_at,
                    created_at
                FROM {schema}.blog_posts
                WHERE channel_type = %s
            """
            params = [channel_type]
            
            if category:
                query += " AND category = %s"
                params.append(category)
            
            query += " ORDER BY published_at DESC LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cur.execute(query, params)
            posts = cur.fetchall()
            
            # Преобразуем RealDictRow в обычные словари
            return [dict(post) for post in posts]
    finally:
        conn.close()