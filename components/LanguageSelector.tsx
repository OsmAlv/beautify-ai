'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { languages, Language } from '@/lib/translations';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="liquid-glass-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
        }}
      >
        <img 
          src={`https://flagcdn.com/w20/${languages[language].flag}.png`}
          srcSet={`https://flagcdn.com/w40/${languages[language].flag}.png 2x`}
          width="20"
          height="15"
          alt={languages[language].name}
          style={{ 
            objectFit: 'cover',
            borderRadius: '2px',
            display: 'block',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span>{languages[language].name}</span>
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            minWidth: '180px',
            zIndex: 10000,
          }}
        >
          {Object.entries(languages).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => {
                setLanguage(code as Language);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                background: language === code ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: language === code ? '600' : '400',
                color: '#1A1A1A',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (language !== code) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (language !== code) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <img 
                src={`https://flagcdn.com/w20/${lang.flag}.png`}
                srcSet={`https://flagcdn.com/w40/${lang.flag}.png 2x`}
                width="20"
                height="15"
                alt={lang.name}
                style={{ 
                  objectFit: 'cover',
                  borderRadius: '2px',
                  display: 'block',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}
