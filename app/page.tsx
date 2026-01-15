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
  const [unAuthGenerations, setUnAuthGenerations] = useState(0); // Для неавторизованных
  const [showAuthModal, setShowAuthModal] = useState(false); // Модаль регистрации

  // Проверить авторизацию при загрузке
  useEffect(() => {
    // Загрузить количество генераций неавторизованных пользователей
    if (typeof window !== "undefined") {
      const savedGenerations = localStorage.getItem("unauth_generations");
      setUnAuthGenerations(parseInt(savedGenerations || "0"));
      
      // Загрузить кэшированные данные пользователя если есть
      const cachedUserData = localStorage.getItem("cached_user_data");
      if (cachedUserData) {
        try {
          setUserData(JSON.parse(cachedUserData));
          console.log("✅ Loaded cached user data from localStorage");
        } catch (e) {
          console.error("Failed to parse cached user data:", e);
        }
      }
    }

    const checkAuth = async () => {
      // Сначала проверяем текущую сессию
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser || session?.user) {
        const userId = authUser?.id || session?.user?.id;
        setUser(authUser || session?.user || null);
        
        // Аgressивная загрузка профиля с retry
        let userData = null;
        let retries = 0;
        const maxRetries = 5; // Увеличили обратно
        
        while (!userData && retries <= maxRetries) {
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();
          
          if (data) {
            console.log("✅ User profile loaded on attempt", retries + 1);
            setUserData(data);
            return;
          }
          
          retries++;
          if (retries <= maxRetries) {
            // Прогрессивная задержка: 100ms, 150ms, 200ms...
            const delay = 100 + (retries * 50);
            console.log(`⏳ Retry ${retries}/${maxRetries} (waiting ${delay}ms)`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        console.warn("⚠️ Failed to load user profile after", maxRetries, "retries");
      }
    };

    checkAuth();

    // Слушать изменения аутентификации
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 Auth state changed:", event, "User:", session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          
          // Для SIGNED_IN события - очень агрессивная загрузка
          const isSignedIn = event === "SIGNED_IN";
          const maxRetries = isSignedIn ? 8 : 6; // Еще больше для нового входа
          const initialDelay = isSignedIn ? 50 : 100; // Быстрее начинаем
          
          let userData = null;
          let retries = 0;
          
          while (!userData && retries <= maxRetries) {
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();
            
            if (data) {
              console.log(`✅ ${event}: user data loaded on attempt ${retries + 1}`);
              setUserData(data);
              // Очистить старый кэш и сохранить новые данные
              localStorage.setItem("cached_user_data", JSON.stringify(data));
              return;
            }
            
            retries++;
            if (retries <= maxRetries) {
              // Быстрые повторы вначале, потом более медленные
              const delay = retries <= 3 
                ? initialDelay + (retries * 30) 
                : initialDelay + (retries * 100);
              console.log(`⏳ ${event} retry ${retries}/${maxRetries} (${delay}ms)`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          
          console.warn(`⚠️ Failed to load user profile for ${event} after retries, using cache`);
        } else {
          setUser(null);
          setUserData(null);
          localStorage.removeItem("cached_user_data");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Сохранять userData в localStorage при изменении
  useEffect(() => {
    if (userData && typeof window !== "undefined") {
      localStorage.setItem("cached_user_data", JSON.stringify(userData));
      console.log("💾 Cached user data to localStorage");
    } else if (userData === null && typeof window !== "undefined") {
      localStorage.removeItem("cached_user_data");
    }
  }, [userData]);

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

    // Если не авторизован и уже использовал 1 генерацию - показать модаль
    if (!user && unAuthGenerations >= 1) {
      setShowAuthModal(true);
      return;
    }

    // Если авторизован - проверить лимиты
    if (user && userData && !userData.is_superuser) {
      if (intensity === "pretty" && userData.pretty_generations_remaining <= 0) {
        setError("❌ Исчерпаны бесплатные генерации Pretty режима");
        return;
      }
      if (intensity === "hot" && userData.hot_generations_remaining <= 0 && userData.nippies_balance < 37) {
        setError("❌ Недостаточно nippies для Hot режима (нужно 37)");
        return;
      }
      if (intensity === "salsa" && userData.nippies_balance < 50) {
        setError("❌ Недостаточно nippies для Salsa режима (нужно 50)");
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

      // Если есть imageUrl - показываем напрямую
      if (data.imageUrl) {
        setResult(data.imageUrl);
      }
      // Если есть generation_id - показываем плейсхолдер с ссылкой на профиль
      else if (data.generation_id) {
        setResult(`generation_${data.generation_id}`);
      }

      // Если неавторизован - увеличить счётчик локально
      if (!user) {
        const newCount = unAuthGenerations + 1;
        setUnAuthGenerations(newCount);
        if (typeof window !== "undefined") {
          localStorage.setItem("unauth_generations", newCount.toString());
        }
      }

      // Обновить баланс пользователя если авторизован
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
    } catch {
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

  const styles = {
    main: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      padding: "20px",
      fontFamily: "var(--font-poppins, 'Segoe UI', sans-serif)",
    } as React.CSSProperties,
    container: {
      maxWidth: "1000px",
      margin: "0 auto",
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 30px 80px rgba(0, 0, 0, 0.4)",
      backdropFilter: "blur(10px)",
    } as React.CSSProperties,
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "40px",
      borderBottom: "2px solid #f0f0f0",
      paddingBottom: "20px",
    } as React.CSSProperties,
    userInfo: {
      fontSize: "14px",
      color: "#666",
      textAlign: "right" as const,
    } as React.CSSProperties,
    nippies: {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#ff6b9d",
      marginBottom: "8px",
    } as React.CSSProperties,
    title: {
      fontSize: "42px",
      fontWeight: "800",
      color: "#1a1a2e",
      margin: "0",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",      fontFamily: "var(--font-space-grotesk, sans-serif)",
      letterSpacing: "-1px",    } as React.CSSProperties,
    subtitle: {
      color: "#999",
      margin: "8px 0 0 0",
      fontSize: "14px",
    } as React.CSSProperties,
    genderSelect: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "15px",
      marginBottom: "30px",
    } as React.CSSProperties,
    genderButton: {
      padding: "16px 20px",
      border: "2px solid #e0e0e0",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: "700",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      background: "white",
    } as React.CSSProperties,
    environmentSelect: {
      marginBottom: "30px",
      padding: "20px",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      borderRadius: "15px",
    } as React.CSSProperties,
    envLabel: {
      marginBottom: "15px",
      fontWeight: "700",
      color: "#1a1a2e",
      fontSize: "15px",
    } as React.CSSProperties,
    envButtons: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "10px",
    } as React.CSSProperties,
    envButton: {
      padding: "12px",
      border: "2px solid transparent",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "600",
      transition: "all 0.3s ease",
      background: "white",
    } as React.CSSProperties,
    uploadSection: {
      marginBottom: "30px",
    } as React.CSSProperties,
    label: {
      display: "block",
      marginBottom: "12px",
      fontWeight: "700",
      color: "#1a1a2e",
      fontSize: "15px",
    } as React.CSSProperties,
    fileInput: {
      display: "none",
    } as React.CSSProperties,
    uploadBox: {
      padding: "40px",
      border: "3px dashed #667eea",
      borderRadius: "15px",
      textAlign: "center" as const,
      cursor: "pointer",
      background: "linear-gradient(135deg, #f8f9ff 0%, #f0f3ff 100%)",
      transition: "all 0.3s ease",
    } as React.CSSProperties,
    uploadText: {
      color: "#667eea",
      fontWeight: "700",
      fontSize: "16px",
    } as React.CSSProperties,
    button: {
      padding: "14px 30px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "700",
      width: "100%",
      marginBottom: "10px",
      boxShadow: "0 12px 30px rgba(102, 126, 234, 0.35)",
      transition: "all 0.3s ease",
    } as React.CSSProperties,
    error: {
      padding: "15px",
      background: "#fadbd8",
      color: "#c0392b",
      borderRadius: "10px",
      marginBottom: "15px",
      borderLeft: "4px solid #c0392b",
      fontWeight: "600",
    } as React.CSSProperties,
    preview: {
      marginBottom: "25px",
      textAlign: "center" as const,
    } as React.CSSProperties,
    image: {
      maxWidth: "100%",
      maxHeight: "450px",
      borderRadius: "12px",
      marginTop: "12px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    } as React.CSSProperties,
    result: {
      marginTop: "30px",
      padding: "25px",
      background: "linear-gradient(135deg, #f5f7fa 0%, #f0f3ff 100%)",
      borderRadius: "15px",
      textAlign: "center" as const,
    } as React.CSSProperties,
    resultButtons: {
      display: "flex",
      gap: "12px",
      marginTop: "15px",
      justifyContent: "center" as const,
      flexWrap: "wrap" as const,
    } as React.CSSProperties,
    download: {
      padding: "12px 24px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: "700",
      boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
      transition: "all 0.3s ease",
    } as React.CSSProperties,
  };

  return (
    <main style={styles.main}>
      {/* Hero Section */}
      <div style={{
        textAlign: "center",
        marginBottom: "50px",
        paddingTop: "20px",
      }}>
        <h1 style={{
          fontSize: "56px",
          fontWeight: "900",
          color: "white",
          margin: "0 0 15px 0",
          textShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
          fontFamily: "var(--font-space-grotesk, sans-serif)",
          letterSpacing: "-1.5px",
        }}>
          ✨ Beautify.AI
        </h1>
        <p style={{
          fontSize: "18px",
          color: "rgba(255, 255, 255, 0.9)",
          margin: "0",
          fontWeight: "300",
          fontFamily: "var(--font-poppins, sans-serif)",
          letterSpacing: "0.5px",
        }}>
          Преврати свою фото в невероятную 3D версию с AI
        </p>
      </div>

      <div style={styles.container}>
        {/* Top Info Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "35px",
          paddingBottom: "20px",
          borderBottom: "2px solid #f0f0f0",
        }}>
          <div>
            <h2 style={styles.title}>Твой редактор</h2>
          </div>
          <div style={styles.userInfo}>
            {userData ? (
              <div style={{ textAlign: "right" }}>
                <div style={{
                  ...styles.nippies,
                  marginRight: "0",
                }}>
                  {userData.is_superuser ? (
                    <span style={{ color: "#ff6b9d", fontWeight: "900", fontSize: "18px" }}>
                      👑 СУПЕР
                    </span>
                  ) : (
                    <>🌶 {userData.nippies_balance.toFixed(0)} nippies</>
                  )}
                </div>
                <div style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                  {userData.username}
                </div>
                <div style={{ marginTop: "8px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <a href="/profile" style={{ textDecoration: "none" }}>
                    <button style={{
                      padding: "6px 12px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                      📊 Мой профиль
                    </button>
                  </a>
                  <button onClick={handleLogout} style={{
                    padding: "6px 12px",
                    background: "#f0f0f0",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}>
                    Выход
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
                  💎 {1 - unAuthGenerations} из 1 генерации
                </div>
                <a href="/auth" style={{ textDecoration: "none" }}>
                  <button style={{
                    padding: "8px 16px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}>
                    Войти / Регистрация
                  </button>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Статус сообщения */}
        {userData && !userData.is_superuser && (
          <div style={{
            padding: "15px 18px",
            background: "linear-gradient(135deg, #fff8e1 0%, #ffe082 100%)",
            borderRadius: "10px",
            marginBottom: "25px",
            borderLeft: "4px solid #ffa000",
            fontSize: "13px",
            fontWeight: "600",
            color: "#6b5900",
          }}>
            💎 Pretty: <strong>{userData.pretty_generations_remaining}</strong> бесплатных | 
            🔥 Hot: <strong>{userData.hot_generations_remaining}</strong> бесплатная (потом 37 🌶) |
            🌶 Salsa: <strong>50 nippies</strong>
          </div>
        )}

        {userData?.is_superuser && (
          <div style={{
            padding: "18px 20px",
            background: "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)",
            borderRadius: "10px",
            marginBottom: "25px",
            borderLeft: "4px solid #ff6b6b",
            fontSize: "14px",
            fontWeight: "700",
            color: "white",
            textAlign: "center",
          }}>
            👑 СУПЕР ДОСТУП: ∞ Бесконечные генерации всех режимов • ∞ Абсолютно бесплатно
          </div>
        )}

        {/* Main Content Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginBottom: "30px",
        }}>
          {/* Left Column - Controls */}
          <div>
            {result && (
              <div style={{
                padding: "12px",
                background: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "12px",
                color: "#856404",
                fontWeight: "600",
                textAlign: "center",
              }}>
                💡 Измени параметры ниже и нажми &#34;Создать&#34; для новой генерации
              </div>
            )}
            
            {/* Mode Selection */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#1a1a2e",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px",
              }}>
                🎬 Стиль преобразования
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}>
                {[
                  { id: "pretty", icon: "✨", label: "Pretty", color: "#667eea" },
                  { id: "hot", icon: "🔥", label: "Hot", color: "#f093fb" },
                  { id: "salsa", icon: "🌶", label: "Salsa", color: "#ff6b6b" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setIntensity(mode.id as "pretty" | "hot" | "salsa")}
                    disabled={mode.id !== "pretty" && !userData}
                    style={{
                      padding: "16px",
                      border: intensity === mode.id ? `2px solid ${mode.color}` : "2px solid #e0e0e0",
                      background: intensity === mode.id ? `${mode.color}15` : "white",
                      borderRadius: "10px",
                      cursor: (mode.id !== "pretty" && !userData) ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "700",
                      transition: "all 0.3s ease",
                      opacity: (mode.id !== "pretty" && !userData) ? 0.5 : 1,
                    }}
                  >
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Environment Selection */}
            {(intensity === "hot" || intensity === "salsa") && (
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#1a1a2e",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                }}>
                  🏠 Окружение
                </h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                  gap: "8px",
                }}>
                  {[
                    { id: "original", label: "📷 Оригинал" },
                    { id: "home", label: "🏠 Дома" },
                    { id: "bathtub", label: "🛁 Ванна" },
                    { id: "bedroom", label: "🛏️ Спальня" },
                    { id: "office", label: "💼 Офис" },
                  ].map((env) => (
                    <button
                      key={env.id}
                      onClick={() => setEnvironment(env.id as "original" | "home" | "bathtub" | "bedroom" | "office")}
                      style={{
                        padding: "10px 8px",
                        border: environment === env.id ? "2px solid #667eea" : "2px solid #e0e0e0",
                        background: environment === env.id ? "#f0f3ff" : "white",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {env.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#1a1a2e",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px",
              }}>
                📸 Загрузить фото
              </h3>
              <label style={{
                display: "block",
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                <div style={{
                  padding: "30px",
                  border: "2px dashed #667eea",
                  borderRadius: "12px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #f8f9ff 0%, #f0f3ff 100%)",
                  transition: "all 0.3s ease",
                }}>
                  <div style={{
                    fontSize: "28px",
                    marginBottom: "8px",
                  }}>
                    {image ? "✓" : "📤"}
                  </div>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#667eea",
                  }}>
                    {image ? "Изображение загружено ✓" : "Нажми или перетащи фото"}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div>
            {image ? (
              <div>
                <h3 style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#1a1a2e",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                }}>
                  👁️ Превью
                </h3>
                <img
                  src={image}
                  alt="Preview"
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.15)",
                  }}
                />
              </div>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "400px",
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                borderRadius: "12px",
                color: "#999",
                fontSize: "14px",
                fontWeight: "600",
              }}>
                Загрузи фото чтобы увидеть превью
              </div>
            )}
          </div>
        </div>

        {/* Main Action Button */}
        <button
          onClick={send}
          disabled={!image || loading}
          style={{
            ...styles.button,
            marginBottom: "25px",
            height: "50px",
            fontSize: "16px",
            opacity: !image || loading ? 0.6 : 1,
            cursor: !image || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            "⏳ Обработка..."
          ) : result ? (
            "✨ Создать с новыми параметрами"
          ) : (
            "✨ Преобразовать магией AI"
          )}
        </button>

        {error && (
          <div style={{
            ...styles.error,
            marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div style={{
            ...styles.result,
            marginTop: "35px",
          }}>
            <h3 style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#1a1a2e",
              marginBottom: "15px",
            }}>
              🎉 Ваш результат готов!
            </h3>
            
            {/* Если это generation_id - показываем плейсхолдер и ссылку на профиль */}
            {result.startsWith("generation_") ? (
              <div style={{
                padding: "40px",
                background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
                borderRadius: "12px",
                textAlign: "center",
                marginBottom: "15px",
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>✨</div>
                <p style={{ color: "#666", marginBottom: "20px", fontSize: "15px" }}>
                  Ваша генерация сохранена! Изображение доступно 7 дней в сервисе Wavespeed.
                </p>
                <a href="/profile" style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  transition: "transform 0.2s",
                }}>
                  👁️ Просмотреть в профиле
                </a>
              </div>
            ) : (
              <img
                src={result}
                alt="Result"
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  marginBottom: "15px",
                  boxShadow: "0 15px 35px rgba(0, 0, 0, 0.15)",
                }}
              />
            )}
            
            <div style={styles.resultButtons}>
              {!result.startsWith("generation_") && (
                <a
                  href={result}
                  download="beautified-image.jpg"
                  style={{
                    ...styles.download,
                    flex: "1",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ⬇️ Скачать
                </a>
              )}
              <button
                onClick={send}
                disabled={loading}
                style={{
                  ...styles.download,
                  flex: "1",
                  background: "#764ba2",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "⏳ Переобработка..." : "🔄 Заново с теми же параметрами"}
              </button>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {showAuthModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowAuthModal(false)}
          >
            <div
              style={{
                background: "white",
                padding: "40px",
                borderRadius: "15px",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
                textAlign: "center",
                maxWidth: "420px",
                width: "90%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: "0 0 15px 0", color: "#1a1a2e", fontSize: "24px" }}>
                🚀 Создай аккаунт
              </h2>
              <p style={{ color: "#666", marginBottom: "25px", fontSize: "15px" }}>
                Ты использовал одну бесплатную генерацию. Зарегистрируйся и получи:
              </p>
              <ul style={{
                textAlign: "left",
                color: "#666",
                fontSize: "14px",
                marginBottom: "25px",
                paddingLeft: "20px",
              }}>
                <li>💎 5 бесплатных Pretty генераций</li>
                <li>🔥 1 бесплатная Hot генерация</li>
                <li>🌶 Доступ к Salsa режиму</li>
              </ul>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setTimeout(() => window.location.href = "/auth?mode=signup", 100);
                  }}
                  style={{
                    padding: "14px 20px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "15px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Регистрация
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setTimeout(() => window.location.href = "/auth?mode=login", 100);
                  }}
                  style={{
                    padding: "14px 20px",
                    background: "#f0f0f0",
                    color: "#333",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "15px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Я уже зарегистрирован
                </button>
              </div>

              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  marginTop: "15px",
                  padding: "8px 15px",
                  background: "transparent",
                  border: "none",
                  color: "#999",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                ✕ Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}