# 📋 Инструкция по миграции БД

## Проблема
Таблица `generation_logs` в Supabase имеет старую структуру. Нужно добавить новые колонки для хранения Wavespeed request IDs вместо полных image URLs.

## Решение

### Вариант 1: Используя Supabase SQL Editor (РЕКОМЕНДУЕТСЯ)

1. **Откройте Supabase Dashboard**
   - Перейдите на https://supabase.com/dashboard
   - Выберите проект `fuqzkrsmeehyuhnrpwdf`

2. **Откройте SQL Editor**
   - В левом боковом меню нажмите "SQL Editor"
   - Нажмите "New query"

3. **Скопируйте и выполните SQL**
   ```sql
   -- Добавляем новые колонки
   ALTER TABLE generation_logs
   ADD COLUMN IF NOT EXISTS wavespeed_request_id VARCHAR(255),
   ADD COLUMN IF NOT EXISTS original_image_url TEXT;

   -- Создаём индекс для быстрого поиска
   CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at DESC);
   ```

4. **Нажмите "Run"** (или Ctrl+Enter)

### Вариант 2: Используя файл миграции

```bash
# Скопируйте содержимое migration-add-columns.sql
# и выполните в Supabase SQL Editor
```

## ✅ Проверка

После миграции перезагрузите сервер:
```bash
npm run dev
```

Должны работать:
- ✓ Загрузка и обработка изображений
- ✓ Сохранение в БД
- ✓ Просмотр истории в профиле

## 🔄 Полное пересоздание таблицы (если нужно)

Если хотите полностью пересоздать таблицу (потеря всех данных):

```sql
DROP TABLE IF EXISTS generation_logs CASCADE;

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

CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at DESC);
```

## 📝 Примечания

- Если колонки уже существуют, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` ничего не сделает
- Индекс улучшит производительность поиска по датам
- Старая колонка `image_url` остаётся для совместимости (можно удалить позже)

---

**Нужна помощь?** Посмотрите логи сервера: `npm run dev`
