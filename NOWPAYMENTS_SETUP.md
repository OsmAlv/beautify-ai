# Настройка NOWPayments для Beautify.AI

## 1. Регистрация в NOWPayments

1. Перейдите на https://nowpayments.io/
2. Зарегистрируйтесь и подтвердите email
3. Пройдите в Dashboard

## 2. Получение API ключа

1. В Dashboard перейдите в Settings -> API
2. Скопируйте ваш API Key
3. Добавьте в `.env.local`:

```env
NOWPAYMENTS_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Настройка IPN Callback

1. В Dashboard перейдите в Settings -> API
2. Добавьте IPN Callback URL: `https://your-domain.com/api/nowpayments/callback`
3. Для локальной разработки используйте ngrok:

```bash
ngrok http 3000
# Скопируйте https URL и добавьте /api/nowpayments/callback
```

## 4. Миграция базы данных

Выполните SQL миграцию для добавления полей payment_method, payment_amount, payment_currency:

```sql
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'crypto';
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_currency TEXT;
```

Или создайте таблицу заново из `migrations/create_purchases_table.sql`

## 5. Тестирование

### Sandbox режим (для тестов):

1. В NOWPayments Dashboard включите Sandbox mode
2. Используйте тестовые API ключи
3. Тестовые платежи будут обрабатываться автоматически

### Production режим:

1. Настройте реальные кошельки для получения криптовалюты
2. Добавьте production API ключ в `.env.production`
3. Настройте реальный домен для IPN callbacks

## 6. Процесс оплаты

1. Пользователь выбирает план на `/pricing`
2. Нажимает "Купить план"
3. Перенаправляется на страницу оплаты NOWPayments
4. Выбирает криптовалюту и отправляет платеж
5. После подтверждения транзакции NOWPayments отправляет IPN на `/api/nowpayments/callback`
6. Сервер обновляет баланс пользователя
7. Пользователь перенаправляется в профиль с обновленным балансом

## 7. Поддерживаемые криптовалюты

По умолчанию используется USDT TRC20, но пользователь может выбрать:
- Bitcoin (BTC)
- Ethereum (ETH)
- USDT (TRC20, ERC20)
- USDC
- Litecoin (LTC)
- И многие другие...

## 8. Безопасность

- API ключ хранится в переменных окружения
- IPN callback проверяет подпись от NOWPayments (добавьте если нужно)
- Используется service role key Supabase для безопасных операций с БД
- Order ID содержит зашифрованные данные о пользователе и плане

## 9. Мониторинг

- Все транзакции логируются в консоль
- История покупок сохраняется в таблице `purchases`
- В NOWPayments Dashboard можно отслеживать все платежи

## 10. Частые вопросы

**Q: Сколько времени занимает подтверждение платежа?**
A: Зависит от блокчейна. BTC ~10-60 мин, ETH ~1-5 мин, USDT TRC20 ~1 мин.

**Q: Какие комиссии берет NOWPayments?**
A: 0.5% за транзакцию (одна из самых низких на рынке).

**Q: Можно ли вернуть платеж?**
A: Криптовалютные транзакции необратимы. Возвраты только вручную.

**Q: Что делать если платеж "завис"?**
A: Проверьте статус в NOWPayments Dashboard. Обычно платежи обрабатываются автоматически.
