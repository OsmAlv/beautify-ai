"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
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
  const [intensity, setIntensity] = useState<"pretty" | "hot">("pretty");
  const [environment, setEnvironment] = useState<"original" | "home" | "bathtub" | "bedroom" | "office">("original");
  const [model, setModel] = useState<"bytedance" | "nanobana">("bytedance");
  const [unAuthGenerations, setUnAuthGenerations] = useState(0); // Для неавторизованных
  const [showAuthModal, setShowAuthModal] = useState(false); // Модаль регистрации
  const [isMobile, setIsMobile] = useState(false);
  const { t } = useTranslation('editor');

  // Placeholder presets/history state to satisfy UI references
  const presets = { natural: {}, moderate: {}, maximum: {} } as const;
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const applyPreset = (id: keyof typeof presets) => { setSelectedPreset(String(id)); };
  const history: any[] = [];
  const loadFromHistory = (item: any) => { if (item?.image) setImage(item.image); };
  const [customPrompt, setCustomPrompt] = useState("");

  // Проверить размер экрана
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        setError("Исчерпаны бесплатные генерации Pretty режима");
        return;
      }
      if (intensity === "hot" && userData.hot_generations_remaining <= 0 && userData.nippies_balance < 37) {
        setError("Недостаточно nippies для Hot режима (нужно 37)");
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
          model,
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
    console.log("🚪 Начинаю выход из аккаунта...");
    try {
      await supabase.auth.signOut();
      console.log("✅ SignOut успешен");
      
      setUser(null);
      setUserData(null);
      
      // Очистить все кэши
      if (typeof window !== "undefined") {
        localStorage.removeItem("cached_user_data");
        localStorage.removeItem("unauth_generations");
      }
      
      console.log("🔄 Редиректю на главную после выхода");
      // Редирект на главную
      window.location.href = "/";
    } catch (err) {
      console.error("❌ Logout error:", err);
      // Все равно очищаем и редиректим
      setUser(null);
      setUserData(null);
      localStorage.removeItem("cached_user_data");
      window.location.href = "/";
    }
  };

  const styles = {
    main: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E0F4FF 75%, #F0E5FF 100%)",
      padding: "20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative" as const,
      overflow: "hidden",
    } as React.CSSProperties,
    // Декоративные размытые пятна
    bgBlob1: {
      position: "fixed" as const,
      width: "600px",
      height: "600px",
      background: "radial-gradient(circle, #FFB3BA 0%, #FFDFBA 100%)",
      top: "-150px",
      left: "-150px",
      borderRadius: "50%",
      filter: "blur(120px)",
      opacity: 0.4,
      pointerEvents: "none" as const,
      zIndex: 0,
    } as React.CSSProperties,
    bgBlob2: {
      position: "fixed" as const,
      width: "500px",
      height: "500px",
      background: "radial-gradient(circle, #BAE1FF 0%, #BAFFC9 100%)",
      bottom: "-100px",
      right: "-100px",
      borderRadius: "50%",
      filter: "blur(120px)",
      opacity: 0.4,
      pointerEvents: "none" as const,
      zIndex: 0,
    } as React.CSSProperties,
    container: {
      maxWidth: "1000px",
      margin: "0 auto",
      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)",
      borderRadius: "24px",
      padding: isMobile ? "20px" : "48px",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255, 255, 255, 0.5)",
      position: "relative" as const,
      zIndex: 1,
    } as React.CSSProperties,
    header: {
      display: "flex",
      flexDirection: isMobile ? "column" as const : "row" as const,
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" as const : "center" as const,
      marginBottom: isMobile ? "24px" : "40px",
      borderBottom: "2px solid #f0f0f0",
      paddingBottom: isMobile ? "16px" : "20px",
      gap: isMobile ? "12px" : "0",
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
      fontSize: isMobile ? "28px" : "48px",
      fontWeight: "900",
      color: "#1A1A1A",
      margin: "0",
      fontFamily: "var(--font-space-grotesk, sans-serif)",
      letterSpacing: isMobile ? "-1px" : "-2px",
      lineHeight: "1.2",
    } as React.CSSProperties,
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
      padding: "18px 24px",
      border: "2px solid #e8e8e8",
      borderRadius: "16px",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: "700",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      background: "linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
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
      padding: "48px",
      border: "3px dashed #667eea",
      borderRadius: "20px",
      textAlign: "center" as const,
      cursor: "pointer",
      background: "linear-gradient(135deg, #f8f9ff 0%, #f0f3ff 100%)",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      position: "relative" as const,
      overflow: "hidden",
    } as React.CSSProperties,
    uploadText: {
      color: "#667eea",
      fontWeight: "700",
      fontSize: "16px",
    } as React.CSSProperties,
    button: {
      padding: "18px 36px",
      background: "#1A1A1A",
      color: "white",
      border: "2px solid #1A1A1A",
      borderRadius: "50px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      letterSpacing: "1.5px",
      textTransform: "uppercase" as const,
      width: "100%",
      marginBottom: "10px",
      boxShadow: "none",
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
      padding: "14px 28px",
      background: "#1A1A1A",
      color: "white",
      border: "none",
      borderRadius: "50px",
      cursor: "pointer",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "1.5px",
      transition: "all 0.3s ease",
    } as React.CSSProperties,
  };

  return (
    <main style={styles.main}>
      {/* Декоративные фоновые элементы */}
      <div style={styles.bgBlob1}></div>
      <div style={styles.bgBlob2}></div>
      
      {/* Hero Section */}
      <div style={styles.container}>
        {/* Top Info Bar */}
        <div style={{
          marginBottom: "35px",
          paddingBottom: "20px",
          borderBottom: "2px solid #f0f0f0",
        }}>
          <h2 style={styles.title}>{t('title')}</h2>
          <p style={{
            color: "#666",
            margin: "8px 0 0 0",
            fontSize: "14px",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Unauth Warning */}
        {!user && (
          <div style={{
            padding: "15px 20px",
            background: "rgba(255, 255, 255, 0.8)",
            border: "2px solid rgba(26, 26, 26, 0.1)",
            borderRadius: "12px",
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            <div style={{ fontSize: "14px", color: "#666" }}>
              {1 - unAuthGenerations} {t('generationsAvailable')}
            </div>
            <a href="/auth" style={{ textDecoration: "none" }}>
              <button style={{
                padding: "10px 20px",
                background: "#1A1A1A",
                color: "white",
                border: "2px solid #1A1A1A",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                transition: "all 0.3s ease",
              }}>
                {t('loginRegister')}
              </button>
            </a>
          </div>
        )}

        {/* Статус сообщения */}
        {userData && (
          <div style={{
            padding: "12px 20px",
            background: "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            marginBottom: "25px",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            fontSize: "13px",
            fontWeight: "600",
            color: "#1A1A1A",
            maxWidth: "600px",
          }}>
            Pretty: <strong>{userData.pretty_generations_remaining}</strong> {t('prettyFree')} | 
            Hot: <strong>{userData.hot_generations_remaining}</strong> {t('hotFree')} ({t('then')} 37 nippies)
          </div>
        )}

        {/* История генераций */}
        {history.length > 0 && (
          <div style={{
            marginBottom: "25px",
            padding: "20px",
            background: "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.5)",
          }}>
            <h3 style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#1A1A1A",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "12px",
            }}>
              {t('historyTitle')} ({history.length})
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? "70px" : "90px"}, 1fr))`,
              gap: "10px",
            }}>
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  style={{
                    padding: "0",
                    border: "2px solid rgba(26, 26, 26, 0.2)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    overflow: "hidden",
                    background: "white",
                    transition: "all 0.3s ease",
                    aspectRatio: "1",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.borderColor = "#1A1A1A";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.borderColor = "rgba(26, 26, 26, 0.2)";
                  }}
                >
                  <img
                    src={item.result}
                    alt="History"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </button>
              ))}
            </div>
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
                {t('styleSelection')}
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}>
                {[
                  { id: "pretty", label: "Pretty" },
                  { id: "hot", label: "Hot" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setIntensity(mode.id as "pretty" | "hot");
                      if (mode.id === "hot") setModel("bytedance");
                    }}
                    disabled={mode.id !== "pretty" && !userData}
                    className={intensity === mode.id ? "liquid-glass-btn-dark" : "liquid-glass-btn"}
                    style={{
                      padding: "18px 16px",
                      borderRadius: "12px",
                      cursor: (mode.id !== "pretty" && !userData) ? "not-allowed" : "pointer",
                      fontSize: "15px",
                      fontWeight: 700,
                      border: "none",
                      opacity: (mode.id !== "pretty" && !userData) ? 0.5 : 1,
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#1a1a2e",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px",
              }}>
                {t('modelLabel')}
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: intensity === "hot" ? "1fr" : "1fr 1fr",
                gap: "10px",
              }}>
                {[
                  { id: "bytedance", label: "ByteDance", desc: t('fast') },
                  ...(intensity === "pretty" ? [{ id: "nanobana", label: "NanoBana", desc: t('quality') }] : []),
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id as "bytedance" | "nanobana")}
                    className={model === m.id ? "liquid-glass-btn-dark" : "liquid-glass-btn"}
                    style={{
                      padding: "18px 16px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: 700,
                      border: "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {m.label}
                    <div style={{ fontSize: "11px", fontWeight: 400, opacity: 0.7 }}>
                      {m.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Environment Selection */}
            {intensity === "hot" && (
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#1a1a2e",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px",
                }}>
                  {t('environmentLabel')}
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEnvironment(env.id as "original" | "home" | "bathtub" | "bedroom" | "office");
                      }}
                      type="button"
                      className={environment === env.id ? "liquid-glass-btn-dark" : "liquid-glass-btn"}
                      style={{
                        padding: "10px 8px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: "600",
                        border: "none",
                      }}
                    >
                      {env.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Prompt */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#1a1a2e",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "12px",
              }}>
                {t('customPrompt')}
              </h3>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={t('customPromptPlaceholder')}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "2px solid #e0e0e0",
                  fontSize: "13px",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  resize: "vertical",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
              />
            </div>

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
                {t('uploadPhoto')}
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
                    {image ? `${t('uploadPhoto')} ✓` : t('clickOrDrag')}
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
                  {t('preview')}
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
                {t('uploadPhotoPreview')}
              </div>
            )}
          </div>
        </div>

        {/* Main Action Button */}
        <button
          onClick={send}
          disabled={!image || loading}
          className="liquid-glass-btn-dark"
          style={{
            width: "100%",
            padding: "18px 36px",
            marginBottom: "25px",
            height: "50px",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            borderRadius: "50px",
            border: "none",
            color: "white",
            opacity: !image || loading ? 0.6 : 1,
            cursor: !image || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            t('processing')
          ) : result ? (
            t('regenerateBtn')
          ) : (
            t('transformBtn')
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
                  padding: "14px 28px",
                  background: "#1A1A1A",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "50px",
                  fontWeight: 600,
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2C2C2C";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1A1A1A";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
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
                  className="liquid-glass-btn-dark"
                  style={{
                    flex: "1",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "14px 28px",
                    color: "white",
                    border: "none",
                    borderRadius: "50px",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  ⬇️ Скачать
                </a>
              )}
              <button
                onClick={send}
                disabled={loading}
                className="liquid-glass-btn"
                style={{
                  flex: "1",
                  padding: "14px 28px",
                  color: "#1A1A1A",
                  border: "none",
                  borderRadius: "50px",
                  fontSize: "14px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? t('processing') : t('regenerateBtn')}
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
                <li>💎 5 {t('freeGenerations')}</li>
                <li>🔥 1 бесплатная Hot генерация</li>
              </ul>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setTimeout(() => window.location.href = "/auth?mode=signup", 100);
                  }}
                  className="liquid-glass-btn-dark"
                  style={{
                    padding: "14px 20px",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "50px",
                    fontWeight: 600,
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}
                >
                  Регистрация
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    setTimeout(() => window.location.href = "/auth?mode=login", 100);
                  }}
                  className="liquid-glass-btn"
                  style={{
                    padding: "14px 20px",
                    color: "#1A1A1A",
                    textDecoration: "none",
                    borderRadius: "50px",
                    fontWeight: 600,
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
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