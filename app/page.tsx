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
  const [user, setUser] = useState<any>(null);
  
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
            <button className="btn btn-secondary liquid-glass-btn" onClick={() => router.push('/examples')}>
              {t('btnExamples')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
