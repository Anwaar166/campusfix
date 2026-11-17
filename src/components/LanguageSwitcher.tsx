'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'compact' | 'dropdown';
}

export function LanguageSwitcher({ className = '', variant = 'pill' }: LanguageSwitcherProps) {
  const { language, setLanguage, isRTL } = useTranslation();

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-1 shadow-sm backdrop-blur-sm ${className}`}
      dir="ltr"
    >
      <div className="flex items-center px-1.5 text-slate-400">
        <Globe className="w-3.5 h-3.5 text-teal-600" />
      </div>

      <div className="flex items-center gap-0.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          aria-label="Switch to English"
          className={`px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
            language === 'en'
              ? 'bg-[#102A43] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          English
        </button>

        <span className="text-slate-300 dark:text-slate-700 select-none">|</span>

        <button
          type="button"
          onClick={() => setLanguage('ur')}
          aria-label="اردو میں تبدیل کریں"
          className={`px-2 py-1 rounded-lg transition-all duration-200 font-serif cursor-pointer ${
            language === 'ur'
              ? 'bg-[#0D9488] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          اردو
        </button>
      </div>
    </div>
  );
}
