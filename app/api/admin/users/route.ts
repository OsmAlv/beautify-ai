import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { action, email, superuser, nippies } = await request.json();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (action) {
      case "make-superuser":
        const { error: updateError } = await supabase
          .from("users")
          .update({ is_superuser: superuser })
          .eq("email", email);

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: `${email} теперь ${superuser ? "суперпользователь" : "обычный пользователь"}`,
        });

      case "add-nippies":
        const { data: user, error: getUserError } = await supabase
          .from("users")
          .select("id, nippies_balance")
          .eq("email", email)
          .single();

        if (getUserError || !user) {
          return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
        }

        const newBalance = user.nippies_balance + nippies;

        const { error: addError } = await supabase
          .from("users")
          .update({ nippies_balance: newBalance })
          .eq("email", email);

        if (addError) {
          return NextResponse.json({ error: addError.message }, { status: 400 });
        }

        // Логировать транзакцию
        await supabase.from("transactions").insert([
          {
            user_id: user.id,
            amount: nippies,
            type: "admin-gift",
            description: "Admin gift",
          },
        ]);

        return NextResponse.json({
          success: true,
          message: `Добавлено ${nippies} nippies пользователю ${email}`,
          new_balance: newBalance,
        });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in user management:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
