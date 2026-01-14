"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserData {
  id: string;
  email: string;
  username: string;
  is_superuser: boolean;
  nippies_balance: number;
  pretty_generations_remaining: number;
  hot_generations_remaining: number;
}

export default function Home() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<"pretty" | "hot" | "salsa">("pretty");
  const [environment, setEnvironment] = useState<"original" | "home" | "bathtub" | "bedroom" | "office">("original");

  // Проверить авторизацию при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser(authUser);
        // Получить данные пользователя
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (data) {
          setUserData(data);
        }
      }
    };

    checkAuth();

    // Слушать изменения аутентификации
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (data) {
            setUserData(data);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function send() {
    if (!image) {
      setError("Загрузи изображение");
      return;
    }

    // Проверить может ли пользователь использовать режим
    if (!userData?.is_superuser && (intensity === "hot" || intensity === "salsa")) {
      if (intensity === "hot" && userData!.hot_generations_remaining <= 0 && userData!.nippies_balance < 37) {
        setError("Недостаточно nippies для Hot режима (нужно 37)");
        return;
      }
      if (intensity === "salsa" && userData!.nippies_balance < 50) {
        setError("Недостаточно nippies для Salsa режима (нужно 50)");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: image,
          intensity,
          environment,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при обработке");
        return;
      }

      setResult(data.imageUrl);

      // Обновить баланс пользователя
      if (user?.id) {
        const { data: updatedUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (updatedUser) {
          setUserData(updatedUser);
        }
      }
    } catch (err) {
      setError("Ошибка при отправке");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
  };

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h1>🎨 Beautify.AI</h1>
        <p>Пожалуйста, <a href="/auth">войди или зарегистрируйся</a></p>
      </div>
    );
  }

  const styles = {
    main: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    } as React.CSSProperties,
    container: {
      maxWidth: "900px",
      margin: "0 auto",
      background: "white",
      borderRadius: "15px",
      padding: "30px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    } as React.CSSProperties,
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      borderBottom: "2px solid #eee",
      paddingBottom: "15px",
    } as React.CSSProperties,
    userInfo: {
      fontSize: "14px",
      color: "#666",
    } as React.CSSProperties,
    nippies: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#f093fb",
      marginRight: "20px",
    } as React.CSSProperties,
    title: {
      fontSize: "32px",
      fontWeight: "bold",
      color: "#333",
      margin: "0",
    } as React.CSSProperties,
    subtitle: {
      color: "#666",
      margin: "5px 0 0 0",
    } as React.CSSProperties,
    genderSelect: {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
      flexWrap: "wrap" as const,
    } as React.CSSProperties,
    genderButton: {
      padding: "12px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
      transition: "all 0.3s ease",
    } as React.CSSProperties,
    environmentSelect: {
      marginBottom: "20px",
      padding: "15px",
      background: "#f9f9f9",
      borderRadius: "8px",
    } as React.CSSProperties,
    envLabel: {
      marginBottom: "10px",
      fontWeight: "bold",
      color: "#333",
    } as React.CSSProperties,
    envButtons: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
      gap: "10px",
    } as React.CSSProperties,
    envButton: {
      padding: "10px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      transition: "all 0.3s ease",
    } as React.CSSProperties,
    uploadSection: {
      marginBottom: "20px",
    } as React.CSSProperties,
    label: {
      display: "block",
      marginBottom: "10px",
      fontWeight: "bold",
      color: "#333",
    } as React.CSSProperties,
    fileInput: {
      display: "none",
    } as React.CSSProperties,
    uploadBox: {
      padding: "30px",
      border: "2px dashed #667eea",
      borderRadius: "8px",
      textAlign: "center" as const,
      cursor: "pointer",
      background: "#f8f9ff",
      transition: "all 0.3s ease",
    } as React.CSSProperties,
    uploadText: {
      color: "#667eea",
      fontWeight: "bold",
    } as React.CSSProperties,
    button: {
      padding: "12px 30px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "bold",
      width: "100%",
      marginBottom: "10px",
      boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
    } as React.CSSProperties,
    error: {
      padding: "12px",
      background: "#fadbd8",
      color: "#e74c3c",
      borderRadius: "5px",
      marginBottom: "15px",
    } as React.CSSProperties,
    preview: {
      marginBottom: "20px",
      textAlign: "center" as const,
    } as React.CSSProperties,
    image: {
      maxWidth: "100%",
      maxHeight: "400px",
      borderRadius: "8px",
      marginTop: "10px",
    } as React.CSSProperties,
    result: {
      marginTop: "20px",
      padding: "20px",
      background: "#f9f9f9",
      borderRadius: "8px",
      textAlign: "center" as const,
    } as React.CSSProperties,
    resultButtons: {
      display: "flex",
      gap: "10px",
      marginTop: "15px",
      justifyContent: "center" as const,
    } as React.CSSProperties,
    download: {
      padding: "10px 20px",
      background: "#667eea",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      textDecoration: "none",
      fontSize: "14px",
    } as React.CSSProperties,
  };

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🎨 Beautify.AI</h1>
            <p style={styles.subtitle}>Преврати свою фото в 3D персонажа</p>
          </div>
          <div style={styles.userInfo}>
            <div style={styles.nippies}>
              🌶 {userData?.nippies_balance.toFixed(2) || "0"} nippies
            </div>
            <div>{userData?.username}</div>
            <button onClick={handleLogout} style={{ marginTop: "10px", padding: "5px 10px" }}>
              Выход
            </button>
          </div>
        </div>

        {/* Показать ограничения для не суперюзеров */}
        {!userData?.is_superuser && (
          <div style={{ padding: "10px", background: "#fff3cd", borderRadius: "5px", marginBottom: "15px", fontSize: "12px" }}>
            💎 Pretty: {userData?.pretty_generations_remaining || 0} бесплатных генераций<br/>
            🔥 Hot: {userData?.hot_generations_remaining || 0} бесплатная генерация (потом 37 nippies)<br/>
            🌶 Salsa: 50 nippies за генерацию
          </div>
        )}

        <div style={styles.genderSelect}>
          <button
            onClick={() => setIntensity("pretty")}
            style={{
              ...styles.genderButton,
              background: intensity === "pretty" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#e8e8e8",
              color: intensity === "pretty" ? "white" : "#666",
              boxShadow: intensity === "pretty" ? "0 8px 20px rgba(102, 126, 234, 0.3)" : "none",
            }}
          >
            ✨ Pretty
          </button>
          <button
            onClick={() => setIntensity("hot")}
            style={{
              ...styles.genderButton,
              background: intensity === "hot" ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" : "#e8e8e8",
              color: intensity === "hot" ? "white" : "#666",
              boxShadow: intensity === "hot" ? "0 8px 20px rgba(245, 87, 108, 0.3)" : "none",
            }}
          >
            🔥 Hot
          </button>
          <button
            onClick={() => setIntensity("salsa")}
            style={{
              ...styles.genderButton,
              background: intensity === "salsa" ? "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)" : "#e8e8e8",
              color: intensity === "salsa" ? "white" : "#666",
              boxShadow: intensity === "salsa" ? "0 8px 20px rgba(255, 107, 107, 0.3)" : "none",
            }}
          >
            🌶 Salsa
          </button>
        </div>

        {(intensity === "hot" || intensity === "salsa") && (
          <div style={styles.environmentSelect}>
            <p style={styles.envLabel}>Выбери окружение:</p>
            <div style={styles.envButtons}>
              {[
                { id: "original", label: "📷 Оригинальный фон" },
                { id: "home", label: "🏠 Дома" },
                { id: "bathtub", label: "🛁 Ванна" },
                { id: "bedroom", label: "🛏️ Спальня" },
                { id: "office", label: "💼 Офис" },
              ].map((env) => (
                <button
                  key={env.id}
                  onClick={() => setEnvironment(env.id as typeof environment)}
                  style={{
                    ...styles.envButton,
                    background: environment === env.id ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" : "#f0f0f0",
                    color: environment === env.id ? "white" : "#333",
                    boxShadow: environment === env.id ? "0 6px 15px rgba(245, 87, 108, 0.25)" : "none",
                  }}
                >
                  {env.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={styles.uploadSection}>
          <label style={styles.label}>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={styles.fileInput} />
            <div style={styles.uploadBox}>
              <span style={styles.uploadText}>
                {image ? "✓ Изображение загружено" : "📤 Выбери изображение"}
              </span>
            </div>
          </label>
        </div>

        {image && (
          <div style={styles.preview}>
            <h3>Исходное изображение:</h3>
            <img src={image} alt="Preview" style={styles.image} />
          </div>
        )}

        <button
          onClick={send}
          disabled={!image || loading}
          style={{
            ...styles.button,
            opacity: !image || loading ? 0.5 : 1,
            cursor: !image || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⏳ Обработка..." : "✨ Преобразовать"}
        </button>

        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <div style={styles.result}>
            <h3>Результат:</h3>
            <img src={result} alt="Result" style={styles.image} />
            <div style={styles.resultButtons}>
              <a href={result} download="beautified-image.jpg" style={styles.download}>
                ⬇️ Скачать изображение
              </a>
              <button
                onClick={send}
                disabled={loading}
                style={{
                  ...styles.download,
                  marginLeft: "10px",
                  background: "#764ba2",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "⏳ Переобработка..." : "🔄 Regenerate"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
