import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // После успешного логина - проверить и создать профиль если нужно
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        console.log("✅ User authenticated:", user.id);
        
        // Проверить есть ли профиль в БД
        const { data: existingProfile } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          console.log("📝 Creating user profile for:", user.email);
          
          // Создать профиль если его нет
          const { error: profileError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              email: user.email,
              username: user.email?.split("@")[0] || "user",
              is_superuser: false,
              nippies_balance: 0,
              pretty_generations_remaining: 5,
              hot_generations_remaining: 1,
            });

          if (profileError) {
            console.error("❌ Profile creation failed:", profileError);
          } else {
            console.log("✅ User profile created successfully");
          }
        } else {
          console.log("✅ User profile already exists");
        }
      }

      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL("/auth?error=auth_code_error", request.url));
}
