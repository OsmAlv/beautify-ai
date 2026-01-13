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
    
    // Статус находится в data.data.status
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
    const { imageUrl, gender = "female" } = await request.json();

    if (!WAVESPEED_API_KEY) {
      console.error("❌ API ключ не найден в переменных окружения");
      return NextResponse.json(
        { error: "API ключ не настроен" },
        { status: 500 }
      );
    }

    console.log("🔑 API ключ загружен, длина:", WAVESPEED_API_KEY.length);
    console.log("👤 Пол:", gender);
    console.log("📤 Отправляем на Wavespeed API...");

    // Разные промпты для мужчин и женщин
    const prompts = {
      female: "Make this woman a lot more sexier. Add openness to the outfits but keep their color, keep the skin texture, keep the makeup as in the donor photo. ",
      male: "make this man more sexier. Keep the skin texture natural. Keep face expressions. Add a little muscles to the body but under te clothes do not show it open. keep the color of the outfit as in the donor photo. ",
    };

    const prompt = prompts[gender as keyof typeof prompts] || prompts.female;

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
    console.log("📊 ПОЛНЫЙ ОТВЕТ:", JSON.stringify(editData, null, 2));

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
    
    console.log("🎉 Финальный результат получен:");
    console.log("Весь объект result:", JSON.stringify(result, null, 2));

    // Извлекаем URL из массива outputs
    const resultImageUrl = result.outputs?.[0];
    
    console.log("Найденный imageUrl:", resultImageUrl);

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
