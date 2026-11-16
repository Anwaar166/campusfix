'use client';

import React, { useState, useEffect } from 'react';
import {
  Eye,
  X,
  Type,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';

export interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'xlarge';
  contrast: 'normal' | 'high';
  theme: 'light' | 'dark';
  fontFamily: 'default' | 'readable';
  screenReaderActive: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'normal',
  contrast: 'normal',
  theme: 'light',
  fontFamily: 'default',
  screenReaderActive: false,
};

export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isReadingSelection, setIsReadingSelection] = useState(false);

  // Load saved accessibility preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('campusfix_a11y');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettingsToDOM(parsed);
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings:', e);
    }
  }, []);

  // Keyboard shortcut: Escape closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const applySettingsToDOM = (cfg: AccessibilitySettings) => {
    const root = document.documentElement;

    // 1. Font Size
    root.classList.remove('text-size-normal', 'text-size-large', 'text-size-xlarge');
    if (cfg.fontSize === 'large') {
      root.style.fontSize = '115%';
    } else if (cfg.fontSize === 'xlarge') {
      root.style.fontSize = '130%';
    } else {
      root.style.fontSize = '100%';
    }

    // 2. High Contrast
    if (cfg.contrast === 'high') {
      root.setAttribute('data-contrast', 'high');
      root.classList.add('high-contrast');
    } else {
      root.removeAttribute('data-contrast');
      root.classList.remove('high-contrast');
    }

    // 3. Theme (Dark / Light)
    if (cfg.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 4. Dyslexia / Easy-to-read font
    if (cfg.fontFamily === 'readable') {
      root.setAttribute('data-font', 'readable');
    } else {
      root.removeAttribute('data-font');
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    applySettingsToDOM(next);
    try {
      localStorage.setItem('campusfix_a11y', JSON.stringify(next));
    } catch {}
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    applySettingsToDOM(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem('campusfix_a11y');
    } catch {}
  };

  // Read selected text aloud using browser SpeechSynthesis
  const readSelectedText = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isReadingSelection) {
      window.speechSynthesis.cancel();
      setIsReadingSelection(false);
      return;
    }

    const selectedText = window.getSelection()?.toString().trim();
    const textToRead =
      selectedText ||
      'No text currently highlighted. Please highlight any paragraph or issue description on screen, then click Read Aloud to listen.';

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'en-US';
    utterance.onend = () => setIsReadingSelection(false);
    utterance.onerror = () => setIsReadingSelection(false);

    setIsReadingSelection(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Floating Accessibility Trigger Button (Bottom-Left) */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Accessibility Options"
        title="Accessibility Settings (Font size, contrast, reading aloud)"
        className="fixed bottom-6 left-6 z-40 bg-white/95 backdrop-blur text-slate-700 hover:text-[#0D9488] p-3 rounded-full shadow-lg border border-slate-200/90 hover:shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 group"
      >
        <Eye className="w-5 h-5 text-[#0D9488]" />
        <span className="hidden md:inline text-xs font-bold pr-1 text-slate-800 group-hover:text-[#0D9488]">
          Accessibility
        </span>
      </button>

      {/* Accessibility Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-title"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#102A43] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0D9488] flex items-center justify-center text-white">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="a11y-title" className="font-bold text-base leading-tight">
                    Accessibility & Display
                  </h2>
                  <p className="text-[11px] text-teal-200">
                    Customize your visual and reading preferences
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close accessibility settings"
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Controls */}
            <div className="p-5 space-y-5 text-slate-800 text-xs sm:text-sm">
              {/* 1. Font Size Control */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-teal-600" />
                  Text Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: 'Default (100%)' },
                    { id: 'large', label: 'Large (115%)' },
                    { id: 'xlarge', label: 'Extra (130%)' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateSetting('fontSize', item.id as any)}
                      className={`py-2 px-2.5 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        settings.fontSize === item.id
                          ? 'border-[#0D9488] bg-teal-50 text-[#0D9488] ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Contrast Control */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Color Contrast
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSetting('contrast', 'normal')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                      settings.contrast === 'normal'
                        ? 'border-[#0D9488] bg-teal-50 text-[#0D9488] ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Normal Contrast
                  </button>
                  <button
                    onClick={() => updateSetting('contrast', 'high')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                      settings.contrast === 'high'
                        ? 'border-[#102A43] bg-slate-900 text-white font-bold ring-2 ring-slate-900/30'
                        : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    High Contrast
                  </button>
                </div>
              </div>

              {/* 3. Appearance (Light / Dark) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Appearance Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSetting('theme', 'light')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settings.theme === 'light'
                        ? 'border-[#0D9488] bg-teal-50 text-[#0D9488] ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Light Mode
                  </button>
                  <button
                    onClick={() => updateSetting('theme', 'dark')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settings.theme === 'dark'
                        ? 'border-[#102A43] bg-slate-900 text-white ring-2 ring-slate-900/30'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Dark Mode
                  </button>
                </div>
              </div>

              {/* 4. Reading Assistance: Read Highlighted Content Aloud */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    Read Page Content Aloud
                  </span>
                  {isReadingSelection && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                      Playing Speech
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Highlight any text or issue description on screen, then click the button below to listen with natural text-to-speech.
                </p>
                <button
                  type="button"
                  onClick={readSelectedText}
                  className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isReadingSelection
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isReadingSelection ? (
                    <>
                      <VolumeX className="w-4 h-4" /> Stop Reading
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" /> Read Highlighted Text
                    </>
                  )}
                </button>
              </div>

              {/* Reset to Defaults */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <button
                  onClick={resetSettings}
                  className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-[#102A43] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
