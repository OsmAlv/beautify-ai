import { NextRequest, NextResponse } from "next/server";

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const WAVESPEED_BYTEDANCE_URL = "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit";
const WAVESPEED_NANOBANA_URL = "https://api.wavespeed.ai/api/v3/google/nano-banana-pro/edit"; // NanoBana модель через Wavespeed
const WAVESPEED_RESULT_URL = "https://api.wavespeed.ai/api/v3/predictions";

async function waitForResult(requestId: string, maxAttempts = 120) {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${WAVESPEED_RESULT_URL}/${requestId}/result`, {
      headers: {
        Authorization: `Bearer ${WAVESPEED_API_KEY}`,
      },
    });

    const data = await response.json();
    
    // Статус находится в dat a.data.status
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

    console.log(`📊 Текущий статус: ${status}`);

    // Ждем 3 секунды перед следующей проверкой
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error(`Превышено время ожидания (${maxAttempts * 3} секунд)`);
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, intensity = "pretty", environment = "original", userId, model = "bytedance" } = await request.json();

    // Проверка лимитов если не суперюзер
    if (userId) {
      const checkResponse = await fetch(new URL("/api/check-access", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mode: intensity, environment }),
      });

      if (!checkResponse.ok) {
        const error = await checkResponse.json();
        return NextResponse.json(error, { status: checkResponse.status });
      }
    }

    if (!WAVESPEED_API_KEY) {
      console.error("❌ API ключ не найден в переменных окружения");
      return NextResponse.json(
        { error: "API ключ не настроен" },
        { status: 500 }
      );
    }

    console.log("🔑 API ключ загружен, длина:", WAVESPEED_API_KEY.length);
    console.log("🌡️ Интенсивность:", intensity);
    console.log("🌍 Окружение:", environment);
    console.log("🤖 Модель:", model);
    console.log("📤 Отправляем на API...");

    // Получить промпт из БД
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: promptData, error: promptError } = await supabase
      .from("prompts")
      .select("prompt_text")
      .eq("model", model)
      .eq("intensity", intensity)
      .eq("environment", intensity === "hot" ? (environment || "original") : null)
      .single();

    if (promptError || !promptData) {
      console.warn("⚠️ Промпт не найден в БД, используем дефолтный");
    }

    let prompt: string;
    if (promptData?.prompt_text) {
      prompt = promptData.prompt_text;
      console.log("📖 Промпт загружен из БД");
    } else {
      // Fallback на встроенные промпты
      const getPrompts = (modelType: string) => {
        if (modelType === "nanobana") {
          return {
            pretty: "Enhance this woman's natural beauty with subtle, realistic improvements. Gently improve skin clarity while preserving all natural texture, pores, and micro-details. Keep eyes completely natural - do NOT enlarge or distort. Maintain authentic facial proportions and features. Add soft, natural lighting to enhance skin tone. Preserve freckles, beauty marks, and natural imperfections. Keep original eye shape and size exactly as is. Ultra-realistic enhancement with natural skin texture - avoid any smoothing or plastic effect. Professional portrait photography quality.",
            hot: "Transform this woman into an absolutely stunning, enhanced version using advanced AI upscaling.",
          };
        } else {
          return {
            pretty: "Make this woman naturally more beautiful.",
            hot: "Transform this woman into a stunningly attractive version of herself.",
          };
        }
      };

      const prompts = getPrompts(model);
      prompt = prompts[intensity as keyof typeof prompts] || prompts.pretty;
      console.log("📖 Используется встроенный дефолтный промпт");
    }


    // Выбираем API в зависимости от модели
    let apiUrl: string;
    let requestIdFromResponse: string | null = null;
    let resultImageUrl: string | null = null;

    if (model === "nanobana") {
      // NanoBana модель через Wavespeed API
      apiUrl = WAVESPEED_NANOBANA_URL;
      console.log("🚀 Используем NanoBana модель (Wavespeed)");
    } else {
      // ByteDance модель (текущий)
      apiUrl = WAVESPEED_BYTEDANCE_URL;
      console.log("🎨 Используем ByteDance модель (Wavespeed)");
    }

    // Отправляем запрос к Wavespeed API (для обеих моделей)
    const editResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WAVESPEED_API_KEY}`,
      },
      body: JSON.stringify({
        enable_base64_output: false,
        enable_sync_mode: false,
        images: [imageUrl],
        prompt: prompt,
      }),
    });

    const editData = await editResponse.json();
    
    console.log("📨 Ответ от Wavespeed:", editResponse.status);
    console.log("📊 ПОЛНЫЙ ОТВЕТ:", JSON.stringify(editData, null, 2));

    if (!editResponse.ok) {
      console.error("❌ Wavespeed API ошибка:", editData);
      return NextResponse.json(
        { error: `API ошибка (${editResponse.status}): ${editData.message || editData.error || "Неизвестная ошибка"}` },
        { status: editResponse.status }
      );
    }

    requestIdFromResponse = editData.data?.id;
    console.log("✅ Получен requestId:", requestIdFromResponse);
    
    if (!requestIdFromResponse) {
      return NextResponse.json(
        { error: "Не удалось получить ID запроса" },
        { status: 400 }
      );
    }
    
    const result = await waitForResult(requestIdFromResponse);
    
    console.log("🎉 Финальный результат получен:");
    console.log("Весь объект result:", JSON.stringify(result, null, 2));

    // Извлекаем URL из массива outputs
    resultImageUrl = result.outputs?.[0];

    // ✅ Сохраняем в БД с image_url (временно, пока не обновлена таблица на Wavespeed fetch)
    if (userId && resultImageUrl) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // ВРЕМЕННОЕ РЕШЕНИЕ: используем image_url для совместимости
        // TODO: После обновления БД схемы, поменяйте на wavespeed_request_id и original_image_url
        const { data, error } = await supabase
          .from("generation_logs")
          .insert({
            user_id: userId,
            mode: intensity,
            environment: environment || "original",
            cost: 0, // Уже вычтено в check-access
            image_url: resultImageUrl, // Пока сохраняем image_url
            // wavespeed_request_id: requestId, // После миграции раскомментируйте
            // original_image_url: image, // После миграции раскомментируйте
          })
          .select("id")
          .single();

        if (error) {
          console.error("❌ Ошибка сохранения в БД:", error);
          // Fallback: вернём image_url если не удалось сохранить
          return NextResponse.json({
            reply: "Изображение обработано, но не сохранилось в историю",
            imageUrl: resultImageUrl,
            status: "success",
          });
        } else {
          console.log("✅ Сохранено в БД с ID:", data?.id);
          return NextResponse.json({
            reply: "Изображение успешно обработано!",
            generation_id: data?.id, // Возвращаем ID генерации
            imageUrl: resultImageUrl, // Также возвращаем imageUrl для фронтенда
            status: "success",
          });
        }
      } catch (dbError) {
        console.error("❌ Ошибка при записи в БД:", dbError);
      }
    }

    // Fallback: возвращаем image_url если нет user_id (для тестирования)
    return NextResponse.json({
      reply: "Изображение успешно обработано!",
      imageUrl: resultImageUrl,
      status: "success",
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
