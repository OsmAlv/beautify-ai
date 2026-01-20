"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserData {
  id: string;
  email: string;
  username: string;
  is_superuser: boolean;
  nippies_balance: number;
}

export default function ExamplesPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const examples = [
    {
      title: "Pretty Mode",
      description: "Естественная красота с легким улучшением",
      beforeImage: "/landing-img/1.jpg",
      afterImage: "/landing-img/2.jpg",
      color: "#667eea"
    },
    {
      title: "Hot Mode",
      description: "Соблазнительный и яркий стиль",
      beforeImage: "/landing-img/3.jpg",
      afterImage: "/landing-img/4.jpg",
      color: "#f093fb"
    },
    {
      title: "Photoshoot",
      description: "Профессиональная фотосессия с AI",
      beforeImage: "/landing-img/1.jpg",
      afterImage: "/landing-img/3.jpg",
      color: "#764ba2"
    }
  ];

  const nextSlide = () => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % examples.length);
      setFadeIn(true);
    }, 300);
  };

  const prevSlide = () => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + examples.length) % examples.length);
      setFadeIn(true);
    }, 300);
  };

  const goToSlide = (index: number) => {
    if (index !== currentSlide) {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentSlide(index);
        setFadeIn(true);
      }, 300);
    }
  };

  // Автоматическая смена слайдов каждые 3.5 секунды
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3500);
    return () => clearInterval(interval);
  }, [currentSlide]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser || session?.user) {
        setUser(authUser || session?.user || null);
        
        const userId = authUser?.id || session?.user?.id;
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (data) {
          setUserData(data);
        }
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

      {/* Header */}
      <header style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        zIndex: 10,
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#1A1A1A",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            BEAUTIFY.AI
          </div>
        </Link>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {user ? (
            <>
              <Link href="/profile" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "50px",
                  border: "1px solid rgba(26, 26, 26, 0.1)",
                  cursor: "pointer",
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}>
                    {userData?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                  }}>
                    {userData?.username || user.email?.split('@')[0] || "Профиль"}
                  </div>
                </div>
              </Link>
            </>
          ) : (
            <>
              <a href="/auth?mode=signup" style={{ textDecoration: "none" }}>
                <button style={{
                  padding: "8px 20px",
                  background: "linear-gradient(135deg, #EC407A 0%, #F06292 100%)",
                  border: "none",
                  borderRadius: "50px",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  boxShadow: "0 4px 12px rgba(236, 64, 122, 0.3)",
                }}>
                  Регистрация
                </button>
              </a>
              <a href="/auth" style={{ textDecoration: "none" }}>
                <button className="liquid-glass-btn" style={{
                  padding: "8px 20px",
                  background: "rgba(194, 24, 91, 0.1)",
                  border: "1px solid rgba(194, 24, 91, 0.3)",
                  borderRadius: "50px",
                  color: "#C2185B",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                }}>
                  Войти
                </button>
              </a>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        position: "relative",
        zIndex: 10,
      }}>
        <h1 style={{
          fontSize: "56px",
          fontWeight: 700,
          color: "#1A1A1A",
          textAlign: "center",
          marginBottom: "16px",
          letterSpacing: "-1px",
        }}>
          Примеры трансформаций
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#4A4A4A",
          textAlign: "center",
          marginBottom: "60px",
        }}>
          Посмотрите, как наш AI преобразует фотографии
        </p>

        {/* Carousel */}
        <div style={{
          maxWidth: "900px",
          margin: "0 auto 60px auto",
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "40px",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
          position: "relative",
        }}>
          {/* Arrow Buttons */}
          <button
            onClick={prevSlide}
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "none",
              background: "rgba(255, 255, 255, 0.9)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "#C2185B",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              transition: "all 0.3s ease",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
              e.currentTarget.style.background = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
            }}
          >
            ←
          </button>

          <button
            onClick={nextSlide}
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "none",
              background: "rgba(255, 255, 255, 0.9)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "#C2185B",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              transition: "all 0.3s ease",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
              e.currentTarget.style.background = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
            }}
          >
            →
          </button>

          <div style={{
            textAlign: "center",
            marginBottom: "32px",
            opacity: fadeIn ? 1 : 0,
            transform: fadeIn ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.3s ease",
          }}>
            <h3 style={{
              fontSize: "32px",
              fontWeight: 700,
              color: examples[currentSlide].color,
              marginBottom: "12px",
            }}>
              {examples[currentSlide].title}
            </h3>
            <p style={{
              fontSize: "16px",
              color: "#666",
            }}>
              {examples[currentSlide].description}
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginBottom: "32px",
            opacity: fadeIn ? 1 : 0,
            transform: fadeIn ? "scale(1)" : "scale(0.95)",
            transition: "all 0.3s ease",
          }}>
            <div style={{
              background: `linear-gradient(135deg, ${examples[currentSlide].color}33, ${examples[currentSlide].color}11)`,
              borderRadius: "16px",
              padding: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "64px",
              minHeight: "300px",
            }}>
              📷
            </div>
            <div style={{
              background: `linear-gradient(135deg, ${examples[currentSlide].color}66, ${examples[currentSlide].color}33)`,
              borderRadius: "16px",
              padding: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "64px",
              minHeight: "300px",
            }}>
              ✨
            </div>
          </div>

          {/* Carousel Dots */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
          }}>
            {examples.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  border: "none",
                  background: index === currentSlide ? examples[currentSlide].color : "rgba(26, 26, 26, 0.2)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  if (index !== currentSlide) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(26, 26, 26, 0.4)";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== currentSlide) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(26, 26, 26, 0.2)";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div style={{
          textAlign: "center",
          maxWidth: "600px",
          margin: "0 auto",
        }}>
          <h2 style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#1A1A1A",
            marginBottom: "16px",
          }}>
            Готовы попробовать?
          </h2>
          <p style={{
            fontSize: "16px",
            color: "#666",
            marginBottom: "32px",
          }}>
            Загрузите свое фото и получите профессиональный результат за считанные секунды
          </p>
          <div style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
          }}>
            <button
              onClick={() => router.push('/editor')}
              style={{
                padding: "16px 32px",
                background: "#1A1A1A",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              Попробовать Pretty & Hot
            </button>
            <button
              onClick={() => router.push('/photoshoot')}
              style={{
                padding: "16px 32px",
                background: "white",
                color: "#1A1A1A",
                border: "2px solid #1A1A1A",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              Попробовать Photoshoot
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
