"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function LandingPage() {
  const router = useRouter();
  const { t } = useTranslation('landing');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [photoshootSlide, setPhotoshootSlide] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  
  const images = [
    "/landing-img/1.jpg",
    "/landing-img/2.jpg",
    "/landing-img/3.jpg",
    "/landing-img/4.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Карусель для карточки фотосессии (3 After фото)
  useEffect(() => {
    const interval = setInterval(() => {
      setPhotoshootSlide((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="landing-container">
      {/* Декоративные блобы */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      {/* Header is rendered globally */}

      {/* Основной контент */}
      <main className="main-content">
        {/* Левая колонка - Фото */}
        <div className="photo-section">
          <div className="photo-card">
            <div className="carousel">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Beauty ${index + 1}`}
                  className={`carousel-image ${index === currentSlide ? 'active' : ''}`}
                />
              ))}
            </div>
            <div className="carousel-dots">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Правая колонка - Текст */}
        <div className="content-section">
          <h1 className="main-title">
              {t('title').split('\n').map((line: string, i: number) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
          </h1>
          <p className="main-description">
              {t('description').split('\n').map((line: string, i: number) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
          </p>

          <div className="buttons-group">
            <button className="btn btn-primary liquid-glass-btn-dark" onClick={() => router.push('/photoshoot')}>
              {t('btnPhotoshoot')}
            </button>
            <button className="btn btn-primary liquid-glass-btn-dark" onClick={() => router.push('/editor')}>
              {t('btnTry')}
            </button>
          </div>
        </div>
      </main>

      {/* AI Studio Section - Claid-inspired */}
      <section style={{
        padding: '20px 40px 50px',
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '36px',
        }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: 800,
            marginBottom: '12px',
            color: '#1A1A1A',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            letterSpacing: '-2px',
            lineHeight: '1.1',
          }}>
            {t('toolsTitle')}
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#666',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: '1.7',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}>
            {t('toolsSubtitle')}
          </p>
        </div>

        {/* Studio Window Interface */}
        <div style={{
          background: '#1A1A1A',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* Window Top Bar */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5F57' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFBD2E' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28C940' }} />
            </div>
            <span style={{ 
              color: 'rgba(255,255,255,0.8)', 
              fontSize: '14px', 
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}>
              MakeMeAPhoto AI Studio
            </span>
          </div>

          {/* Main Content Area */}
          <div style={{
            display: 'flex',
            background: '#0A0A0A',
            minHeight: '450px',
          }}>
            {/* Left Toolbar */}
            <div style={{
              width: '70px',
              background: 'rgba(255,255,255,0.03)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 0',
              gap: '6px',
              alignItems: 'center',
            }}>
              {['✨', '🔥', '📸', '🎨', '✂️', '🌟'].map((icon, i) => (
                <div
                  key={i}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: i < 3 ? 'rgba(194,24,91,0.15)' : 'rgba(255,255,255,0.05)',
                    border: i < 3 ? '1px solid rgba(194,24,91,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {icon}
                </div>
              ))}
            </div>

            {/* Cards Grid */}
            <div style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '18px',
                maxWidth: '1200px',
                width: '100%',
              }}>
                {/* Pretty Mode Card */}
                <div
                  onMouseEnter={() => setHoveredCard(0)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => router.push('/editor')}
                  style={{
                    background: 'rgba(30,30,30,0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '0px solid rgba(255,255,255,0.1)',
                    boxShadow: hoveredCard === 0
                      ? '0 20px 60px rgba(194,24,91,0.4)'
                      : '0 8px 24px rgba(0,0,0,0.3)',
                    transform: hoveredCard === 0 ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  }}
                >
                  {/* Image Preview */}
                  <div style={{
                    height: '200px',
                    display: 'flex',
                    position: 'relative',
                    overflow: 'hidden',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {/* Before Image */}
                    <div style={{
                      flex: '1',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <img 
                        src="/examples/pretty-before.jpg" 
                        alt="Before"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'all 0.5s ease',
                          transform: hoveredCard === 0 ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(10px)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#fff',
                        zIndex: 3,
                      }}>Before</div>
                    </div>
                    {/* After Image */}
                    <div style={{
                      flex: '1',
                      position: 'relative',
                      overflow: 'hidden',
                      borderLeft: '2px solid rgba(255,255,255,0.3)',
                    }}>
                      <img 
                        src="/examples/pretty.jpg" 
                        alt="After"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'all 0.5s ease',
                          transform: hoveredCard === 0 ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(194,24,91,0.8)',
                        backdropFilter: 'blur(10px)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#fff',
                        zIndex: 3,
                      }}>After</div>
                    </div>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(255,215,0,0.9)',
                      backdropFilter: 'blur(10px)',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#1A1A1A',
                      border: '1px solid rgba(255,215,0,0.5)',
                      boxShadow: '0 2px 8px rgba(255,215,0,0.3)',
                    }}>
                      ⭐ Popular
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: '#fff',
                      marginBottom: '6px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    }}>
                      {t('prettyModeTitle')}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '10px',
                      lineHeight: '1.6',
                    }}>
                      {t('prettyModeDesc')}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}>
                      {['Skin', 'Makeup', 'Retouch'].map(tag => (
                        <span key={tag} style={{
                          background: 'rgba(194,24,91,0.2)',
                          color: '#FF4081',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid rgba(194,24,91,0.3)',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hot Mode Card */}
                <div
                  onMouseEnter={() => setHoveredCard(1)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => router.push('/editor')}
                  style={{
                    background: 'rgba(30,30,30,0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: hoveredCard === 1
                      ? '0 20px 60px rgba(156,39,176,0.4)'
                      : '0 8px 24px rgba(0,0,0,0.3)',
                    transform: hoveredCard === 1 ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  }}
                >
                  <div style={{
                    height: '200px',
                    display: 'flex',
                    position: 'relative',
                    overflow: 'hidden',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {/* Before Image */}
                    <div style={{
                      flex: '1',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <img 
                        src="/examples/hot-before.jpg" 
                        alt="Before"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'all 0.5s ease',
                          transform: hoveredCard === 1 ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(10px)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#fff',
                        zIndex: 3,
                      }}>Before</div>
                    </div>
                    {/* After Image */}
                    <div style={{
                      flex: '1',
                      position: 'relative',
                      overflow: 'hidden',
                      borderLeft: '2px solid rgba(255,255,255,0.3)',
                    }}>
                      <img 
                        src="/examples/hot.jpg" 
                        alt="After"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'all 0.5s ease',
                          transform: hoveredCard === 1 ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(156,39,176,0.8)',
                        backdropFilter: 'blur(10px)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#fff',
                        zIndex: 3,
                      }}>After</div>
                    </div>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(156,39,176,0.9)',
                      backdropFilter: 'blur(10px)',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#fff',
                      border: '1px solid rgba(156,39,176,0.5)',
                      boxShadow: '0 2px 8px rgba(156,39,176,0.3)',
                    }}>
                      🚀 AI
                    </div>
                  </div>

                  <div style={{ padding: '16px' }}>
                    <h3 style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: '#fff',
                      marginBottom: '6px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    }}>
                      {t('hotModeTitle')}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '10px',
                      lineHeight: '1.6',
                    }}>
                      {t('hotModeDesc')}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}>
                      {['Prompts', 'Style', 'Effects'].map(tag => (
                        <span key={tag} style={{
                          background: 'rgba(156,39,176,0.2)',
                          color: '#BA68C8',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid rgba(156,39,176,0.3)',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Photoshoot Mode Card */}
                <div
                  onMouseEnter={() => setHoveredCard(2)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => router.push('/photoshoot')}
                  style={{
                    background: 'rgba(30,30,30,0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: hoveredCard === 2
                      ? '0 20px 60px rgba(63,81,181,0.4)'
                      : '0 8px 24px rgba(0,0,0,0.3)',
                    transform: hoveredCard === 2 ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                  }}
                >
                  <div style={{
                    height: '200px',
                    display: 'flex',
                    position: 'relative',
                    overflow: 'hidden',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {/* Левая часть - Before (статичная) */}
                    <div style={{
                      flex: '1',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <img 
                        src="/examples/photoshoot-before.jpg"
                        alt="Before"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'all 0.5s ease',
                          transform: hoveredCard === 2 ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(10px)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#fff',
                        zIndex: 3,
                      }}>Before</div>
                    </div>

                    {/* Правая часть - After (карусель из 3 фото) */}
                    <div style={{
                      flex: '1',
                      position: 'relative',
                      overflow: 'hidden',
                      borderLeft: '2px solid rgba(255,255,255,0.3)',
                    }}>
                      {[
                        '/examples/photoshoot1.jpeg',
                        '/examples/photoshoot2.jpeg',
                        '/examples/photoshoot3.jpeg',
                      ].map((src, index) => (
                        <div
                          key={index}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            opacity: photoshootSlide === index ? 1 : 0,
                            transition: 'opacity 0.6s ease-in-out',
                          }}
                        >
                          <img 
                            src={src}
                            alt={`After ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'all 0.5s ease',
                              transform: hoveredCard === 2 ? 'scale(1.1)' : 'scale(1)',
                            }}
                          />
                        </div>
                      ))}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(63,81,181,0.8)',
                        backdropFilter: 'blur(10px)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#fff',
                        zIndex: 3,
                      }}>After</div>
                      
                      {/* Dots для карусели After */}
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '6px',
                        zIndex: 3,
                        padding: '4px 10px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                      }}>
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            style={{
                              width: photoshootSlide === i ? '16px' : '6px',
                              height: '6px',
                              borderRadius: photoshootSlide === i ? '3px' : '50%',
                              background: photoshootSlide === i ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
                      pointerEvents: 'none',
                    }} />
                    
                    {/* Badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      background: 'rgba(63,81,181,0.9)',
                      backdropFilter: 'blur(10px)',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#fff',
                      border: '1px solid rgba(63,81,181,0.5)',
                      boxShadow: '0 2px 8px rgba(63,81,181,0.3)',
                      zIndex: 3,
                    }}>
                      ⚡ Batch
                    </div>
                  </div>

                  <div style={{ padding: '16px' }}>
                    <h3 style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: '#fff',
                      marginBottom: '6px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    }}>
                      {t('photoshootTitle')}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '10px',
                      lineHeight: '1.6',
                    }}>
                      {t('photoshootDesc')}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}>
                      {['Batch', '4 Photos', 'Fast'].map(tag => (
                        <span key={tag} style={{
                          background: 'rgba(63,81,181,0.2)',
                          color: '#7986CB',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: '1px solid rgba(63,81,181,0.3)',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 40px 30px',
        textAlign: 'center',
        background: 'transparent',
        position: 'relative',
        zIndex: 1,
      }}>
        <p style={{
          fontSize: '13px',
          color: '#999',
          margin: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          Copyright © 2026 MakeMeAPhoto · All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
