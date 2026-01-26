import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 NOWPayments callback:', body);

    const { payment_status, order_id, outcome_amount, outcome_currency } = body;

    // Проверяем статус платежа
    if (payment_status === 'finished') {
      // Парсим order_id: формат "user_id:plan_name"
      const [userId, planData] = order_id.split(':');
      const [planName, nippies, prettyGen, hotGen] = planData.split('_');

      // Обновляем баланс пользователя
      const { data: currentUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (currentUser) {
        await supabase
          .from('users')
          .update({
            nippies_balance: currentUser.nippies_balance + parseInt(nippies),
            pretty_generations_remaining: currentUser.pretty_generations_remaining + parseInt(prettyGen),
            hot_generations_remaining: currentUser.hot_generations_remaining + parseInt(hotGen),
          })
          .eq('id', userId);

        // Сохраняем запись о покупке
        await supabase
          .from('purchases')
          .insert({
            user_id: userId,
            plan_name: planName,
            nippies_added: parseInt(nippies),
            pretty_generations_added: parseInt(prettyGen),
            hot_generations_added: parseInt(hotGen),
            payment_method: 'crypto',
            payment_amount: outcome_amount,
            payment_currency: outcome_currency,
            created_at: new Date().toISOString(),
          });

        console.log('✅ Payment processed successfully for user:', userId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
