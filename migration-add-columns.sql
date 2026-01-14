-- Миграция для обновления таблицы generation_logs
-- Выполните эту команду в Supabase SQL Editor

-- Шаг 1: Добавляем новые колонки если их нет
ALTER TABLE generation_logs
ADD COLUMN IF NOT EXISTS wavespeed_request_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS original_image_url TEXT;

-- Шаг 2: Удаляем старую колонку image_url если она существует
-- (Раскомментируйте если нужно)
-- ALTER TABLE generation_logs DROP COLUMN IF EXISTS image_url;

-- Шаг 3: Создаём индекс на created_at если его нет (для быстрого поиска по датам)
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at DESC);

-- ✅ Миграция завершена!
