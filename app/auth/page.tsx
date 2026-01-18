"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      });

      if (error) {
        setError(`Google вход не удался: ${error.message}`);
        console.error("Google sign in error:", error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(`❌ Ошибка: ${errorMsg}`);
      console.error("Google auth error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        // Регистрация через API route
        console.log("📝 Начинаю регистрацию с email:", email);
        
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username }),
        });

        console.log("📡 Response status:", response.status);
        console.log("📡 Response ok:", response.ok);

        const result = await response.json();
        console.log("📡 Response data:", result);

        if (!response.ok) {
          console.error("❌ SignUp error details:", {
            status: response.status,
            error: result.error,
            full: result,
          });
          setError(`Ошибка регистрации: ${result.error}`);
          return;
        }

        console.log("✅ Пользователь создан:", result.user?.id);

        setSuccess("✅ Регистрация успешна! Переходим на главную...");
        setEmail("");
        setPassword("");
        setUsername("");
        
        // Дождаться загрузки профиля перед редиректом
        console.log("⏳ Ожидаю загрузки профиля...");
        let profileLoaded = false;
        let attempts = 0;
        
        while (!profileLoaded && attempts < 10) {
          attempts++;
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", result.user?.id)
            .single();
          
          if (data) {
            console.log("✅ Профиль загружен, редиректю");
            profileLoaded = true;
            // Профиль готов, редиректим
            window.location.href = "/";
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Fallback редирект если профиль не загружен
        if (!profileLoaded) {
          console.warn("⚠️ Профиль не загружен, редиректю anyway");
          window.location.href = "/";
        }
      } else {
        // Вход
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(`Ошибка входа: ${signInError.message}`);
          console.error("SignIn error:", signInError);
          setLoading(false);
          return;
        }

        console.log("✅ Вход успешен, ожидаю загрузки профиля...");
        setSuccess("✅ Успешный вход!");
        
        // Дождаться загрузки профиля перед редиректом
        let profileLoaded = false;
        let attempts = 0;
        
        while (!profileLoaded && attempts < 10) {
          attempts++;
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("id", user.id)
              .single();
            
            if (data) {
              console.log("✅ Профиль загружен после входа, редиректю");
              profileLoaded = true;
              // Сохраняем в кэш
              localStorage.setItem("cached_user_data", JSON.stringify(data));
              // Профиль готов, редиректим
              window.location.href = "/";
              break;
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Fallback редирект если профиль не загружен
        if (!profileLoaded) {
          console.warn("⚠️ Профиль не загружен после входа, редиректю anyway");
          window.location.href = "/";
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(`❌ Ошибка: ${errorMsg}`);
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E0F4FF 75%, #F0E5FF 100%)",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative Blobs */}
      <div style={{
        position: "fixed",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, #FFB3BA 0%, #FFDFBA 100%)",
        borderRadius: "50%",
        filter: "blur(120px)",
        opacity: 0.4,
        top: "-200px",
        left: "-200px",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      
      <div style={{
        position: "fixed",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, #BAE1FF 0%, #BAFFC9 100%)",
        borderRadius: "50%",
        filter: "blur(120px)",
        opacity: 0.4,
        bottom: "-150px",
        right: "-150px",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Auth Card */}
      <div style={{
        position: "relative",
        zIndex: 10,
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        padding: "50px 40px",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
        width: "100%",
        maxWidth: "420px",
      }}>
        <h1 style={{
          textAlign: "center",
          marginBottom: "35px",
          fontSize: "48px",
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          color: "#1A1A1A",
          letterSpacing: "-0.5px",
        }}>
          Beautify.AI
        </h1>

        {error && (
          <div style={{
            color: "#d32f2f",
            marginBottom: "20px",
            padding: "14px 18px",
            background: "rgba(255, 205, 210, 0.5)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            fontSize: "14px",
            border: "1px solid rgba(211, 47, 47, 0.2)",
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            color: "#2e7d32",
            marginBottom: "20px",
            padding: "14px 18px",
            background: "rgba(200, 230, 201, 0.5)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            fontSize: "14px",
            border: "1px solid rgba(46, 125, 50, 0.2)",
          }}>
            {success}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 20px",
            marginBottom: "16px",
            border: "2px solid rgba(26, 26, 26, 0.1)",
            borderRadius: "16px",
            fontSize: "15px",
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(10px)",
            color: "#1A1A1A",
            boxSizing: "border-box",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.3s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.3)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.1)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
          }}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 20px",
            marginBottom: "16px",
            border: "2px solid rgba(26, 26, 26, 0.1)",
            borderRadius: "16px",
            fontSize: "15px",
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(10px)",
            color: "#1A1A1A",
            boxSizing: "border-box",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.3s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.3)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.1)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
          }}
        />

        {isSignUp && (
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "16px 20px",
              marginBottom: "16px",
              border: "2px solid rgba(26, 26, 26, 0.1)",
              borderRadius: "16px",
              fontSize: "15px",
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(10px)",
              color: "#1A1A1A",
              boxSizing: "border-box",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.3)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "2px solid rgba(26, 26, 26, 0.1)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
            }}
          />
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="liquid-glass-btn-dark"
          style={{
            width: "100%",
            padding: "16px",
            color: "white",
            border: "none",
            borderRadius: "50px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginTop: "8px",
            fontFamily: "'Inter', sans-serif",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "⏳ Загрузка..." : isSignUp ? "📝 Вход" : "🔐 Вход"}
        </button>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="liquid-glass-btn-dark"
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? "rgba(66, 133, 244, 0.5)" : "linear-gradient(135deg, rgba(66, 133, 244, 0.95) 0%, rgba(66, 133, 244, 0.85) 50%, rgba(66, 133, 244, 0.9) 100%)",
            color: "white",
            border: "none",
            borderRadius: "50px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginTop: "12px",
            fontFamily: "'Inter', sans-serif",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "⏳ Загрузка..." : "🔐 Войти с Google"}
        </button>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setSuccess(null);
          }}
          className="liquid-glass-btn"
          style={{
            width: "100%",
            padding: "16px",
            color: "#1A1A1A",
            border: "none",
            borderRadius: "50px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            marginTop: "20px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {isSignUp ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Вход"}
        </button>
      </div>
    </div>
  );
}
