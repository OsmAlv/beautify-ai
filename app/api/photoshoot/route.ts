import { NextRequest, NextResponse } from "next/server";

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const WAVESPEED_NANOBANA_URL = "https://api.wavespeed.ai/api/v3/google/nano-banana-pro/edit";
const WAVESPEED_RESULT_URL = "https://api.wavespeed.ai/api/v3/predictions";

async function waitForResult(requestId: string, maxAttempts = 120) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${WAVESPEED_RESULT_URL}/${requestId}/result`, {
      headers: {
        Authorization: `Bearer ${WAVESPEED_API_KEY}`,
      },
    });

    const data = await response.json();
    const status = data.data?.status;

    console.log(`⏳ Попытка ${i + 1}/${maxAttempts}: статус = ${status}`);

    if (status === "completed") {
      console.log("✅ Готово! Outputs:", data.data?.outputs);
      return data.data;
    }

    if (status === "failed") {
      console.error("❌ Обработка не удалась:", data.data?.error);
      throw new Error(`AI обработка не удалась: ${data.data?.error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error(`Превышено время ожидания (${maxAttempts * 3} секунд)`);
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, customPrompt, photoCount = 5, environment = "studio", userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    if (!WAVESPEED_API_KEY) {
      return NextResponse.json(
        { error: "API ключ не настроен" },
        { status: 500 }
      );
    }

    // Проверка и списание nippies
    const costPerPhoto = 50;
    const totalCost = photoCount * costPerPhoto;

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    if (!user.is_superuser && user.nippies_balance < totalCost) {
      return NextResponse.json(
        { error: `Недостаточно nippies. Нужно: ${totalCost}, у вас: ${user.nippies_balance}` },
        { status: 402 }
      );
    }

    // Списать nippies
    if (!user.is_superuser) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          nippies_balance: user.nippies_balance - totalCost,
          total_spent: (user.total_spent || 0) + totalCost,
        })
        .eq("id", userId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    console.log("📸 Создание AI фотосессии");
    console.log("🌍 Окружение:", environment);
    console.log("📝 Кастомный промпт:", customPrompt || "не задан");
    console.log("🔢 Количество фото:", photoCount);

    // Описания окружений
    const environmentDescriptions = {
      studio: "professional photo studio with soft lighting, white background, elegant and clean aesthetic",
      nature: "beautiful natural outdoor setting with trees, flowers, and natural sunlight",
      city: "modern urban environment with city architecture, streets, and urban aesthetics",
      beach: "beautiful beach setting with sand, ocean waves, and sunset lighting",
    };

    const envDesc = environmentDescriptions[environment as keyof typeof environmentDescriptions] || environmentDescriptions.studio;

    // Базовый промпт для фотосессии
    const basePrompt = `Professional photoshoot of this person in ${envDesc}. Ultra high quality, photorealistic, magazine quality photography. Perfect lighting, natural skin texture, professional composition.`;
    
    // Итоговый промпт с кастомизацией
    const finalPrompt = customPrompt 
      ? `${basePrompt} ${customPrompt}` 
      : basePrompt;

    console.log("📝 Финальный промпт:", finalPrompt);

    // Генерируем фото последовательно
    const results: string[] = [];
    
    for (let i = 0; i < photoCount; i++) {
      console.log(`🎨 Генерация фото ${i + 1}/${photoCount}...`);

      // Добавляем вариацию в промпт для разнообразия
      const variations = [
        "front view, confident pose",
        "side profile, elegant stance",
        "three-quarter view, natural expression",
        "dynamic pose, expressive gesture",
        "close-up portrait, engaging look",
      ];
      
      const variantPrompt = `${finalPrompt}. ${variations[i % variations.length]}`;

      const editResponse = await fetch(WAVESPEED_NANOBANA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WAVESPEED_API_KEY}`,
        },
        body: JSON.stringify({
          enable_base64_output: false,
          enable_sync_mode: false,
          images: [imageUrl],
          prompt: variantPrompt,
        }),
      });

      const editData = await editResponse.json();

      if (!editResponse.ok) {
        console.error("❌ Wavespeed API ошибка:", editData);
        continue; // Пропускаем ошибочное фото
      }

      const requestId = editData.data?.id;
      if (!requestId) continue;

      const result = await waitForResult(requestId);
      const resultImageUrl = result.outputs?.[0];

      if (resultImageUrl) {
        results.push(resultImageUrl);
        console.log(`✅ Фото ${i + 1} готово!`);
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Не удалось сгенерировать ни одного фото" },
        { status: 500 }
      );
    }

    // Сохраняем в БД
    await supabase
      .from("generation_logs")
      .insert({
        user_id: userId,
        mode: "photoshoot",
        environment: environment,
        cost: totalCost,
        image_url: results[0], // Сохраняем первое фото как основное
      });

    return NextResponse.json({
      success: true,
      results,
      generated: results.length,
      requested: photoCount,
    });

  } catch (error) {
    console.error("❌ Backend ошибка:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Неизвестная ошибка сервера",
      },
      { status: 500 }
    );
  }
}
