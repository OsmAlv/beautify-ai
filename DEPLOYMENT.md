# Deployment Guide - Beautify.AI

## Готовность приложения: ✅ 100%

Приложение полностью готово к развертыванию в production:
- ✅ Production build успешно скомпилирован
- ✅ Все файлы залиты на GitHub
- ✅ База данных Supabase настроена
- ✅ API ключи готовы

---

## Развертывание на Vercel (Рекомендуется)

### Шаг 1: Подключение GitHub к Vercel

1. Откройте https://vercel.com
2. Нажмите **Sign Up** или **Log In** 
3. Выберите **GitHub** для авторизации
4. Разрешите доступ к репозиторию **OsmAlv/beautify-ai**

### Шаг 2: Создание проекта в Vercel

1. На dashboard Vercel нажмите **Add New Project**
2. Найдите репозиторий **beautify-ai** и нажмите **Import**
3. Vercel автоматически определит, что это Next.js проект

### Шаг 3: Настройка переменных окружения

На экране **Environment Variables** добавьте следующие переменные:

```
NEXT_PUBLIC_SUPABASE_URL=https://fuqzkrsmeehyuhnrpwdf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[ВЗЯТЬ ИЗ SUPABASE]
SUPABASE_SERVICE_ROLE_KEY=[ВЗЯТЬ ИЗ SUPABASE]
WAVESPEED_API_KEY=[ТВОЙ WAVESPEED API KEY]
```

**Как получить значения из Supabase:**
1. Откройте https://app.supabase.com
2. Выберите проект **beautify-ai**
3. Перейдите в **Settings → API**
4. Скопируйте:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` → anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` → service_role key

### Шаг 4: Развертывание

1. Нажмите **Deploy**
2. Дождитесь завершения (обычно 2-3 минуты)
3. Vercel выдаст URL вида: `https://beautify-ai-*.vercel.app`

### Шаг 5: Проверка

После развертывания:
1. Откройте выданный URL
2. Протестируйте:
   - ✅ Авторизация (email + Google)
   - ✅ Генерация изображений
   - ✅ Профиль пользователя
   - ✅ Вывод генераций

---

## Альтернативные платформы

### Railway (Простая альтернатива)
1. Откройте https://railway.app
2. Подключите GitHub
3. Выберите репозиторий
4. Добавьте переменные окружения (аналогично Vercel)
5. Railway автоматически развернет

### Docker развертывание

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Production Checklist

- [ ] GitHub репозиторий синхронизирован
- [ ] Production build компилируется успешно
- [ ] Vercel проект создан
- [ ] Environment variables добавлены в Vercel
- [ ] Приложение развернуто и работает
- [ ] Авторизация функционирует
- [ ] API генерации работает
- [ ] База данных доступна из production

---

## Troubleshooting

### Ошибка: "Variables are not defined"
**Решение:** Проверьте, что все ENV переменные добавлены в Vercel Dashboard

### Ошибка: "Cannot connect to Supabase"
**Решение:** 
1. Проверьте SUPABASE_URL корректность
2. Проверьте API ключи не скопированы ошибочно
3. Убедитесь, что Supabase RLS политики позволяют доступ

### Ошибка: "Image generation fails"
**Решение:**
1. Проверьте WAVESPEED_API_KEY
2. Убедитесь, что API ключ активен в Wavespeed дашборде
3. Проверьте лимиты на API

### Slow deployment
**Решение:** Это нормально для первого развертывания (может быть 5-10 минут)

---

## Дополнительные команды

### Locaal запуск production build
```bash
npm run build
npm start
```

### Проверка лимитов и статуса
```bash
# Суммарный размер бандла
npm run analyze

# Скорость страниц
npm run build
next telemetry # для статистики
```

---

## Поддержка доменов

После успешного развертывания на Vercel можно добавить кастомный домен:

1. В Vercel Dashboard → Settings → Domains
2. Добавьте ваш домен
3. Обновите DNS записи у регистратора
4. Vercel автоматически выдаст SSL сертификат

---

**Статус готовности: ГОТОВО К РАЗВЕРТЫВАНИЮ** ✅

Просто следуйте шагам выше и приложение будет live за 5 минут!
