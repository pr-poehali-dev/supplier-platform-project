-- Добавляем уникальный индекс для conversations
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_channel_user 
ON conversations(channel, channel_user_id);