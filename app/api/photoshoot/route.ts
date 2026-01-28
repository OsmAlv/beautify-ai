import { NextRequest, NextResponse } from "next/server";

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const WAVESPEED_API_URL = "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4.5/edit";
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

    if (status === "completed") {
      return data.data;
    }

    if (status === "failed") {
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
    
    return translated;
  } catch (error) {
    return text; // В случае ошибки возвращаем оригинальный текст
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrls, customPrompt, photoCount = 5, environment = "studio", userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "Необходимо загрузить хотя бы одну фотографию" },
        { status: 400 }
      );
    }

    if (!WAVESPEED_API_KEY) {
      return NextResponse.json(
        { error: "API ключ Wavespeed не настроен. Обратитесь к администратору." },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "Supabase URL не настроен. Обратитесь к администратору." },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
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

    // Описания окружений
    const environmentDescriptions = {
      studio: "professional photo studio with soft lighting, white background, elegant and clean aesthetic",
      nature: "beautiful natural outdoor setting with trees, flowers, and natural sunlight",
      city: "modern urban environment with city architecture, streets, and urban aesthetics",
      beach: "beautiful beach setting with sand, ocean waves, and sunset lighting",
    };

    const envDesc = environmentDescriptions[environment as keyof typeof environmentDescriptions] || environmentDescriptions.studio;

    // Переводим кастомный промпт на английский, если он на русском
    const translatedPrompt = customPrompt ? await translateToEnglish(customPrompt) : "";

    // Базовый промпт с окружением
    let finalPrompt = `Professional portrait photograph in ${envDesc}. Natural lighting, high quality photography, realistic details.`;
    
    // ОБЯЗАТЕЛЬНО добавляем кастомный промпт если он есть
    if (translatedPrompt) {
      finalPrompt += ` ${translatedPrompt}.`;
    }

    // Генерируем фото последовательно
    const results: string[] = [];
    
    // Позы для разнообразия фотосессии
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
    
    for (let i = 0; i < photoCount; i++) {
      // ОБЯЗАТЕЛЬНО добавляем позу к промпту для каждого фото
      const poseVariation = variations[i % variations.length];
      const variantPrompt = `${finalPrompt} ${poseVariation}`;

      const editResponse = await fetch(WAVESPEED_API_URL, {
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
          strength: 0.25, // МИНИМАЛЬНЫЕ изменения (50% изменений, 50% оригинал)
          num_inference_steps: 75, // Больше шагов = лучшее качество и точность
        }),
        signal: AbortSignal.timeout(60000), // Тайм-аут 60 секунд
      });

      const editData = await editResponse.json();

      if (!editResponse.ok) {
        // Проверяем, является ли ошибка content moderation
        const errorMessage = editData?.error || editData?.message || '';
        if (errorMessage.toLowerCase().includes('sensitive') || 
            errorMessage.toLowerCase().includes('flagged') ||
            errorMessage.toLowerCase().includes('content')) {
          // Пробуем еще раз с очень простым промптом
          const simplePrompt = `Professional portrait photograph in ${envDesc}. Natural lighting, high quality. ${poseVariation}`;
          
          const retryResponse = await fetch(WAVESPEED_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${WAVESPEED_API_KEY}`,
            },
            body: JSON.stringify({
              enable_base64_output: false,
              images: imageUrls,
              prompt: simplePrompt,
              quality: "high",
              input_fidelity: "high",
              output_format: "jpeg",
              guidance_scale: 10.0,
              strength: 0.25,
              num_inference_steps: 75,
            }),
            signal: AbortSignal.timeout(60000),
          });
          
          const retryData = await retryResponse.json();
          if (retryResponse.ok && retryData.data?.id) {
            try {
              const result = await waitForResult(retryData.data.id);
              const resultImageUrl = result.outputs?.[0];
              if (resultImageUrl) {
                results.push(resultImageUrl);
                continue;
              }
            } catch (retryError) {
              // Skip failed retry
            }
          }
        }
        
        continue; // Пропускаем ошибочное фото
      }

      const requestId = editData.data?.id;
      if (!requestId) {
        continue;
      }

      try {
        const result = await waitForResult(requestId);
        const resultImageUrl = result.outputs?.[0];

        if (resultImageUrl) {
          results.push(resultImageUrl);
        }
      } catch (waitError) {
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Неизвестная ошибка сервера",
      },
      { status: 500 }
    );
  }
}
