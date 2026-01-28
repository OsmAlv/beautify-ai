"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface Generation {
  id: string;
  mode: "pretty" | "hot" | "salsa";
  environment: string;
  cost: number;
  created_at: string;
  image_url?: string;
  original_image_url?: string;
  age_days?: number;
  is_expired?: boolean;
  error?: string;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  is_superuser: boolean;
  nippies_balance: number;
  pretty_generations_remaining: number;
  hot_generations_remaining: number;
}

interface UserProfile {
  id: string;
  email: string;
}

const modeColors = {
  pretty: "#FF69B4",
  hot: "#FF6B35",
  salsa: "#FF1744",
};

const modeLabels = {
  pretty: "Pretty",
  hot: "Hot",
  salsa: "Salsa",
};

export default function ProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [displayedGenerations, setDisplayedGenerations] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const handleLogout = async () => {
    // СНАЧАЛА очищаем все хранилище полностью
    localStorage.clear();
    sessionStorage.clear();
    
    try {
      // Пытаемся сделать signOut
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      // Игнорируем ошибки
    }
    
    // Очищаем все cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Принудительный ПОЛНЫЙ перезагруз страницы с очисткой кеша
    window.location.href = "/auth";
    
    // На всякий случай еще один вариант через 100ms
    setTimeout(() => {
      window.location.replace("/auth");
    }, 100);
  };

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/auth";
        return;
      }

      if (!mounted) {
        return;
      }

      setUser({ id: session.user.id, email: session.user.email || "" });

      // Получаем данные пользователя из таблицы users
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile && mounted) {
        console.log("✅ Профиль загружен:", profile.username);
        setUserData(profile);
      }

      // Получаем историю генераций
      console.log("📥 Загружаем историю генераций...");
      const { data: gens } = await supabase
        .from("generation_logs")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (gens && mounted) {
        console.log("✅ Загружено генераций:", gens.length);
        setGenerations(gens);
      }

      if (mounted) {
        console.log("✅ Загрузка завершена, отключаем лоадер");
        setLoading(false);
      }
    };

    checkAuth();
    
    return () => {
      console.log("🔄 Размонтирование компонента");
      mounted = false;
    };
  }, []);

  const handleViewImage = async (gen: Generation) => {
    // Если изображение уже есть, просто показываем его
    if (gen.image_url) {
      setSelectedGen(gen);
      return;
    }

    // Если нет, пытаемся загрузить
    setImageLoading(true);
    try {
      const response = await fetch(`/api/generations/${gen.id}`);
      const data = await response.json();

      setSelectedGen({
        ...gen,
        ...data,
        is_expired: data.status === "expired",
        error: data.error,
      });
    } catch {
      setSelectedGen({
        ...gen,
        error: "Не удалось загрузить изображение",
      });
    } finally {
      setImageLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Маппинг языков на локали для форматирования дат
    const localeMap: Record<string, string> = {
      en: "en-US",
      ru: "ru-RU",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      it: "it-IT",
      pt: "pt-PT",
      pl: "pl-PL",
      tr: "tr-TR",
      ar: "ar-SA",
    };
    
    const locale = localeMap[language] || "en-US";
    
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E0F4FF 75%, #F0E5FF 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Декоративные блобы */}
        <div style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, #FFB3BA 0%, #FFDFBA 100%)",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: 0.4,
          top: "-150px",
          left: "-150px",
        }} />
        <div style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, #BAE1FF 0%, #BAFFC9 100%)",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: 0.4,
          bottom: "-100px",
          right: "-100px",
        }} />

        <div style={{
          background: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "48px 64px",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            border: "4px solid #C2185B",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 24px",
          }} />
          <div style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#1A1A1A",
            marginBottom: "8px",
          }}>
            {t('profile.loading')}
          </div>
          <div style={{
            fontSize: "14px",
            color: "#666",
          }}>
            {t('profile.preparingData')}
          </div>
        </div>
        
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E0F4FF 75%, #F0E5FF 100%)",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden",
      padding: "20px",
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

      {/* Main Content */}
      <main style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        {/* Profile Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
          padding: "32px",
          marginBottom: "25px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}>
            <div>
              <h1 style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: "32px",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#1A1A1A",
                letterSpacing: "-1px",
                margin: "0 0 8px 0",
              }}>
                {t('profile.title')}
              </h1>
              <p style={{
                fontSize: "14px",
                color: "#666",
                margin: 0,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}>
                {user?.email}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleLogout}
                style={{
                  padding: "10px 20px",
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                  color: "#C2185B",
                  border: "2px solid rgba(194, 24, 91, 0.3)",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(194, 24, 91, 0.1)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.15)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {t('profile.logout')}
              </button>
              <Link href="/" style={{
              padding: "10px 20px",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              color: "#1A1A1A",
              border: "2px solid rgba(26, 26, 26, 0.2)",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.3s ease",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                display: "inline-block",
              }}>
                ← {t('profile.backToHome')}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        {userData && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginBottom: "30px",
          }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
              padding: "20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{t('profile.balance')}</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1A1A1A" }}>{userData.nippies_balance}</div>
            </div>
            <div style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
              padding: "20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{t('profile.prettyRemaining')}</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1A1A1A" }}>{userData.pretty_generations_remaining}</div>
            </div>
            <div style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
              padding: "20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{t('profile.hotRemaining')}</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1A1A1A" }}>{userData.hot_generations_remaining}</div>
            </div>
            <div style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
              padding: "20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{t('profile.totalGenerations')}</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#1A1A1A" }}>{generations.length}</div>
            </div>
          </div>
        )}

        {/* Generations Section */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15))",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3) inset",
          padding: "32px",
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#1A1A1A",
            marginBottom: "25px",
          }}>
            {t('profile.generationHistory')}
          </h2>

          {generations.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
            }}>
              <p style={{
                fontSize: "16px",
                color: "#666",
                marginBottom: "20px",
              }}>
                {t('profile.noGenerations')}
              </p>
              <Link href="/" style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "#1A1A1A",
                color: "white",
                border: "2px solid #1A1A1A",
                borderRadius: "50px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "1px",
                textTransform: "uppercase",
                transition: "all 0.3s ease",
              }}>
                {t('profile.startCreating')}
              </Link>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "20px",
            }}>
              {generations.slice(0, displayedGenerations).map((gen) => (
                <div key={gen.id} style={{
                  background: "rgba(255, 255, 255, 0.5)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(26, 26, 26, 0.1)",
                  transition: "all 0.3s ease",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                }}>
                  <div
                    style={{
                      height: "200px",
                      backgroundColor: `${modeColors[gen.mode]}20`,
                      borderBottom: `3px solid ${modeColors[gen.mode]}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      position: "relative",
                      backgroundImage: gen.image_url ? `url(${gen.image_url})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                    onClick={() => handleViewImage(gen)}
                  >
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0, 0, 0, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.3s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}>
                      <button style={{
                        padding: "10px 20px",
                        background: "white",
                        border: "none",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                      }}>
                        {imageLoading ? t('profile.loading') : t('profile.view')}
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: "16px" }}>
                    <div style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: "rgba(255, 255, 255, 0.8)",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: modeColors[gen.mode],
                      marginBottom: "8px",
                    }}>
                      {modeLabels[gen.mode]}
                    </div>
                    {gen.environment && gen.environment !== "original" && (
                      <div style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        background: "rgba(26, 26, 26, 0.05)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        marginLeft: "8px",
                        color: "#666",
                      }}>
                        {gen.environment}
                      </div>
                    )}
                    <div style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "8px",
                    }}>
                      {formatDate(gen.created_at)}
                    </div>
                    {gen.cost > 0 && (
                      <div style={{
                        fontSize: "12px",
                        color: "#1A1A1A",
                        fontWeight: 600,
                        marginTop: "4px",
                      }}>
                        {t('profile.cost')}: {gen.cost} nippies
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Load More Button */}
          {!loading && generations.length > displayedGenerations && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "32px",
            }}>
              <button
                onClick={() => setDisplayedGenerations(prev => prev + 10)}
                style={{
                  padding: "14px 32px",
                  background: "rgba(255, 255, 255, 0.5)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(26, 26, 26, 0.2)",
                  borderRadius: "50px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1A1A1A",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.7)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.5)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {t('profile.loadMore')}
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedGen && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setSelectedGen(null)}>
            <div style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflow: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}>
              <button
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0, 0, 0, 0.1)",
                  fontSize: "24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  zIndex: 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedGen(null);
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.2)";
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(0, 0, 0, 0.1)";
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
              >
                ✕
              </button>

              <div>
                {selectedGen.is_expired ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: "64px", marginBottom: "20px" }}>⏰</div>
                    <h3 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px", color: "#1A1A1A" }}>
                      {t('profile.imageDeleted')}
                    </h3>
                    <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
                      {t('profile.imageExpired', { days: selectedGen.age_days })}
                    </p>
                    {selectedGen.original_image_url && (
                      <div style={{ marginTop: "30px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "#1A1A1A" }}>
                          {t('profile.originalImage')}:
                        </p>
                        <img
                          src={selectedGen.original_image_url}
                          alt="Original"
                          style={{ maxWidth: "100%", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        />
                      </div>
                    )}
                  </div>
                ) : selectedGen.error ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: "64px", marginBottom: "20px" }}>❌</div>
                    <h3 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "12px", color: "#1A1A1A" }}>
                      {t('profile.loadingError')}
                    </h3>
                    <p style={{ fontSize: "14px", color: "#666" }}>{selectedGen.error}</p>
                    {selectedGen.original_image_url && (
                      <div style={{ marginTop: "30px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "#1A1A1A" }}>
                          {t('profile.originalImage')}:
                        </p>
                        <img
                          src={selectedGen.original_image_url}
                          alt="Original"
                          style={{ maxWidth: "100%", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        />
                      </div>
                    )}
                  </div>
                ) : selectedGen.image_url ? (
                  <div>
                    <img
                      src={selectedGen.image_url}
                      alt="Generated"
                      style={{
                        width: "100%",
                        maxHeight: "60vh",
                        objectFit: "contain",
                        borderRadius: "12px",
                        marginBottom: "20px",
                      }}
                    />
                    <div style={{
                      background: "rgba(26, 26, 26, 0.05)",
                      padding: "16px",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                    }}>
                      <p style={{ marginBottom: "8px", color: "#1A1A1A" }}>
                        <strong>{t('profile.mode')}:</strong> {modeLabels[selectedGen.mode]}
                      </p>
                      {selectedGen.environment && (
                        <p style={{ marginBottom: "8px", color: "#1A1A1A" }}>
                          <strong>{t('profile.environment')}:</strong> {selectedGen.environment}
                        </p>
                      )}
                      <p style={{ marginBottom: "8px", color: "#1A1A1A" }}>
                        <strong>{t('profile.date')}:</strong> {formatDate(selectedGen.created_at)}
                      </p>
                      {selectedGen.age_days !== undefined && (
                        <p style={{ marginBottom: "8px", color: "#1A1A1A" }}>
                          <strong>{t('profile.age')}:</strong> {selectedGen.age_days} {t('profile.daysAgo')}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
                        <a
                          href={selectedGen.image_url}
                          download={`makemeaphoto-${selectedGen.mode}-${selectedGen.id}.jpg`}
                          style={{
                            display: "inline-block",
                            padding: "10px 20px",
                            background: "#1A1A1A",
                            color: "white",
                            borderRadius: "20px",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: 600,
                            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                          }}
                        >
                          📥 {t('profile.downloadResult')}
                        </a>
                        {selectedGen.original_image_url && (
                          <a
                            href={selectedGen.original_image_url}
                            download={`makemeaphoto-original-${selectedGen.id}.jpg`}
                            style={{
                              display: "inline-block",
                              padding: "10px 20px",
                              background: "rgba(26, 26, 26, 0.1)",
                              color: "#1A1A1A",
                              border: "1px solid rgba(26, 26, 26, 0.2)",
                              borderRadius: "20px",
                              textDecoration: "none",
                              fontSize: "14px",
                              fontWeight: 600,
                              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                            }}
                          >
                            📥 {t('profile.downloadOriginal')}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", fontSize: "18px", color: "#666" }}>
                    ⏳ {t('profile.loading')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
