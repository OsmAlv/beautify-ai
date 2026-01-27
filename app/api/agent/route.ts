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

    if (status === "completed") {
      return data.data;
    }

    if (status === "failed") {
      throw new Error(`AI обработка не удалась: ${data.data?.error}`);
    }

    // Ждем 3 секунды перед следующей проверкой
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error(`Превышено время ожидания (${maxAttempts * 3} секунд)`);
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, intensity = "pretty", environment = "original", userId, model = "bytedance", customPrompt } = await request.json();

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
      return NextResponse.json(
        { error: "API ключ не настроен" },
        { status: 500 }
      );
    }

    // Получить промпт из БД
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let prompt: string;
    let basePrompt: string = "";
    
    // Сначала получаем базовый промпт из БД или используем дефолтный
    const { data: promptData, error: promptError } = await supabase
      .from("prompts")
      .select("prompt_text")
      .eq("model", model)
      .eq("intensity", intensity)
      .eq("environment", intensity === "hot" ? (environment || "original") : null)
      .single();

    if (promptError || !promptData) {
      // Промпт не найден, используем дефолтный
    }

    if (promptData?.prompt_text) {
      basePrompt = promptData.prompt_text;
    } else {
      // Fallback на встроенные промпты
      const getPrompts = (modelType: string, env: string) => {
        const environmentPrompts: Record<string, string> = {
          original: "",
          home: " Place her in a cozy home interior setting.",
          bathtub: " Place her in a luxurious bathroom with a bathtub.",
          bedroom: " Place her in an elegant bedroom setting.",
          office: " Place her in a professional office environment.",
        };

        const envSuffix = intensity === "hot" ? (environmentPrompts[env] || "") : "";

        if (modelType === "nanobana") {
          return {
            pretty: "Enhance natural beauty with subtle improvements. Improve skin clarity while preserving texture and natural details. Maintain facial proportions and features. Add soft natural lighting. Keep natural skin texture. Professional portrait quality.",
            hot: `make this girl sexy. Keep face expressions. outfit more open and sexy"${envSuffix}`,
          };
        } else {
          return {
            pretty: "Enhance natural beauty with subtle improvements.",
            hot: `make this girl sexy. Keep face expressions. outfit more open and sexy"${envSuffix}`,
          };
        }
      };

      const prompts = getPrompts(model, environment || "original");
      basePrompt = prompts[intensity as keyof typeof prompts] || prompts.pretty;
    }

    // Если есть кастомный промпт, добавляем его к базовому
    if (customPrompt && customPrompt.trim()) {
      prompt = `${basePrompt} ${customPrompt.trim()}`;
    } else {
      prompt = basePrompt;
    }

    // Выбираем API в зависимости от модели
    let apiUrl: string;
    let requestIdFromResponse: string | null = null;
    let resultImageUrl: string | null = null;

    if (model === "nanobana") {
      apiUrl = WAVESPEED_NANOBANA_URL;
    } else {
      apiUrl = WAVESPEED_BYTEDANCE_URL;
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

    if (!editResponse.ok) {
      return NextResponse.json(
        { error: `API ошибка (${editResponse.status}): ${editData.message || editData.error || "Неизвестная ошибка"}` },
        { status: editResponse.status }
      );
    }

    requestIdFromResponse = editData.data?.id;
    
    if (!requestIdFromResponse) {
      return NextResponse.json(
        { error: "Не удалось получить ID запроса" },
        { status: 400 }
      );
    }
    
    const result = await waitForResult(requestIdFromResponse);

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
          // Fallback: вернём image_url если не удалось сохранить
          return NextResponse.json({
            reply: "Изображение обработано, но не сохранилось в историю",
            imageUrl: resultImageUrl,
            status: "success",
          });
        } else {
          return NextResponse.json({
            reply: "Изображение успешно обработано!",
            generation_id: data?.id, // Возвращаем ID генерации
            imageUrl: resultImageUrl, // Также возвращаем imageUrl для фронтенда
            status: "success",
          });
        }
      } catch (dbError) {
        // Ошибка записи в БД
      }
    }

    // Fallback: возвращаем image_url если нет user_id (для тестирования)
    return NextResponse.json({
      reply: "Изображение успешно обработано!",
      imageUrl: resultImageUrl,
      status: "success",
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
