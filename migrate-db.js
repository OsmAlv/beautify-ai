#!/usr/bin/env node
/**
 * Миграция для обновления generation_logs таблицы в Supabase
 * Запустите: node migrate-db.js
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

// SQL команды для миграции
const migrationSQL = `
-- 1. Удаляем старую таблицу
DROP TABLE IF EXISTS generation_logs CASCADE;

-- 2. Создаём новую таблицу с правильной структурой
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

-- 3. Создаём индексы
CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at DESC);
`;

console.log(
  "📋 SQL миграция готова! Выполните это в Supabase SQL Editor:\n"
);
console.log("=" + "=".repeat(60));
console.log(migrationSQL);
console.log("=" + "=".repeat(60));

console.log("\n📍 Инструкции:");
console.log("1. Откройте https://supabase.com/dashboard");
console.log("2. Выберите проект fuqzkrsmeehyuhnrpwdf");
console.log("3. Перейдите в SQL Editor");
console.log("4. Создайте новый query");
console.log("5. Скопируйте и вставьте SQL выше");
console.log("6. Нажмите Run");

console.log("\n✅ После выполнения миграции перезагрузите сервер:");
console.log("   npm run dev");
