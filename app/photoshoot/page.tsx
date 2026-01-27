"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
}

export default function Photoshoot() {
  const { t } = useTranslation('photoshoot');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [photoCount, setPhotoCount] = useState(5);
  const [environment, setEnvironment] = useState("studio");
  const [model, setModel] = useState("nanobana"); // nanobana или bytedance
  const [isMobile, setIsMobile] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);

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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let loadedCount = 0;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push(event.target?.result as string);
        loadedCount++;
        
        if (loadedCount === files.length) {
          setImages(prev => [...prev, ...newImages]);
          setResults([]);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function generatePhotoshoot() {
    if (images.length === 0) {
      setError(t('uploadError'));
      return;
    }

    // Проверяем авторизацию
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user || user;
    
    if (!currentUser) {
      setError(t('authRequired'));
      return;
    }

    // Загружаем актуальные данные пользователя
    const { data: currentUserData } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    const costPerPhoto = 50; // 50 nippies за фото
    const totalCost = photoCount * costPerPhoto;

    if (currentUserData && !currentUserData.is_superuser && currentUserData.nippies_balance < totalCost) {
      setError(`${t('insufficientBalance')} ${totalCost}, ${t('youHave')}: ${currentUserData.nippies_balance}`);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setProgressPercent(0);
    setProgressMessage(t('progressSending'));

    // Симуляция прогресса
    let progressInterval: NodeJS.Timeout | null = null;
    progressInterval = setInterval(() => {
      setProgressPercent(prev => {
        if (prev < 85) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000); // Обновление каждую секунду

    try {
      console.log("📸 Отправка запроса на фотосессию:", {
        photoCount,
        environment,
        hasImages: images.length > 0,
        imageCount: images.length,
        hasCustomPrompt: !!customPrompt,
        userId: currentUser.id
      });

      setProgressPercent(5);
      setProgressMessage(t('progressProcessing'));

      setTimeout(() => {
        setProgressMessage(t('progressGenerating'));
      }, 2000);

      const response = await fetch("/api/photoshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrls: images,
          customPrompt,
          photoCount,
          environment,
          model,
          userId: currentUser.id,
        }),
      });

      const data = await response.json();
      console.log("📡 Ответ от API:", data);

      if (progressInterval) clearInterval(progressInterval);
      setProgressPercent(90);

      if (!response.ok) {
        console.error("❌ Ошибка от API:", response.status, data);
        if (progressInterval) clearInterval(progressInterval);
        setProgressMessage("");
        setError(data.error || `Ошибка ${response.status}: ${response.statusText}`);
        return;
      }

      if (data.results && data.results.length > 0) {
        if (progressInterval) clearInterval(progressInterval);
        setResults(data.results);
        setProgressPercent(100);
        setProgressMessage("✅ Фотосессия завершена!");
        console.log(`✅ Получено ${data.results.length} из ${photoCount} запрошенных фото`);
        
        // Если получено меньше фото, чем запрошено, показываем предупреждение
        if (data.results.length < photoCount) {
          setError(`${t('progressWarning')} ${data.results.length} ${t('progressWarningOf')} ${photoCount} ${t('progressWarningPhotos')}`);
        }
        
        // Очистить сообщение через 2 секунды
        setTimeout(() => setProgressMessage(""), 2000);
      } else {
        if (progressInterval) clearInterval(progressInterval);
        setProgressMessage("");
        setError("Не удалось получить результаты фотосессии");
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
      if (progressInterval) clearInterval(progressInterval);
      setProgressMessage("");
      setProgressPercent(0);
      setError("Ошибка при отправке запроса");
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setLoading(false);
      if (!results.length) {
        setProgressMessage("");
        setProgressPercent(0);
      }
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E8D5F2 75%, #E0E8FF 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
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

      {/* Header is rendered globally */}

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
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: isMobile ? "36px" : "56px",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#1A1A1A",
            letterSpacing: "-1px",
            margin: "0 0 15px 0",
          }}>
            {t('title')}
          </h1>
          <p style={{
            fontSize: isMobile ? "16px" : "20px",
            fontWeight: 300,
            lineHeight: 1.8,
            color: "#4A4A4A",
            margin: "0",
          }}>
            {t('description')}
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
                  {t('createTitle')}
                </h2>
                <p style={{
                  fontSize: "14px",
                  color: "#666",
                  margin: 0,
                }}>
                  {photoCount} {t('photosCount')} • {photoCount * 50} nippies (~${(photoCount * 50 * 0.0027).toFixed(2)})
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

          {/* Image Upload */}
          <div style={{ 
            marginBottom: "40px",
          }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <label style={{ cursor: "pointer", display: "inline-block" }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                <div
                  className="liquid-glass-btn"
                  style={{
                    padding: "18px 48px",
                    fontSize: "16px",
                    fontWeight: 600,
                    borderRadius: "50px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#1A1A1A",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {images.length > 0 ? `${t('addMore')} (${images.length})` : t('uploadPhotos')}
                </div>
              </label>
              <div style={{
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                color: "#666",
                fontSize: "13px",
                flexDirection: "column",
              }}>
                <div>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span>⭐</span>
                  <span style={{ marginLeft: "8px", fontWeight: 500 }}>{t('byUsers')}</span>
                </div>
                <div style={{ color: "#8e8e93", fontWeight: 400, fontSize: "13px", marginTop: "4px" }}>
                  {t('tip')}
                </div>
              </div>
            </div>
            
            {/* Preview uploaded images */}
            {images.length > 0 && (
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "20px",
                  textAlign: "center",
                  color: "#1A1A1A",
                }}>
                  {t('uploadedPhotosTitle')} ({images.length})
                </h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "15px",
                  background: "white",
                  padding: isMobile ? "20px" : "30px",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                }}>
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "12px",
                          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          color: "#ff4444",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Environment Selection */}
          {images.length > 0 && (
            <>
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#1A1A1A",
            }}>
              {t('selectEnvironment')}
            </h3>
            <p style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "16px",
              lineHeight: 1.5,
            }}>
              {t('selectPlace')}
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: "12px",
            }}>
              {[
                { id: "studio", label: t('studio'), icon: "🎬", desc: t('studioDesc') },
                { id: "nature", label: t('nature'), icon: "🌿", desc: t('natureDesc') },
                { id: "city", label: t('city'), icon: "🏙️", desc: t('cityDesc') },
                { id: "beach", label: t('beach'), icon: "🏖️", desc: t('beachDesc') },
              ].map((env) => (
                <button
                  key={env.id}
                  onClick={() => setEnvironment(env.id)}
                  className={environment === env.id ? "liquid-glass-btn-dark" : "liquid-glass-btn"}
                  style={{
                    padding: "16px 12px",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>{env.icon}</span>
                  <span>{env.label}</span>
                  <span style={{ fontSize: "10px", opacity: 0.7, fontWeight: 400 }}>{env.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection - Скрыто, используется только Nano Banana */}

          {/* Photo Count */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#1A1A1A",
            }}>
              {t('photoCount')}
            </h3>
            <p style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "16px",
              lineHeight: 1.5,
            }}>
              {t('morePhotos')}
            </p>
            <input
              type="range"
              min="3"
              max="10"
              value={photoCount}
              onChange={(e) => setPhotoCount(Number(e.target.value))}
              style={{
                width: "100%",
                height: "12px",
                borderRadius: "50px",
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                outline: "none",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
                cursor: "pointer",
                WebkitAppearance: "none",
                appearance: "none",
              }}
              className="liquid-glass-slider"
            />
            <div style={{
              textAlign: "center",
              fontSize: "28px",
              fontWeight: 700,
              color: "#1A1A1A",
              marginTop: "15px",
            }}>
              {photoCount} {t('photosCount')}
            </div>
          </div>

          {/* Custom Prompt */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#1A1A1A",
            }}>
              {t('descriptionLabel')}
            </h3>
            <p style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "16px",
              lineHeight: 1.5,
            }}>
              {t('descriptionText')}
            </p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
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
            disabled={loading || images.length === 0}
            className={loading || images.length === 0 ? "" : "liquid-glass-btn-dark"}
            style={{
              width: "100%",
              padding: "20px 48px",
              fontSize: "16px",
              fontWeight: 600,
              borderRadius: "50px",
              cursor: loading || images.length === 0 ? "not-allowed" : "pointer",
              border: "none",
              background: loading || images.length === 0 
                ? "linear-gradient(135deg, rgba(200, 200, 200, 0.3), rgba(180, 180, 180, 0.2))"
                : undefined,
              opacity: loading || images.length === 0 ? 0.5 : 1,
              transition: "all 0.3s ease",
            }}
          >
            {loading ? t('creating') : t('createPhotoshoot')}
          </button>

          {/* Estimated Time */}
          {images.length > 0 && !loading && (
            <div style={{
              marginTop: "16px",
              textAlign: "center",
              fontSize: "13px",
              color: "#666",
              fontWeight: 500,
            }}>
              ⏱️ {t('estimatedTime')} <strong>{Math.ceil(photoCount * 0.3)}-{Math.ceil(photoCount * 0.5)} {t('minutes')}</strong>
            </div>
          )}

          </>
          )}

          {/* Progress Bar and Message */}
          {loading && (
            <div style={{
              marginTop: "30px",
              padding: "32px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.25))",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
            }}>
              {/* Progress Bar */}
              <div style={{
                width: "100%",
                height: "16px",
                background: "linear-gradient(135deg, rgba(200, 200, 200, 0.2), rgba(180, 180, 180, 0.15))",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                borderRadius: "50px",
                overflow: "hidden",
                marginBottom: "20px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.5) inset",
              }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: progressPercent === 100 
                    ? "linear-gradient(90deg, #4cd964 0%, #5ac777 100%)"
                    : "linear-gradient(90deg, rgba(140, 140, 140, 0.9) 0%, rgba(100, 100, 100, 0.85) 100%)",
                  borderRadius: "50px",
                  transition: "width 0.5s ease, background 0.3s ease",
                  boxShadow: progressPercent === 100
                    ? "0 0 20px rgba(76, 217, 100, 0.4)"
                    : "0 0 10px rgba(0, 0, 0, 0.1)",
                }}/>
              </div>
              
              {/* Progress Text */}
              <div style={{
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1A1A1A",
                marginBottom: "8px",
              }}>
                {progressMessage}
              </div>

              {/* Progress Percentage */}
              <div style={{
                textAlign: "center",
                fontSize: "24px",
                fontWeight: 700,
                color: progressPercent === 100 ? "#4cd964" : "#8e8e93",
                transition: "color 0.3s ease",
              }}>
                {progressPercent}%
              </div>

              {/* Time Info */}
              <div style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "12px",
                color: "#999",
              }}>
                {t('generatingPhotos')}
              </div>
            </div>
          )}

          {/* Progress Message (success) */}
          {progressMessage && !loading && (
            <div style={{
              marginTop: "20px",
              padding: "16px 24px",
              background: "linear-gradient(135deg, rgba(76, 217, 100, 0.15), rgba(90, 199, 119, 0.1))",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(76, 217, 100, 0.3)",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#1A1A1A",
              textAlign: "center",
              boxShadow: "0 4px 16px rgba(76, 217, 100, 0.1)",
            }}>
              {progressMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: "20px",
              padding: "16px",
              background: "rgba(255, 100, 100, 0.1)",
              border: "2px solid rgba(255, 100, 100, 0.3)",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#CC0000",
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <h3 style={{
                fontSize: "22px",
                fontWeight: 600,
                marginBottom: "25px",
                color: "#1A1A1A",
              }}>
                {t('photoshootReady')}
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
                      {t('downloadPhoto')} {index + 1}
                    </a>
                  </div>
                ))}
              </div>

              {/* Generate Again Button */}
              <div style={{ marginTop: "30px", textAlign: "center" }}>
                <button
                  onClick={() => {
                    setResults([]);
                    setProgressMessage("");
                    setError("");
                    setProgressPercent(0);
                  }}
                  className="liquid-glass-btn"
                  style={{
                    padding: "16px 40px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    border: "none",
                    borderRadius: "50px",
                    cursor: "pointer",
                    background: "linear-gradient(135deg, rgba(255, 229, 229, 0.6), rgba(255, 212, 229, 0.6), rgba(255, 240, 245, 0.6), rgba(232, 213, 242, 0.6))",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    boxShadow: "0 4px 16px rgba(194, 24, 91, 0.15)",
                  }}
                >
                  {t('createAnother')}
                </button>
              </div>
            </div>
          )}

          {/* Back Link */}
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <Link href="/" className="liquid-glass-btn" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 32px",
              color: "#1A1A1A",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
              borderRadius: "50px",
            }}>
              {t('backToHome')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
