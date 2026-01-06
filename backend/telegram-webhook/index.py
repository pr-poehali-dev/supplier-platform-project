import json
import os
import re
from datetime import datetime
import psycopg2
import boto3
import requests
from uuid import uuid4


def handler(event: dict, context) -> dict:
    """
    Webhook для автоматического импорта постов из Telegram канала в блог.
    Поддерживает определение категорий через курсив в конце поста.
    """
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    try:
        body = json.loads(event.get('body', '{}'))
        
        # Проверяем наличие сообщения из канала
        if 'channel_post' not in body:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'status': 'ignored', 'reason': 'not a channel post'})
            }

        post = body['channel_post']
        message_id = post.get('message_id')
        text = post.get('text', '') or post.get('caption', '')
        
        if not text:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'status': 'ignored', 'reason': 'no text'})
            }

        # Извлекаем категорию из курсивного текста в конце
        category = extract_category(text)
        
        # Убираем тег категории из текста
        clean_text = remove_category_tag(text)
        
        # Разбиваем на заголовок и контент
        lines = clean_text.strip().split('\n', 1)
        title = lines[0].strip()
        content = lines[1].strip() if len(lines) > 1 else ''
        excerpt = content[:200] + '...' if len(content) > 200 else content

        # Обработка изображения
        image_url = None
        if 'photo' in post:
            # Берём фото максимального размера
            photos = post['photo']
            largest_photo = max(photos, key=lambda p: p.get('file_size', 0))
            file_id = largest_photo.get('file_id')
            
            # Загружаем фото из Telegram и сохраняем в S3
            image_url = download_and_upload_photo(file_id)

        # Определяем тип канала (пока все free, premium добавим позже)
        channel_type = 'free'

        # Сохраняем в базу данных
        save_to_database(
            telegram_message_id=message_id,
            channel_type=channel_type,
            title=title,
            content=content,
            excerpt=excerpt,
            image_url=image_url,
            category=category,
            published_at=datetime.fromtimestamp(post.get('date', 0))
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'status': 'success',
                'message_id': message_id,
                'category': category,
                'title': title
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def extract_category(text: str) -> str:
    """
    Извлекает категорию из курсивного текста в конце поста.
    Примеры: *новость*, _новость_, *статья*
    """
    valid_categories = ['новость', 'статья', 'блог', 'тренды', 'интервью']
    
    # Ищем курсивный текст в конце (Markdown: *text* или _text_)
    patterns = [
        r'\*([а-яё]+)\*\s*$',  # *новость*
        r'_([а-яё]+)_\s*$',    # _новость_
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            category = match.group(1)
            if category in valid_categories:
                return category
    
    return 'статья'  # По умолчанию


def remove_category_tag(text: str) -> str:
    """Удаляет тег категории из конца текста"""
    patterns = [
        r'\*[а-яё]+\*\s*$',
        r'_[а-яё]+_\s*$',
    ]
    
    for pattern in patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text.strip()


def download_and_upload_photo(file_id: str) -> str:
    """
    Загружает фото из Telegram и сохраняет в S3.
    Возвращает публичный URL изображения.
    """
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not bot_token:
        return None
    
    try:
        # Получаем информацию о файле
        file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"
        file_info_response = requests.get(file_info_url, timeout=10)
        file_info = file_info_response.json()
        
        if not file_info.get('ok'):
            return None
        
        file_path = file_info['result']['file_path']
        
        # Скачиваем файл
        file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
        file_response = requests.get(file_url, timeout=30)
        
        if file_response.status_code != 200:
            return None
        
        # Определяем расширение файла
        file_ext = file_path.split('.')[-1] if '.' in file_path else 'jpg'
        unique_filename = f"blog/{uuid4()}.{file_ext}"
        
        # Загружаем в S3
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        
        s3.put_object(
            Bucket='files',
            Key=unique_filename,
            Body=file_response.content,
            ContentType=f'image/{file_ext}'
        )
        
        # Формируем публичный URL
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_filename}"
        return cdn_url
        
    except Exception as e:
        # В случае ошибки возвращаем None, чтобы пост сохранился без картинки
        print(f"Error downloading photo: {e}")
        return None


def save_to_database(
    telegram_message_id: int,
    channel_type: str,
    title: str,
    content: str,
    excerpt: str,
    image_url: str,
    category: str,
    published_at: datetime
):
    """Сохраняет пост в базу данных"""
    db_url = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(f"""
                INSERT INTO {schema}.blog_posts 
                (telegram_message_id, channel_type, title, content, excerpt, image_url, category, published_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (telegram_message_id) DO UPDATE
                SET title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    excerpt = EXCLUDED.excerpt,
                    image_url = EXCLUDED.image_url,
                    category = EXCLUDED.category,
                    updated_at = NOW()
            """, (telegram_message_id, channel_type, title, content, excerpt, image_url, category, published_at))
        conn.commit()
    finally:
        conn.close()