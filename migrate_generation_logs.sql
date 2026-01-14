-- Проверяем текущую структуру таблицы generation_logs
-- DROP TABLE generation_logs; -- Раскомментируйте если нужно пересоздать с нуля

-- Удаляем старую таблицу если она существует (внимание - потеря данных!)
DROP TABLE IF EXISTS generation_logs CASCADE;

-- Создаём новую таблицу с правильной структурой
CREATE TABLE generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(50) NOT NULL,
  environment VARCHAR(50),
  cost DECIMAL(18, 8) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  wavespeed_request_id VARCHAR(255),
  original_image_url TEXT
);

-- Индекс для быстрого поиска по пользователю
CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at DESC);
