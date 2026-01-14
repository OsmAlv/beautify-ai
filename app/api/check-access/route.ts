import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { userId, mode, environment } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Получить данные пользователя
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Цены за генерацию (в nippies, где 1 nippy ≈ 0.0027 USD)
    // 1 генерация стоит ~10 центов = 0.10 USD
    // Значит 0.10 / 0.0027 ≈ 37 nippies за генерацию
    const COST_PRETTY = 0; // Бесплатно в лимитах
    const COST_HOT = 37; // 37 nippies
    const COST_SALSA = 50; // 50 nippies

    let cost = 0;
    let hasAccess = false;

    // Супер пользователи имеют бесконечный доступ
    if (user.is_superuser) {
      hasAccess = true;
      cost = 0; // Не списываем
    } else if (mode === "pretty") {
      if (user.pretty_generations_remaining > 0) {
        hasAccess = true;
        // Уменьшить бесплатные генерации
        const { error: updateError } = await supabase
          .from("users")
          .update({ pretty_generations_remaining: user.pretty_generations_remaining - 1 })
          .eq("id", userId);

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 });
        }
      } else {
        cost = COST_PRETTY;
        hasAccess = user.nippies_balance >= cost;
      }
    } else if (mode === "hot") {
      if (user.hot_generations_remaining > 0) {
        hasAccess = true;
        // Уменьшить бесплатные генерации
        const { error: updateError } = await supabase
          .from("users")
          .update({ hot_generations_remaining: user.hot_generations_remaining - 1 })
          .eq("id", userId);

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 });
        }
      } else {
        cost = COST_HOT;
        hasAccess = user.nippies_balance >= cost;
      }
    } else if (mode === "salsa") {
      cost = COST_SALSA;
      hasAccess = user.nippies_balance >= cost;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: `Недостаточно nippies. Нужно: ${cost}, у вас есть: ${user.nippies_balance}` },
        { status: 402 }
      );
    }

    // Если есть стоимость, вычесть её
    if (cost > 0 && !user.is_superuser) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          nippies_balance: user.nippies_balance - cost,
          total_spent: user.total_spent + cost,
        })
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      // Логировать транзакцию
      await supabase.from("transactions").insert([
        {
          user_id: userId,
          amount: -cost,
          type: "generation",
          description: `${mode} generation in ${environment || "original"}`,
        },
      ]);
    }

    // Логировать генерацию
    await supabase.from("generation_logs").insert([
      {
        user_id: userId,
        mode,
        environment,
        cost,
      },
    ]);

    return NextResponse.json({
      success: true,
      cost,
      remaining_balance: user.nippies_balance - cost,
    });
  } catch (error) {
    console.error("Error checking generation access:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
