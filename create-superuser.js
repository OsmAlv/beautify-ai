const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createSuperuser() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔐 Создаем супер пользователя...\n');

    // 1. Создаем пользователя в auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'osmanovalev33@gmail.com',
      password: '1816424Alev!@',
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Ошибка создания в auth:', authError);
      return;
    }

    console.log('✅ Пользователь создан в auth.users');
    console.log(`   ID: ${authUser.user.id}`);

    // 2. Создаем профиль в таблице users и делаем его суперпользователем
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authUser.user.id,
        email: 'osmanovalev33@gmail.com',
        username: 'Osmano',
        is_superuser: true,
        nippies_balance: 999999,
        pretty_generations_remaining: 999999,
        hot_generations_remaining: 999999,
      })
      .select();

    if (profileError) {
      console.error('❌ Ошибка создания профиля:', profileError);
      return;
    }

    console.log('✅ Профиль создан и он СУПЕР ПОЛЬЗОВАТЕЛЬ');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 СУПЕР ПОЛЬЗОВАТЕЛЬ СОЗДАН!');
    console.log('='.repeat(50));
    console.log('\n📧 Email: osmanovalev33@gmail.com');
    console.log('🔐 Пароль: 1816424Alev!@');
    console.log('👤 Username: Osmano');
    console.log('👑 Статус: СУПЕР ПОЛЬЗОВАТЕЛЬ');
    console.log('∞ Генерации: Бесконечные');
    console.log('💰 nippies: 999999');
    console.log('\n🚀 Войди здесь: http://localhost:3000/auth');
    console.log('🔐 Админ-панель: http://localhost:3000/admin');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

createSuperuser();
