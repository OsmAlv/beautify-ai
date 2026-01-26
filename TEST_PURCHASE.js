/**
 * Инструкция для тестирования покупки плана
 * 
 * Шаг 1: Запустите миграцию для создания таблицы purchases
 * - Откройте Supabase Dashboard
 * - SQL Editor -> New Query
 * - Скопируйте содержимое migrations/create_purchases_table.sql
 * - Выполните запрос
 * 
 * Шаг 2: Войдите на сайт под своим аккаунтом
 * - Перейдите на /auth и войдите или зарегистрируйтесь
 * 
 * Шаг 3: Откройте страницу тарифов
 * - Перейдите на /pricing
 * 
 * Шаг 4: Купите план
 * - Нажмите кнопку "Купить план" под любым планом
 * - Система автоматически:
 *   * Добавит nippies на баланс
 *   * Добавит Pretty генерации
 *   * Добавит Hot генерации
 *   * Сохранит запись в таблицу purchases
 * 
 * Шаг 5: Проверьте результат
 * - Перейдите в /profile
 * - Убедитесь, что баланс и генерации увеличились
 * 
 * Альтернативный способ (через консоль браузера):
 * 
 * 1. Откройте DevTools (F12)
 * 2. Вставьте в консоль:
 * 
 * fetch('/api/purchase', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     userId: 'ВАШ_USER_ID',
 *     planName: 'Pro',
 *     nippies: 350,
 *     prettyGenerations: 20,
 *     hotGenerations: 10
 *   })
 * }).then(r => r.json()).then(console.log)
 * 
 * Примеры планов:
 * 
 * Starter:
 * - nippies: 100
 * - prettyGenerations: 5
 * - hotGenerations: 2
 * 
 * Pro:
 * - nippies: 350
 * - prettyGenerations: 20
 * - hotGenerations: 10
 * 
 * Ultimate:
 * - nippies: 1000
 * - prettyGenerations: 100
 * - hotGenerations: 50
 */

console.log('Инструкция по тестированию покупки загружена!');
