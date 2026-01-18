"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserData {
  id: string;
  email: string;
  username: string;
  is_superuser: boolean;
  nippies_balance: number;
}

export default function Photoshoot() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [photoCount, setPhotoCount] = useState(5);
  const [environment, setEnvironment] = useState("studio");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser || session?.user) {
        const userId = authUser?.id || session?.user?.id;
        setUser(authUser || session?.user || null);
        
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (data) setUserData(data);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (data) setUserData(data);
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
      setResults([]);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function generatePhotoshoot() {
    if (!image) {
      setError("Загрузите фотографию");
      return;
    }

    if (!user) {
      setError("Для создания фотосессии нужна авторизация");
      return;
    }

    const costPerPhoto = 50; // 50 nippies за фото
    const totalCost = photoCount * costPerPhoto;

    if (userData && !userData.is_superuser && userData.nippies_balance < totalCost) {
      setError(`Недостаточно nippies. Нужно: ${totalCost}, у вас: ${userData.nippies_balance}`);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch("/api/photoshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: image,
          customPrompt,
          photoCount,
          environment,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при создании фотосессии");
        return;
      }

      if (data.results) {
        setResults(data.results);
      }

      // Обновить баланс
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
      console.error("Ошибка:", err);
      setError("Ошибка при отправке запроса");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E0F4FF 75%, #F0E5FF 100%)",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Декоративные блобы */}
      <div style={{
        position: "fixed",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, #FFB3BA 0%, #FFDFBA 100%)",
        borderRadius: "50%",
        filter: "blur(120px)",
        opacity: 0.4,
        top: "-150px",
        left: "-150px",
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
        bottom: "-100px",
        right: "-100px",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Header */}
      <header style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "20px 30px" : "30px 80px",
      }}>
        <Link href="/" style={{
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "2px",
          color: "#2C2C2C",
          textDecoration: "none",
        }}>BEAUTIFY.AI</Link>
        <Link href="/" style={{
          fontSize: "14px",
          color: "#2C2C2C",
          textDecoration: "none",
        }}>Главная</Link>
      </header>

      <main style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "900px",
        margin: "0 auto",
        padding: isMobile ? "20px" : "40px 60px 60px",
      }}>
        {/* Title Section */}
        <div style={{
          textAlign: "center",
          marginBottom: isMobile ? "30px" : "50px",
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? "36px" : "56px",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "#1A1A1A",
            letterSpacing: "-1px",
            margin: "0 0 15px 0",
          }}>
            AI Фотосессия
          </h1>
          <p style={{
            fontSize: isMobile ? "16px" : "20px",
            fontWeight: 300,
            lineHeight: 1.8,
            color: "#4A4A4A",
            margin: "0",
          }}>
            Профессиональная фотосессия за $5 вместо $100
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
          padding: isMobile ? "24px" : "40px",
        }}>
          {/* User Info */}
          {userData && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
              paddingBottom: "20px",
              borderBottom: "1px solid rgba(26, 26, 26, 0.1)",
              flexWrap: isMobile ? "wrap" : "nowrap",
              gap: "15px",
            }}>
              <div>
                <h2 style={{
                  fontSize: isMobile ? "20px" : "24px",
                  fontWeight: 600,
                  color: "#1A1A1A",
                  margin: "0 0 5px 0",
                }}>
                  Создать фотосессию
                </h2>
                <p style={{
                  fontSize: "14px",
                  color: "#666",
                  margin: 0,
                }}>
                  {photoCount} фото • {photoCount * 50} nippies (~${(photoCount * 50 * 0.0027).toFixed(2)})
                </p>
              </div>
              <div style={{
                textAlign: "right",
                padding: "12px 20px",
                background: "rgba(255, 255, 255, 0.5)",
                borderRadius: "12px",
                border: "1px solid rgba(26, 26, 26, 0.1)",
              }}>
                <div style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1A1A1A",
                }}>
                  {userData.is_superuser ? (
                    <span>👑 СУПЕР</span>
                  ) : (
                    <>{userData.nippies_balance.toFixed(0)} nippies</>
                  )}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "2px",
                }}>
                  {userData.username}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: "15px 20px",
              background: "rgba(255, 107, 107, 0.1)",
              color: "#c0392b",
              borderRadius: "12px",
              marginBottom: "25px",
              borderLeft: "4px solid #c0392b",
              fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#1A1A1A",
            }}>
              Загрузить фото
            </h3>
            <label style={{ display: "block" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <div style={{
                padding: isMobile ? "30px" : "40px",
                border: "2px dashed rgba(26, 26, 26, 0.2)",
                borderRadius: "16px",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(255, 255, 255, 0.3)",
                transition: "all 0.3s ease",
              }}>
                {image ? (
                  <img
                    src={image}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                ) : (
                  <div>
                    <div style={{ fontSize: "48px", marginBottom: "10px" }}>📷</div>
                    <p style={{
                      color: "#1A1A1A",
                      fontWeight: 600,
                      fontSize: "14px",
                      margin: 0,
                    }}>
                      Нажми или перетащи фото
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Environment Selection */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#1A1A1A",
            }}>
              Окружение
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: "12px",
            }}>
              {[
                { id: "studio", label: "Студия" },
                { id: "nature", label: "Природа" },
                { id: "city", label: "Город" },
                { id: "beach", label: "Пляж" },
              ].map((env) => (
                <button
                  key={env.id}
                  onClick={() => setEnvironment(env.id)}
                  className={environment === env.id ? "liquid-glass-btn-dark" : "liquid-glass-btn"}
                  style={{
                    padding: "14px 16px",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {env.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Count */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#1A1A1A",
            }}>
              Количество фото
            </h3>
            <input
              type="range"
              min="3"
              max="10"
              value={photoCount}
              onChange={(e) => setPhotoCount(Number(e.target.value))}
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "3px",
                background: "rgba(26, 26, 26, 0.1)",
                outline: "none",
              }}
            />
            <div style={{
              textAlign: "center",
              fontSize: "28px",
              fontWeight: 700,
              color: "#1A1A1A",
              marginTop: "15px",
            }}>
              {photoCount} фото
            </div>
          </div>

          {/* Custom Prompt */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#1A1A1A",
            }}>
              Описание фотосессии (опционально)
            </h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Опишите желаемую позу, стиль, одежду, настроение... Например: 'Летнее платье, улыбка, уверенная поза'"
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "16px",
                border: "2px solid rgba(26, 26, 26, 0.2)",
                borderRadius: "12px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
                background: "rgba(255, 255, 255, 0.5)",
                color: "#1A1A1A",
              }}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePhotoshoot}
            disabled={loading || !image}
            className="liquid-glass-btn-dark"
            style={{
              width: "100%",
              padding: "18px 36px",
              fontSize: "14px",
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              borderRadius: "50px",
              cursor: loading || !image ? "not-allowed" : "pointer",
              border: "none",
              color: "white",
              opacity: loading || !image ? 0.5 : 1,
            }}
          >
            {loading ? "СОЗДАЕМ ФОТОСЕССИЮ..." : "СОЗДАТЬ ФОТОСЕССИЮ"}
          </button>

          {/* Results */}
          {results.length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <h3 style={{
                fontSize: "22px",
                fontWeight: 600,
                marginBottom: "25px",
                color: "#1A1A1A",
              }}>
                Ваша фотосессия готова! 🎉
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                gap: "20px",
              }}>
                {results.map((url, index) => (
                  <div key={index} style={{ position: "relative" }}>
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <a
                      href={url}
                      download={`photoshoot-${index + 1}.jpg`}
                      className="liquid-glass-btn"
                      style={{
                        display: "block",
                        marginTop: "12px",
                        padding: "12px",
                        color: "#1A1A1A",
                        textAlign: "center",
                        borderRadius: "10px",
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: "none",
                      }}
                    >
                      Скачать фото {index + 1}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back Link */}
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <Link href="/" style={{
              color: "#1A1A1A",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}>
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
