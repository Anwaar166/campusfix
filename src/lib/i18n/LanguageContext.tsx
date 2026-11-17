'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enMessages from '@/messages/en.json';
import urMessages from '@/messages/ur.json';
import { createClient } from '@/lib/supabase/client';

export type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
}

const dictionaries: Record<Language, any> = {
  en: enMessages,
  ur: urMessages,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const COOKIE_NAME = 'campusfix_lang';
const STORAGE_KEY = 'campusfix_lang';
const MODAL_SHOWN_KEY = 'campusfix_lang_selected';

function getStoredLanguage(): Language | null {
  if (typeof window === 'undefined') return null;

  // 1. Check localStorage
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local === 'en' || local === 'ur') return local;
  } catch {
    // Ignore storage restrictions
  }

  // 2. Check Cookie
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + COOKIE_NAME + ')=([^;]*)'));
    if (match && (match[3] === 'en' || match[3] === 'ur')) {
      return match[3] as Language;
    }
  } catch {
    // Ignore cookie restrictions
  }

  return null;
}

function persistLanguage(lang: Language) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, lang);
    localStorage.setItem(MODAL_SHOWN_KEY, 'true');
  } catch {}

  try {
    const oneYear = 365 * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${oneYear}; SameSite=Lax`;
  } catch {}

  // Update HTML tag attributes
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';

  // Dispatch global event for non-react listeners
  window.dispatchEvent(new CustomEvent('campusfix:language-changed', { detail: { language: lang } }));
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const stored = getStoredLanguage();
    const hasExplicitSelection =
      typeof window !== 'undefined' &&
      (localStorage.getItem(MODAL_SHOWN_KEY) === 'true' || stored !== null);

    if (stored) {
      setLanguageState(stored);
      document.documentElement.lang = stored;
      document.documentElement.dir = stored === 'ur' ? 'rtl' : 'ltr';
    } else {
      // First-time visit: default to 'en', but trigger the first-time selection screen
      setLanguageState('en');
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }

    if (!hasExplicitSelection) {
      setShowWelcomeModal(true);
    }

    setIsInitialized(true);
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    persistLanguage(newLang);
    setShowWelcomeModal(false);

    // Sync to Supabase user profile if authenticated
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.auth.updateUser({
            data: { preferred_language: newLang },
          }).catch(() => {});
        }
      }).catch(() => {});
    } catch {}

    // Automatically reload the page so all server and client components fully change text
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  // Translation lookup supporting dot notation: t('nav.home')
  const t = useCallback(
    (path: string, fallback?: string): string => {
      const keys = path.split('.');
      const currentDict = dictionaries[language] || dictionaries.en;
      const fallbackDict = dictionaries.en;

      let value: any = currentDict;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }

      if (typeof value === 'string') return value;

      // Fallback to English dictionary
      let fallbackVal: any = fallbackDict;
      for (const k of keys) {
        if (fallbackVal && typeof fallbackVal === 'object' && k in fallbackDict) {
          fallbackVal = fallbackVal[k];
        } else {
          fallbackVal = undefined;
          break;
        }
      }

      if (typeof fallbackVal === 'string') return fallbackVal;

      return fallback || keys[keys.length - 1];
    },
    [language]
  );

  const dir: 'ltr' | 'rtl' = language === 'ur' ? 'rtl' : 'ltr';
  const isRTL = language === 'ur';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
        isRTL,
        showWelcomeModal,
        setShowWelcomeModal,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback outside provider
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (path: string, fallback?: string) => fallback || path.split('.').pop() || '',
      dir: 'ltr' as const,
      isRTL: false,
      showWelcomeModal: false,
      setShowWelcomeModal: () => {},
    };
  }
  return context;
}
