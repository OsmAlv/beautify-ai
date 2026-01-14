import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    
    console.log("🔐 === SIGNUP REQUEST ===");
    console.log("📧 Email:", email);
    console.log("👤 Username:", username || email.split("@")[0]);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("🌍 Supabase URL:", supabaseUrl);
    console.log("🔑 Service Role Key exists:", !!serviceRoleKey);

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("❌ Missing env vars - need SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Server configuration error - SUPABASE_SERVICE_ROLE_KEY not set" },
        { status: 500 }
      );
    }

    // Use Admin API to create user with email confirmed
    console.log("🔐 Calling Supabase admin createUser...");
    
    const adminUrl = `${supabaseUrl}/auth/v1/admin/users`;
    console.log("📍 Admin URL:", adminUrl);
    
    const createUserResponse = await fetch(adminUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true, // Auto-confirm email so user can login immediately
      }),
    });

    const createUserText = await createUserResponse.text();
    console.log("📡 Create User Response Status:", createUserResponse.status);
    console.log("📡 Raw Response:", createUserText);

    let userData;
    try {
      userData = JSON.parse(createUserText);
    } catch (e) {
      console.error("❌ Failed to parse response:", e);
      return NextResponse.json(
        { error: "Invalid response from Supabase admin API" },
        { status: 500 }
      );
    }

    if (!createUserResponse.ok) {
      console.error("❌ Create user failed:", userData);
      return NextResponse.json(
        { error: userData.error_description || userData.message || userData.error || "Failed to create user" },
        { status: createUserResponse.status }
      );
    }

    const userId = userData.id;
    console.log("✅ User created with ID:", userId);
    
    // Create user profile in database
    if (userId) {
      console.log("📝 Creating user profile...");
      
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        
        const { error: profileError, data: profileData } = await supabaseAdmin
          .from("users")
          .insert({
            id: userId,
            email,
            username: username || email.split("@")[0],
            is_superuser: false,
            nippies_balance: 0,
            pretty_generations_remaining: 5,
            hot_generations_remaining: 1,
          });

        if (profileError) {
          console.error("❌ Profile creation failed:", profileError);
          // Don't fail - auth succeeded, profile creation is secondary
        } else {
          console.log("✅ User profile created:", profileData);
        }
      } catch (err) {
        console.error("❌ Profile creation error:", err);
      }
    }

    console.log("✅ Signup completed");
    return NextResponse.json(
      {
        user: userData,
        message: "Signup successful - email confirmed",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Signup API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
