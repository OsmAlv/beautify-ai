"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

export default function GoonAI() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<"original" | "home" | "bathtub" | "bedroom" | "office">("original");

  // Проверить авторизацию при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser || session?.user) {
        const userId = authUser?.id || session?.user?.id;
        setUser(authUser || session?.user || null);
        
        let userData = null;
        let retries = 0;
        const maxRetries = 5;
        
        while (!userData && retries <= maxRetries) {
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();
          
          if (data) {
            userData = data;
            setUserData(data);
            return;
          }
          
          retries++;
          if (retries <= maxRetries) {
            const delay = 100 + (retries * 50);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          
          const isSignedIn = event === "SIGNED_IN";
          const maxRetries = isSignedIn ? 8 : 6;
          
          let userData = null;
          let retries = 0;
          
          while (!userData && retries <= maxRetries) {
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();
            
            if (data) {
              userData = data;
              setUserData(data);
              return;
            }
            
            retries++;
            if (retries <= maxRetries) {
              const delay = retries <= 3 
                ? 50 + (retries * 30) 
                : 50 + (retries * 100);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
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

    // Проверить авторизацию
    if (!user) {
      setError("❌ Нужна авторизация для этого режима");
      return;
    }

    // Проверить баланс nippies
    if (user && userData && !userData.is_superuser) {
      if (userData.nippies_balance < 50) {
        setError("❌ Недостаточно nippies для Salsa режима (нужно 50)");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/goon-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: image,
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

      // Обновить баланс пользователя после генерации
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
    } catch (err: unknown) {
      console.error("Ошибка:", err);
      setError("Ошибка при отправке запроса");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
  }

  const styles = {
    main: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "30px 20px",
      fontFamily: "var(--font-poppins, sans-serif)",
    } as React.CSSProperties,
    container: {
      maxWidth: "600px",
      margin: "0 auto",
      background: "white",
      borderRadius: "20px",
      padding: "40px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    } as React.CSSProperties,
    title: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#1a1a2e",
      margin: "0",
    } as React.CSSProperties,
    subtitle: {
      fontSize: "14px",
      color: "#666",
      marginTop: "5px",
      margin: "0",
    } as React.CSSProperties,
    nippies: {
      fontSize: "16px",
      color: "#ff6b6b",
      fontWeight: "700",
      marginRight: "20px",
    } as React.CSSProperties,
    userInfo: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    } as React.CSSProperties,
    button: {
      padding: "14px 30px",
      background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "700",
      width: "100%",
      marginBottom: "10px",
      boxShadow: "0 12px 30px rgba(255, 107, 107, 0.35)",
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
    download: {
      padding: "12px 24px",
      background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: "700",
      boxShadow: "0 8px 20px rgba(255, 107, 107, 0.3)",
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
          🌶 Goon AI
        </h1>
        <p style={{
          fontSize: "18px",
          color: "rgba(255, 255, 255, 0.9)",
          margin: "0",
          fontWeight: "300",
          fontFamily: "var(--font-poppins, sans-serif)",
          letterSpacing: "0.5px",
        }}>
          Режим Salsa - Полная свобода
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
            <h2 style={styles.title}>Salsa Редактор</h2>
            <p style={styles.subtitle}>Режим без ограничений</p>
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
                  <Link href="/" style={{ textDecoration: "none" }}>
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
                      ← Назад
                    </button>
                  </Link>
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
                <a href="/auth" style={{ textDecoration: "none" }}>
                  <button style={{
                    padding: "8px 16px",
                    background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)",
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

        {/* Warning */}
        <div style={{
          padding: "15px 18px",
          background: "linear-gradient(135deg, #ffe0b2 0%, #ffcc80 100%)",
          borderRadius: "10px",
          marginBottom: "25px",
          borderLeft: "4px solid #ff6f00",
          fontSize: "13px",
          fontWeight: "600",
          color: "#5a4a00",
        }}>
          ⚠️ <strong>Режим Salsa:</strong> 50 nippies за генерацию. Результат может быть откровенным.
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Preview Section */}
        <div style={styles.preview}>
          {image && (
            <>
              <p style={{ margin: "0 0 10px 0", fontWeight: "600", color: "#1a1a2e" }}>
                📷 Загруженное изображение:
              </p>
              <Image src={image} alt="preview" width={400} height={450} style={styles.image} />
            </>
          )}
        </div>

        {/* Environment Selection */}
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
                  border: environment === env.id ? "2px solid #ff6b6b" : "2px solid #e0e0e0",
                  background: environment === env.id ? "#ffe0e0" : "white",
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
              style={{
                display: "none",
              }}
            />
            <div
              onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.click()}
              style={{
                padding: "30px 20px",
                border: "2px dashed #ff6b6b",
                borderRadius: "12px",
                textAlign: "center" as const,
                cursor: "pointer",
                background: "#fff5f5",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#ff8e8e";
                (e.currentTarget as HTMLElement).style.background = "#ffe0e0";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#ff6b6b";
                (e.currentTarget as HTMLElement).style.background = "#fff5f5";
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📁</div>
              <div style={{ fontWeight: "600", color: "#1a1a2e", fontSize: "14px" }}>
                Нажми, чтобы загрузить фото
              </div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                или перетащи сюда
              </div>
            </div>
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={send}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "🔄 Обработка..." : "🚀 Создать Salsa версию"}
        </button>

        {/* Result Section */}
        {result && (
          <div style={styles.result}>
            <p style={{ margin: "0 0 15px 0", fontWeight: "700", fontSize: "16px", color: "#1a1a2e" }}>
              ✨ Готово!
            </p>
            <Image src={result} alt="result" width={500} height={500} style={{
              maxWidth: "100%",
              maxHeight: "500px",
              borderRadius: "12px",
              marginBottom: "15px",
            }} />
            <div style={{
              display: "flex",
              gap: "12px",
              marginTop: "15px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}>
              <a
                href={result}
                download={`goon-ai-${Date.now()}.png`}
                style={styles.download}
              >
                ⬇️ Скачать
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  alert("✅ Ссылка скопирована!");
                }}
                style={{
                  ...styles.download,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                📋 Копировать ссылку
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
