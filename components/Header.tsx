"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Header() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthPage = pathname === '/auth';

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Проверяем начальную сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Подписываемся на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      // Закрываем меню при выходе
      if (event === 'SIGNED_OUT') {
        setMenuOpen(false);
      }
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      subscription.unsubscribe();
    };
  }, []);

  if (!mounted) return null;

  const glassStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  return (
    <header style={{
      padding: isMobile ? '12px 20px' : '16px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 9999,
      position: 'sticky',
      top: '0',
      maxWidth: '1200px',
      margin: '0 auto',
      borderRadius: isMobile ? '12px' : '16px',
      background: 'transparent',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={{
          fontSize: isMobile ? '14px' : '20px',
          fontWeight: 700,
          color: '#1A1A1A',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          MAKEMEAPHOTO
        </div>
      </Link>

      {isMobile ? (
        <>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              ...glassStyle,
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: '#1A1A1A',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>

          {/* Mobile Menu Dropdown */}
          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '70px',
              right: '16px',
              ...glassStyle,
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: '200px',
            }}>
              <Link href="/pricing" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  color: '#1A1A1A',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.5)',
                }}>
                  {t('header.pricing')}
                </div>
              </Link>
              
              <div style={{ padding: '8px 12px' }}>
                <LanguageSelector />
              </div>

              {user ? (
                <Link href="/profile" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    color: '#1A1A1A',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.5)',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}>
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                      {user.email?.split('@')[0] || 'Профиль'}
                    </div>
                  </div>
                </Link>
              ) : (
                !isAuthPage && (
                  <>
                    <a href="/auth?mode=signup" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                      <button style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        color: '#1A1A1A',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}>{t('header.signup')}</button>
                    </a>
                    <a href="/auth" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                      <button style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        color: '#1A1A1A',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}>{t('header.login')}</button>
                    </a>
                  </>
                )
              )}
            </div>
          )}
        </>
      ) : (
        /* Desktop Menu */
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <div style={{
              ...glassStyle,
              padding: '8px 18px',
              borderRadius: '50px',
              color: '#1A1A1A',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}>
              {t('header.pricing')}
            </div>
          </Link>
          
          <LanguageSelector />

          {user ? (
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                ...glassStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                borderRadius: '50px',
                color: '#1A1A1A',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                }}>
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {user.email?.split('@')[0] || 'Профиль'}
                </div>
              </div>
            </Link>
          ) : (
            !isAuthPage && (
              <>
                <a href="/auth?mode=signup" style={{ textDecoration: 'none' }}>
                  <button style={{
                    ...glassStyle,
                    padding: '8px 18px',
                    borderRadius: '50px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    color: '#1A1A1A',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}>{t('header.signup')}</button>
                </a>
                <a href="/auth" style={{ textDecoration: 'none' }}>
                  <button style={{
                    ...glassStyle,
                    padding: '8px 18px',
                    borderRadius: '50px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    color: '#1A1A1A',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}>{t('header.login')}</button>
                </a>
              </>
            )
          )}
        </div>
      )}
    </header>
  );
}
