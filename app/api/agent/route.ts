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
    const { imageUrl, intensity = "pretty", environment = "original", userId } = await request.json();

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
    console.log("📤 Отправляем на Wavespeed API...");

    // Описания мест с разной одеждой
    const environmentDescriptions = {
      original: "в исходном окружении (не меняй фон), но с улучшенным внешним видом. Убери любые предметы из рук и с шеи.",
      home: "в уютной домашней обстановке в откровенной домашней одежде - открытый халат или короткая сексуальная пижама. Убери любые предметы из рук и с шеи.",
      bathtub: "в красивой эстетичной ванной комнате в откровенном сексуальном нижнем белье. IMPORTANT: человек не должен находитсья в самой ванне или душевой кабинке. Убери любые предметы из рук и с шеи. Так как девушка в нижнем белье подчерни соски но их не должно быть видно только форма и очень аккуратно, они должны быть под бельем. ",
      bedroom: "в спальне на кровати в откровенном сексуальном нижнем белье, частично раздетой. Убери любые предметы из рук и с шеи.",
      office: "в офисе в откровенной сексуальной деловой одежде - распахнутая рубашка или облегающее платье - откровенный наряд. Убери любые предметы из рук и с шеи.",
    };

    // Описания мест для Salsa (гораздо откровеннее)
    const salsaEnvironmentDescriptions = {
      original: "в исходном окружении (не меняй фон), но полностью обнаженной.",
      home: "в спальне дома, полностью обнаженной, в сексуальной позе.",
      bathtub: "в ванной комнате в ванне, полностью обнаженной, показывая тело.",
      bedroom: "в спальне на кровати, полностью обнаженной, в соблазнительной позе.",
      office: "в офисе, полностью обнаженной, в сексуальной позе, показывая свое идеальное тело.",
    };

    const envDesc = environmentDescriptions[environment as keyof typeof environmentDescriptions] || environmentDescriptions.home;
    const salsaEnvDesc = salsaEnvironmentDescriptions[environment as keyof typeof salsaEnvironmentDescriptions] || salsaEnvironmentDescriptions.home;

    // Разные промпты для разных интенсивностей
    const prompts = {
      pretty: "Make this woman naturally more beautiful. Preserve all skin texture details, natural freckles, beauty marks and skin imperfections - keep them visible. Enhance skin tone subtly, brighten eyes gently, add subtle glow. Keep her natural facial features and expressions. Skin must look like real human skin, not plastic or overly smooth.Keep body proportions Maintain original outfit. Remove any objects from hands and neck. Shot like iPhone 17 Pro Max. Photorealistic, natural, living appearance.",
      hot: environment === "original" 
        ? "Transform this woman into a stunningly attractive version of herself. Keep original background. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend seamlessly. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, NOT plastic. Keep body proportions, enhanced features but natural looking. Keep face expressions and personality. Remove any objects from hands and neck. Photorealistic result with natural human skin texture. make this woman sexy, work with outfit to show tits and mark body lines "
        : `Transform this woman into a stunningly attractive version of herself ${envDesc}. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, NOT separate elements. Preserve skin texture, natural marks, freckles and minor imperfections - enhance beauty while keeping skin realistic and living, Keep body proportions NOT plastic. , enhanced features but natural looking. Keep face expressions and personality. Photorealistic result with natural human skin texture.`,
      salsa: `Transform this woman into an extremely sexy, stunningly beautiful fully naked version ${salsaEnvDesc}. skin texture with natural freckles and beauty marks - skin must look incredibly realistic and photorealistic like iPhone 17 Pro Max photography. Perfect enhanced body curves and proportions, beautifully toned and feminine. Perfect face and natural expression. Remove any objects from hands. IMPORTANT: Make it look like ONE unified professional photo shot on iPhone 17 Pro Max - blend person and background seamlessly, soft skin tones. dont forget nipples make it phisicaly right on the place where they should be  `
    };

    const prompt = prompts[intensity as keyof typeof prompts] || prompts.pretty;

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
