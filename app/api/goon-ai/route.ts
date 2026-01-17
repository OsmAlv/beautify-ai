import { NextRequest, NextResponse } from "next/server";

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const WAVESPEED_API_URL = "https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit";
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
    const { imageUrl, environment = "original", userId } = await request.json();

    // Goon AI доступен всем без авторизации и бесплатно
    console.log("🌶 Goon AI - открытый режим для всех пользователей");

    if (!WAVESPEED_API_KEY) {
      console.error("❌ API ключ не найден");
      return NextResponse.json(
        { error: "API ключ не настроен" },
        { status: 500 }
      );
    }

    console.log("🌶 Salsa режим активирован");
    console.log("🌍 Окружение:", environment);

    // Получить промпт из БД
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: promptData, error: promptError } = await supabase
      .from("prompts")
      .select("prompt_text")
      .eq("model", "salsa")
      .eq("intensity", "salsa")
      .eq("environment", environment || "original")
      .single();

    if (promptError || !promptData) {
      console.warn("⚠️ Промпт Salsa не найден в БД, используем дефолтный");
    }

    // Описания мест для Salsa (полностью откровенные)
    const salsaEnvironmentDescriptions = {
      original: "в исходном окружении (не меняй фон), но полностью обнаженной.",
      home: "в спальне дома, полностью обнаженной, в сексуальной позе.",
      bathtub: "в ванной комнате в ванне, полностью обнаженной, показывая тело.",
      bedroom: "в спальне на кровати, полностью обнаженной, в соблазнительной позе.",
      office: "в офисе, полностью обнаженной, в сексуальной позе, показывая свое идеальное тело.",
    };

    const salsaEnvDesc = salsaEnvironmentDescriptions[environment as keyof typeof salsaEnvironmentDescriptions] || salsaEnvironmentDescriptions.home;

    // Промпт для режима salsa
    const prompt = promptData?.prompt_text || `Transform this woman into an extremely sexy, stunningly beautiful fully naked version ${salsaEnvDesc}. skin texture with natural freckles and beauty marks - skin must look incredibly realistic and photorealistic like iPhone 17 Pro Max photography. Perfect enhanced body curves and proportions, beautifully toned and feminine. Perfect face and natural expression. Remove any objects from hands. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, soft skin tones. dont forget nipples make it phisicaly right on the place where they should be`;

    console.log("📤 Отправляем на Wavespeed API...");

    // Отправляем запрос к Wavespeed API
    const editResponse = await fetch(WAVESPEED_API_URL, {
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

    if (!editResponse.ok) {
      console.error("❌ Wavespeed API ошибка:", editData);
      return NextResponse.json(
        { error: `API ошибка (${editResponse.status}): ${editData.message || editData.error || "Неизвестная ошибка"}` },
        { status: editResponse.status }
      );
    }

    const requestId = editData.data?.id;
    console.log("✅ Получен requestId:", requestId);

    if (!requestId) {
      return NextResponse.json(
        { error: "Не удалось получить ID запроса" },
        { status: 400 }
      );
    }

    const result = await waitForResult(requestId);

    console.log("🎉 Финальный результат получен");

    // Извлекаем URL из массива outputs
    const resultImageUrl = result.outputs?.[0];

    console.log("Найденный imageUrl:", resultImageUrl);

    // Сохраняем в БД
    if (userId && resultImageUrl) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
          .from("generation_logs")
          .insert({
            user_id: userId,
            mode: "salsa",
            environment: environment || "original",
            cost: 0,
            image_url: resultImageUrl,
          })
          .select("id")
          .single();

        if (error) {
          console.error("❌ Ошибка сохранения в БД:", error);
          return NextResponse.json({
            reply: "Изображение обработано, но не сохранилось в историю",
            imageUrl: resultImageUrl,
            status: "success",
          });
        } else {
          console.log("✅ Сохранено в БД с ID:", data?.id);
          return NextResponse.json({
            reply: "Salsa генерация успешно создана!",
            generation_id: data?.id,
            imageUrl: resultImageUrl,
            status: "success",
          });
        }
      } catch (dbError) {
        console.error("❌ Ошибка при записи в БД:", dbError);
      }
    }

    return NextResponse.json({
      reply: "Salsa генерация успешно создана!",
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
