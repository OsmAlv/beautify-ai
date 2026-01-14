-- Создать таблицу пользователей
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  is_superuser BOOLEAN DEFAULT FALSE,
  nippies_balance DECIMAL(18, 8) DEFAULT 0,
  pretty_generations_remaining INT DEFAULT 5,
  hot_generations_remaining INT DEFAULT 1,
  total_spent DECIMAL(18, 8) DEFAULT 0
);

-- Таблица для логирования генераций
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

-- Таблица для транзакций (пополнение баланса)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(18, 8) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
