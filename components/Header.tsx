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
  const isAuthPage = pathname === '/auth';

  useEffect(() => {
    setMounted(true);
    
    // Один раз проверяем сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
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
      padding: '16px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 9999,
      position: 'sticky',
      top: '0',
      maxWidth: '1200px',
      margin: '0 auto',
      borderRadius: '16px',
      background: 'transparent',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#1A1A1A',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>BEAUTIFY.AI</div>
      </Link>

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
                }}>Регистрация</button>
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
                }}>Войти</button>
              </a>
            </>
          )
        )}
      </div>
    </header>
  );
}

