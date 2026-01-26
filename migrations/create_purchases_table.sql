-- Создаем таблицу для хранения истории покупок
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  nippies_added INTEGER NOT NULL DEFAULT 0,
  pretty_generations_added INTEGER NOT NULL DEFAULT 0,
  hot_generations_added INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'crypto',
  payment_amount DECIMAL(10, 2),
  payment_currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);

-- Индекс для сортировки по дате
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- Включаем RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свои покупки
CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: только сервисная роль может вставлять записи
CREATE POLICY "Service role can insert purchases"
  ON purchases FOR INSERT
  WITH CHECK (true);
