import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const WAVESPEED_RESULT_URL = "https://api.wavespeed.ai/api/v3/predictions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Generation ID не указан" },
        { status: 400 }
      );
    }

    // Получаем информацию о генерации из БД
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: generation, error } = await supabase
      .from("generation_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !generation) {
      console.error("❌ Generation не найдена:", error);
      return NextResponse.json(
        { error: "Генерация не найдена" },
        { status: 404 }
      );
    }

    const { wavespeed_request_id, original_image_url, created_at } = generation;
    
    // Получаем image_url если существует (для старых генераций)
    const legacyImageUrl = (generation as Record<string, unknown>).image_url as string | undefined;

    console.log("📊 Generation данные:", { wavespeed_request_id, original_image_url, created_at, image_url: legacyImageUrl });

    // Вычисляем возраст генерации один раз (для обоих типов генераций)
    const createdDate = new Date(created_at);
    const now = new Date();
    const ageInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    // Поддержка старых генераций (которые могут иметь image_url вместо wavespeed_request_id)
    let resultImageUrl: string | null = null;

    // Если есть wavespeed_request_id - получаем с Wavespeed API
    if (wavespeed_request_id) {
      // Проверяем возраст генерации (Wavespeed хранит 7 дней)
      if (ageInDays > 7) {
        return NextResponse.json({
          error: "Изображение удалено с Wavespeed (свыше 7 дней)",
          original_image_url,
          status: "expired",
          age_days: Math.floor(ageInDays),
        });
      }

      // Получаем результат с Wavespeed API
      const wavespeedUrl = `${WAVESPEED_RESULT_URL}/${wavespeed_request_id}/result`;
      
      console.log("🔗 Запрашиваем с Wavespeed:", wavespeedUrl);

      const wavespeedResponse = await fetch(wavespeedUrl);
      const resultData = await wavespeedResponse.json();

      if (!wavespeedResponse.ok) {
        console.error("❌ Wavespeed ошибка:", resultData);
        return NextResponse.json(
          {
            error: "Не удалось получить изображение с Wavespeed",
            original_image_url,
            status: "wavespeed_error",
          },
          { status: 500 }
        );
      }

      resultImageUrl = resultData.outputs?.[0] || null;
      
      // Если результата нет, но у нас есть URL - возвращаем его  
      if (!resultImageUrl && legacyImageUrl) {
        console.log("⚠️ Wavespeed результат не готов, используем сохраненный image_url");
        resultImageUrl = legacyImageUrl;
      }
    }
    // Если есть image_url в БД - это старая генерация
    else if (legacyImageUrl) {
      resultImageUrl = legacyImageUrl;
      console.log("📦 Используем старую генерацию из БД");
    }
    // Если ничего нет - ошибка
    else {
      return NextResponse.json(
        {
          error: "Данные генерации не найдены (ни wavespeed_request_id ни image_url)",
          status: "no_data",
        },
        { status: 400 }
      );
    }

    if (!resultImageUrl) {
      return NextResponse.json(
        {
          error: "Изображение не найдено в ответе",
          status: "no_output",
        },
        { status: 400 }
      );
    }

    // ✅ Успешно - возвращаем данные генерации и URL изображения
    return NextResponse.json({
      id,
      status: "success",
      image_url: resultImageUrl,
      original_image_url,
      mode: generation.mode,
      environment: generation.environment,
      created_at: generation.created_at,
      age_days: Math.floor(ageInDays),
    });
  } catch (error) {
    console.error("❌ API ошибка:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  }
}
