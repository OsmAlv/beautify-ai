# 🔧 Инструкция по созданию таблицы промптов

## 1️⃣ Откройте Supabase Console
- Перейдите на https://app.supabase.com
- Выберите ваш проект: **beatify.ai** (fuqzkrsmeehyuhnrpwdf)
- Нажмите на **SQL Editor** в левом меню

## 2️⃣ Создайте новый SQL запрос
- Нажмите **New Query** 
- Скопируйте весь код ниже и вставьте:

```sql
-- Создать таблицу для промптов
CREATE TABLE IF NOT EXISTS public.prompts (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  
  model TEXT NOT NULL,
  intensity TEXT NOT NULL,
  environment TEXT,
  
  prompt_text TEXT NOT NULL,
  
  UNIQUE(model, intensity, environment)
);

-- Вставить дефолтные промпты для ByteDance
INSERT INTO public.prompts (model, intensity, environment, prompt_text) VALUES
('bytedance', 'pretty', NULL, 'Make this woman naturally more beautiful. Preserve all skin texture details, natural freckles, beauty marks and skin imperfections - keep them visible. Enhance skin tone subtly, brighten eyes gently, add subtle glow. Keep her natural facial features and expressions. Skin must look like real human skin, not plastic or overly smooth. Keep body proportions. Maintain original outfit. Remove any objects from hands and neck. Shot like iPhone 17 Pro Max. Photorealistic, natural, living appearance.'),
('bytedance', 'hot', 'original', 'Transform this woman into a stunningly attractive version of herself. Keep original background. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, NOT plastic. Keep body proportions, enhanced features but natural looking. Keep face expressions and personality. Remove any objects from hands and neck. Photorealistic result with natural human skin texture. Make this woman sexy, work with outfit to show tits and mark body lines.'),
('nanobana', 'pretty', NULL, 'Enhance this woman to make her stunningly naturally beautiful. Use advanced neural upscaling. Preserve all authentic skin texture, micro-details, freckles and natural imperfections. Subtly brighten eyes, enhance skin tone naturally, add soft luminous glow. Maintain original facial features, expressions and body proportions. Keep outfit intact. Premium iPhone 17 Pro Max photography. Ultra photorealistic with living, breathing human skin texture. No plastic look.'),
('nanobana', 'hot', 'original', 'Transform this woman into an absolutely stunning, enhanced version using advanced AI upscaling. Keep original background. CRUCIAL: Create ONE seamless professional photo - blend perfectly. Preserve micro skin details, texture, freckles, beauty marks. Enhance beauty significantly while keeping skin ultra-realistic and natural - NOT plastic. Maintain body proportions with enhanced definition. Keep facial personality. Remove hand/neck objects. Premium photorealistic result. Make her extremely attractive, work with her outfit styling to enhance her best features.')
ON CONFLICT (model, intensity, environment) DO NOTHING;
```

## 3️⃣ Нажмите ▶️ Run
- Запрос должен выполниться успешно (2 уведомления: CREATE TABLE + INSERT)

## 4️⃣ Проверьте таблицу
- В левом меню нажмите **Table Editor**
- Должна появиться таблица **prompts** с 4 строками

## 5️⃣ Перезагрузите приложение
- Обновите страницу админа: http://localhost:3000/spidoznie-kozyavki
- Теперь промпты должны загружаться!

---

**Если возникают вопросы:**
- Проверьте, что вы в правильном проекте
- Убедитесь, что вы вошли в Supabase как администратор
- Может потребоваться обновить страницу после выполнения SQL
