import { NextRequest, NextResponse } from "next/server";

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const WAVESPEED_NANOBANA_PRO_URL = "https://api.wavespeed.ai/api/v3/google/nano-banana-pro/edit";
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

// Функция для определения языка и перевода на английский
async function translateToEnglish(text: string): Promise<string> {
  // Проверяем, содержит ли текст кириллицу
  const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
  
  if (!hasCyrillic) {
    // Если текст уже на английском, возвращаем как есть
    return text;
  }

  try {
    // Используем бесплатный API для перевода
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q=${encodeURIComponent(text)}`
    );
    
    const data = await response.json();
    
    // Извлекаем переведенный текст
    const translated = data[0]?.map((item: any) => item[0]).join('') || text;
    
    console.log(`🌐 Перевод: "${text}" → "${translated}"`);
    return translated;
  } catch (error) {
    console.error("❌ Ошибка перевода, используем оригинальный текст:", error);
    return text; // В случае ошибки возвращаем оригинальный текст
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrls, customPrompt, photoCount = 5, environment = "studio", model = "nanobana", userId } = await request.json();

    console.log("🎬 Начало обработки запроса на фотосессию:", {
      userId,
      photoCount,
      environment,
      model,
      hasImages: !!imageUrls,
      imageCount: imageUrls?.length || 0,
      hasCustomPrompt: !!customPrompt
    });

    if (!userId) {
      console.error("❌ Отсутствует userId");
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    if (!imageUrls || imageUrls.length === 0) {
      console.error("❌ Отсутствуют изображения");
      return NextResponse.json(
        { error: "Необходимо загрузить хотя бы одну фотографию" },
        { status: 400 }
      );
    }

    if (!WAVESPEED_API_KEY) {
      console.error("❌ WAVESPEED_API_KEY не настроен в environment variables");
      return NextResponse.json(
        { error: "API ключ Wavespeed не настроен. Обратитесь к администратору." },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("❌ NEXT_PUBLIC_SUPABASE_URL не настроен");
      return NextResponse.json(
        { error: "Supabase URL не настроен. Обратитесь к администратору." },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY не настроен");
      return NextResponse.json(
        { error: "Supabase Service Role Key не настроен. Обратитесь к администратору." },
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
    console.log("🖼️ Количество загруженных фото:", imageUrls.length);

    // Описания окружений
    const environmentDescriptions = {
      studio: "professional photo studio with soft lighting, white background, elegant and clean aesthetic",
      nature: "beautiful natural outdoor setting with trees, flowers, and natural sunlight",
      city: "modern urban environment with city architecture, streets, and urban aesthetics",
      beach: "beautiful beach setting with sand, ocean waves, and sunset lighting",
    };

    const envDesc = environmentDescriptions[environment as keyof typeof environmentDescriptions] || environmentDescriptions.studio;

    // Переводим кастомный промпт на английский, если он на русском
    const translatedPrompt = customPrompt ? await translateToEnglish(customPrompt) : null;

    // Улучшенный базовый промпт с акцентом на сохранение лица
    // Если есть кастомный промпт, он идет первым как главная инструкция
    const sceneDescription = translatedPrompt || `in ${envDesc}`;
    
    const basePrompt = `ABSOLUTE PRIORITY: Keep the face 100% identical to the uploaded photo. The face MUST NOT change at all.

FACE IDENTITY LOCK:
- Use the uploaded photo as the ONLY reference for facial identity
- The face structure, proportions, features MUST remain exactly the same
- Same nose, same eyes, same lips, same jawline, same cheekbones, same forehead, same chin
- Same facial proportions and distances between features
- Same age, same ethnicity, same unique characteristics
- Zero tolerance for facial changes - face must be pixel-perfect identical

Generate a highly photorealistic professional photoshoot ${sceneDescription}, as if captured with a high-end full-frame DSLR camera.

ALLOWED CHANGES ONLY:
- Background and environment
- Clothing and accessories
- Lighting and camera angle
- Body pose and position
- Facial expression (smile, serious, etc.) - but facial features stay identical

FORBIDDEN CHANGES:
- NO changes to face structure, shape, or features
- NO changes to nose, eyes, lips, jawline, cheekbones
- NO changes to facial proportions or identity

Natural lighting, realistic shadows, accurate skin texture (pores, fine details, natural imperfections), true-to-life colors.
Real photograph look, not illustration, CGI, 3D render, or stylized image.`;
    
    const finalPrompt = basePrompt;

    console.log("📝 Финальный промпт:", finalPrompt);

    // Генерируем фото последовательно
    const results: string[] = [];
    
    for (let i = 0; i < photoCount; i++) {
      console.log(`🎨 Генерация фото ${i + 1}/${photoCount}...`);

      // Добавляем вариацию в промпт для разнообразия
      const variations = [
        "front view, confident pose, looking at camera",
        "side profile, elegant stance, soft smile",
        "three-quarter view, natural expression, relaxed posture",
        "dynamic pose, expressive gesture, natural movement",
        "close-up portrait, engaging look, direct eye contact",
        "full body shot, standing pose, hands on hips",
        "candid moment, genuine smile, natural pose",
        "over the shoulder look, mysterious vibe",
        "sitting pose, crossed legs, elegant posture",
        "walking pose, natural stride, confident energy",
      ];
      
      const variantPrompt = `${finalPrompt}. ${variations[i % variations.length]}`;

      // Используем Nano Banana Pro (лучшая версия)
      const apiUrl = WAVESPEED_NANOBANA_PRO_URL;
      const modelName = "Nano Banana Pro";
      
      console.log(`🤖 Используем модель: ${modelName}`);

      const editResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WAVESPEED_API_KEY}`,
        },
        body: JSON.stringify({
          enable_base64_output: false,
          enable_sync_mode: false,
          images: imageUrls, // Отправляем все фотографии
          prompt: variantPrompt,
          quality: "high", // Высокое качество
          input_fidelity: "high", // КЛЮЧЕВОЙ параметр для сохранения лица!
          output_format: "jpeg", // Формат вывода
          guidance_scale: 12.0, // МАКСИМАЛЬНО строгое следование промпту о сохранении лица
          strength: 0.25, // МИНИМАЛЬНЫЕ изменения (25% изменений, 75% оригинал)
          num_inference_steps: 75, // Больше шагов = лучшее качество и точность
        }),
        signal: AbortSignal.timeout(60000), // Тайм-аут 60 секунд
      });

      const editData = await editResponse.json();

      if (!editResponse.ok) {
        console.error(`❌ Wavespeed API ошибка для фото ${i + 1}:`, {
          status: editResponse.status,
          statusText: editResponse.statusText,
          error: editData
        });
        continue; // Пропускаем ошибочное фото
      }

      const requestId = editData.data?.id;
      if (!requestId) {
        console.error(`❌ Не получен requestId для фото ${i + 1}:`, editData);
        continue;
      }
      
      console.log(`🆔 Request ID для фото ${i + 1}: ${requestId}`);

      try {
        const result = await waitForResult(requestId);
        const resultImageUrl = result.outputs?.[0];

        if (resultImageUrl) {
          results.push(resultImageUrl);
          console.log(`✅ Фото ${i + 1} готово! URL: ${resultImageUrl.substring(0, 50)}...`);
        } else {
          console.error(`❌ Фото ${i + 1}: результат получен, но URL отсутствует:`, result);
        }
      } catch (waitError) {
        console.error(`❌ Ошибка при ожидании результата фото ${i + 1}:`, waitError);
        // Продолжаем со следующим фото
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Не удалось сгенерировать ни одного фото" },
        { status: 500 }
      );
    }

    // Сохраняем каждое фото как отдельную запись в БД
    const insertPromises = results.map((imageUrl, index) => 
      supabase
        .from("generation_logs")
        .insert({
          user_id: userId,
          mode: "photoshoot",
          environment: environment,
          cost: index === 0 ? totalCost : 0, // Стоимость только на первое фото
          image_url: imageUrl,
        })
    );

    await Promise.all(insertPromises);

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
