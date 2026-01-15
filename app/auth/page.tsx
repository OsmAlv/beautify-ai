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

  const styles = {
    main: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
    } as React.CSSProperties,
    container: {
      background: "white",
      padding: "40px",
      borderRadius: "15px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      width: "100%",
      maxWidth: "400px",
    } as React.CSSProperties,
    title: {
      textAlign: "center" as const,
      marginBottom: "30px",
      fontSize: "28px",
      fontWeight: "bold",
      color: "#333",
    },
    input: {
      width: "100%",
      padding: "12px",
      marginBottom: "15px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      fontSize: "14px",
      boxSizing: "border-box" as const,
    },
    button: {
      width: "100%",
      padding: "12px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "bold",
      marginTop: "10px",
    },
    toggleButton: {
      width: "100%",
      padding: "12px",
      background: "#f0f0f0",
      color: "#333",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      marginTop: "15px",
    },
    error: {
      color: "#e74c3c",
      marginBottom: "15px",
      padding: "10px",
      background: "#fadbd8",
      borderRadius: "5px",
    },
    success: {
      color: "#27ae60",
      marginBottom: "15px",
      padding: "10px",
      background: "#d5f4e6",
      borderRadius: "5px",
    },
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}> Beautify.AI</h1>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {isSignUp && (
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.5 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⏳ Загрузка..." : isSignUp ? "📝 Регистрация" : "🔐 Вход"}
        </button>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            ...styles.button,
            background: "#4285F4",
            marginTop: "10px",
            opacity: loading ? 0.5 : 1,
            cursor: loading ? "not-allowed" : "pointer",
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
          style={styles.toggleButton}
        >
          {isSignUp ? "Уже есть аккаунт? Вход" : "Нет аккаунта? Регистрация"}
        </button>
      </div>
    </main>
  );
}
