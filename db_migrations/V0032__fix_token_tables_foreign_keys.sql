-- Исправление foreign key для таблиц токенов - должны ссылаться на users, а не email_users

-- Удаляем старые неправильные foreign keys
ALTER TABLE email_verification_tokens DROP CONSTRAINT IF EXISTS email_verification_tokens_user_id_fkey;
ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
ALTER TABLE password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;

-- Добавляем правильные foreign keys на таблицу users
ALTER TABLE email_verification_tokens ADD CONSTRAINT email_verification_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);
    
ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);
    
ALTER TABLE password_reset_tokens ADD CONSTRAINT password_reset_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);