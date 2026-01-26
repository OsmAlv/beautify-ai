"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/contexts/LanguageContext";
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
  const { t } = useTranslation('examples');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const examples = [
    { title: t('prettyMode'), description: t('prettyDesc'), color: '#667eea' },
    { title: t('hotMode'), description: t('hotDesc'), color: '#f093fb' },
    { title: t('photoshoot'), description: t('photoshootDesc'), color: '#764ba2' },
  ];

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((s) => (s + 1) % examples.length), 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const currentUser = authUser || session?.user || null;
      setUser(currentUser);
      const userId = authUser?.id || session?.user?.id;
      if (userId) {
        const { data } = await supabase.from('users').select('*').eq('id', userId).single();
        if (data) setUserData(data as UserData);
      }
    };
    checkAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => authListener?.subscription.unsubscribe();
  }, []);

  const glassStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.5))',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  const nextSlide = () => { setFadeIn(false); setTimeout(() => { setCurrentSlide((s) => (s + 1) % examples.length); setFadeIn(true); }, 300); };
  const prevSlide = () => { setFadeIn(false); setTimeout(() => { setCurrentSlide((s) => (s - 1 + examples.length) % examples.length); setFadeIn(true); }, 300); };
  const goToSlide = (i: number) => { if (i !== currentSlide) { setFadeIn(false); setTimeout(() => { setCurrentSlide(i); setFadeIn(true); }, 300); } };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E8D5F2 75%, #E0E8FF 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', width: 600, height: 600, background: 'radial-gradient(circle, #FFB3BA 0%, #FFDFBA 100%)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.4, top: -150, left: -150, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 500, height: 500, background: 'radial-gradient(circle, #BAE1FF 0%, #BAFFC9 100%)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.4, bottom: -100, right: -100, pointerEvents: 'none', zIndex: 0 }} />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontSize: 56, fontWeight: 700, color: '#1A1A1A', textAlign: 'center', marginBottom: 16, letterSpacing: '-1px' }}>{t('title')}</h1>
        <p style={{ fontSize: 18, color: '#4A4A4A', textAlign: 'center', marginBottom: 60 }}>{t('subtitle')}</p>

        <div style={{ ...glassStyle, maxWidth: 900, margin: '0 auto 60px auto', borderRadius: 24, padding: 40, position: 'relative' }}>
          <button onClick={prevSlide} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#C2185B', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.3s ease', zIndex: 10 }}>←</button>
          <button onClick={nextSlide} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#C2185B', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'all 0.3s ease', zIndex: 10 }}>→</button>

          <div style={{ textAlign: 'center', marginBottom: 32, opacity: fadeIn ? 1 : 0, transform: fadeIn ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.3s ease' }}>
            <h3 style={{ fontSize: 32, fontWeight: 700, color: examples[currentSlide].color, marginBottom: 12 }}>{examples[currentSlide].title}</h3>
            <p style={{ fontSize: 16, color: '#666' }}>{examples[currentSlide].description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 60, opacity: fadeIn ? 1 : 0, transform: fadeIn ? 'scale(1)' : 'scale(0.95)', transition: 'all 0.3s ease' }}>
            <div style={{ ...glassStyle, background: `linear-gradient(135deg, ${examples[currentSlide].color}33, ${examples[currentSlide].color}11)`, borderRadius: 16, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, minHeight: 300 }}>📷</div>
            <div style={{ ...glassStyle, background: `linear-gradient(135deg, ${examples[currentSlide].color}66, ${examples[currentSlide].color}33)`, borderRadius: 16, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, minHeight: 300 }}>✨</div>
          </div>

          <div className="carousel-dots">
            {examples.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>

        <div style={{ ...glassStyle, textAlign: 'center', maxWidth: 720, margin: '20px auto', padding: 32, borderRadius: 16 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A', marginBottom: 16 }}>{t('readyTitle')}</h2>
          <p style={{ fontSize: 16, color: '#666', marginBottom: 32 }}>{t('readyDesc')}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button onClick={() => router.push('/photoshoot')} className="btn btn-primary liquid-glass-btn-dark">{t('tryPrettyHot')}</button>
            <button onClick={() => router.push('/photoshoot')} className="btn btn-secondary liquid-glass-btn">{t('tryPhotoshoot')}</button>
          </div>
        </div>
      </main>
    </div>
  );
}

