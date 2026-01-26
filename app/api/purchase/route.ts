import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, planName, nippies, prettyGenerations, hotGenerations } = await request.json();

    if (!userId || !planName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Получаем текущий баланс пользователя
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Обновляем баланс и генерации
    const { data, error } = await supabase
      .from('users')
      .update({
        nippies_balance: currentUser.nippies_balance + nippies,
        pretty_generations_remaining: currentUser.pretty_generations_remaining + prettyGenerations,
        hot_generations_remaining: currentUser.hot_generations_remaining + hotGenerations,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update user balance' }, { status: 500 });
    }

    // Логируем покупку
    await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        plan_name: planName,
        nippies_added: nippies,
        pretty_generations_added: prettyGenerations,
        hot_generations_added: hotGenerations,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: `План ${planName} успешно куплен!`,
      user: data,
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
