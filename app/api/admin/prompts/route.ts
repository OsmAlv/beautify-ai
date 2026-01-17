import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "osmanovalev33@gmail.com";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Получить все промпты
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("model", { ascending: true })
      .order("intensity", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ prompts: data }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching prompts:", error);
    return NextResponse.json(
      { error: "Ошибка при получении промптов" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, model, intensity, environment, prompt_text } =
      await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === "update-prompt") {
      if (!model || !intensity || !prompt_text) {
        return NextResponse.json(
          { error: "Требуются model, intensity и prompt_text" },
          { status: 400 }
        );
      }

      // Обновить или создать промпт
      const { data, error } = await supabase
        .from("prompts")
        .upsert(
          {
            model,
            intensity,
            environment: environment || null,
            prompt_text,
          },
          { onConflict: "model,intensity,environment" }
        )
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Промпт обновлен:", data.id);
      return NextResponse.json(
        { success: true, prompt: data, message: "Промпт успешно обновлен" },
        { status: 200 }
      );
    }

    if (action === "get-by-model") {
      if (!model || !intensity) {
        return NextResponse.json(
          { error: "Требуются model и intensity" },
          { status: 400 }
        );
      }

      // Получить промпт для конкретной модели и интенсивности
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("model", model)
        .eq("intensity", intensity)
        .eq("environment", environment || null);

      if (error) throw error;

      return NextResponse.json(
        { prompts: data },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Неизвестное действие" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error updating prompts:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Ошибка при обновлении",
      },
      { status: 500 }
    );
  }
}
