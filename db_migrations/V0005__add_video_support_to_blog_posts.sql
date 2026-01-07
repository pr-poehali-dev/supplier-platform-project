-- Добавляем поля для хранения видео из Telegram
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'image';

COMMENT ON COLUMN blog_posts.video_url IS 'URL видео из Telegram';
COMMENT ON COLUMN blog_posts.media_type IS 'Тип медиа: image, video, или none';

-- Обновляем существующие записи
UPDATE blog_posts 
SET media_type = CASE 
    WHEN image_url IS NOT NULL THEN 'image' 
    ELSE 'none' 
END
WHERE media_type IS NULL OR media_type = 'image';