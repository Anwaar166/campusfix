'use client';

import React from 'react';
import { useTranslation, Language } from '@/lib/i18n/LanguageContext';
import { Wrench, Check, Globe, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export function LanguageSelectionModal() {
  const { showWelcomeModal, setLanguage, language } = useTranslation();

  if (!showWelcomeModal) return null;

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transform transition-all duration-300 zoom-in-95">
        {/* Top Decorative Gradient Banner */}
        <div className="h-3 bg-gradient-to-r from-[#102A43] via-[#0D9488] to-teal-400" />

        <div className="p-6 sm:p-10">
          {/* Brand & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#102A43] to-[#0D9488] flex items-center justify-center text-white shadow-xl shadow-teal-500/20 mb-4 animate-bounce [animation-duration:3s]">
              <Wrench className="w-8 h-8 text-teal-300" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Campus Maintenance Portal</span>
            </div>

            {/* Bilingual Headings as explicitly requested */}
            <h1 className="text-2xl sm:text-3xl font-black text-[#102A43] dark:text-white tracking-tight">
              Welcome to CampusFix
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1 font-serif">
              کیمپس فکس میں خوش آمدید
            </h2>

            {/* Bilingual Subtitles */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2">
              Choose your preferred language to continue.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              جاری رکھنے کے لیے اپنی پسندیدہ زبان منتخب کریں۔
            </p>
          </div>

          {/* Language Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* OPTION 1: ENGLISH */}
            <button
              type="button"
              onClick={() => handleSelect('en')}
              className="group relative flex flex-col items-start p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-white dark:hover:bg-slate-800/90 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 text-left cursor-pointer active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-6 h-6" />
              </div>

              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xl font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  English
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  LTR
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Standard left-to-right interface for English users.
              </p>

              <div className="mt-auto w-full inline-flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-teal-700 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                <span>Continue in English</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </button>

            {/* OPTION 2: URDU (اردو) */}
            <button
              type="button"
              onClick={() => handleSelect('ur')}
              className="group relative flex flex-col items-end p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-white dark:hover:bg-slate-800/90 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 text-right cursor-pointer active:scale-[0.98]"
              dir="rtl"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-lg font-black font-serif">اردو</span>
              </div>

              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  اردو
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  RTL
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                مکمل دائیں سے بائیں اردو رسم الخط اور کیمپس سہولیات۔
              </p>

              <div className="mt-auto w-full inline-flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-teal-700 dark:text-teal-400 group-hover:-translate-x-0.5 transition-transform">
                <span>اردو میں جاری رکھیں</span>
                <ArrowLeft className="w-4 h-4 mr-1" />
              </div>
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
            You can change your language anytime using the language toggle in the header.
            <br />
            آپ ہیڈر میں موجود زبان کے بٹن سے کسی بھی وقت زبان تبدیل کر سکتے ہیں۔
          </p>
        </div>
      </div>
    </div>
  );
}
