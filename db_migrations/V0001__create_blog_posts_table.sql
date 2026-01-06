CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    telegram_message_id BIGINT UNIQUE NOT NULL,
    channel_type VARCHAR(20) NOT NULL DEFAULT 'free',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'статья',
    published_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_channel_type ON blog_posts(channel_type);

COMMENT ON TABLE blog_posts IS 'Статьи блога, автоматически импортируемые из Telegram канала';
COMMENT ON COLUMN blog_posts.telegram_message_id IS 'ID сообщения в Telegram для предотвращения дубликатов';
COMMENT ON COLUMN blog_posts.channel_type IS 'Тип канала: free или premium';
COMMENT ON COLUMN blog_posts.category IS 'Категория: новость, статья, блог, тренды, интервью';