'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ru',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguageState(savedLang);
    } else {
      // Определяем язык браузера
      const browserLang = navigator.language.split('-')[0] as Language;
      const supportedLangs = ['en', 'ru', 'fr', 'de', 'it', 'es', 'pt', 'pl', 'nl', 'tr'];
      if (supportedLangs.includes(browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  
  const [translations, setTranslations] = useState<any>({});
  
  useEffect(() => {
    // Динамический импорт переводов
    try {
      const { getTranslation } = require('@/lib/translations');
      setTranslations({ getTranslation });
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }, []);
  
  const t = (key: string, params?: Record<string, any>) => {
    if (translations.getTranslation) {
      const [section, ...keyParts] = key.split('.');
      const translationKey = keyParts.join('.');
      let text = translations.getTranslation(context.language, section, translationKey);
      
      // Заменяем параметры вида {{param}} на значения
      if (params) {
        Object.keys(params).forEach(param => {
          text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        });
      }
      
      return text;
    }
    return key;
  };

  return { ...context, t };
}

export function useTranslation(section: string) {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<any>({});
  
  useEffect(() => {
    // Динамический импорт переводов
    try {
      const { getTranslation } = require('@/lib/translations');
      setTranslations({ getTranslation });
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }, []);
  
  const t = (key: string) => {
    if (translations.getTranslation) {
      return translations.getTranslation(language, section, key);
    }
    return key;
  };

  return { t, language };
}
