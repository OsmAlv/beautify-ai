# Настройка Email Templates в Supabase

## 1. Откройте Supabase Dashboard
Перейдите: https://app.supabase.com/project/YOUR_PROJECT/auth/templates

## 2. Настройте "Confirm signup" template

### Включите Email Confirmations:
1. Перейдите в Authentication → Settings → Email Auth
2. Включите опцию "Enable email confirmations"
3. Сохраните изменения

### Настройте шаблон:
1. Перейдите в Authentication → Email Templates
2. Выберите "Confirm signup"
3. Скопируйте содержимое файла `email-templates/confirm-signup.html`
4. Вставьте в поле "Message (HTML)"
5. Убедитесь, что Subject примерно такой: "Confirm Your Email - Beautify.AI"
6. Сохраните

## 3. Настройте Redirect URLs

В Authentication → URL Configuration добавьте:

**Site URL:**
- Production: https://beautify-ai-omega.vercel.app
- Development: http://localhost:3000

**Redirect URLs (одна на строку):**
```
http://localhost:3000/**
https://beautify-ai-omega.vercel.app/**
```

## 4. Проверьте SMTP настройки

В Authentication → Settings → SMTP Settings:
- Используйте встроенный Supabase SMTP (работает из коробки)
- Или настройте свой SMTP (Gmail, SendGrid, etc.)

## 5. Тестирование

1. Зарегистрируйте нового пользователя
2. Проверьте почту (может попасть в спам)
3. Кликните на "Confirm Email"
4. Пользователь должен быть перенаправлен на главную страницу

## Важные переменные в шаблоне:

- `{{ .ConfirmationURL }}` - ссылка для подтверждения email (обязательно!)
- `{{ .SiteURL }}` - URL вашего сайта
- `{{ .Email }}` - email пользователя
- `{{ .Token }}` - токен подтверждения

## Troubleshooting

**Письмо не приходит:**
- Проверьте спам
- Проверьте SMTP настройки
- Проверьте логи в Supabase Dashboard

**Ссылка не работает:**
- Убедитесь что домен добавлен в Redirect URLs
- Проверьте что `{{ .ConfirmationURL }}` присутствует в шаблоне

**После подтверждения редирект не работает:**
- Проверьте callback route: `/app/auth/callback/route.ts`
- Должен быть настроен правильный redirect
