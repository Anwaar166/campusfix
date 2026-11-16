'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Pause, Play, Square, Sparkles, AlertCircle } from 'lucide-react';

export function ReadAloudButton() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check selection whenever user highlights text
  useEffect(() => {
    const handleSelectionChange = () => {
      if (typeof window === 'undefined') return;
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      setHasSelection(Boolean(text && text.length > 0));
    };

    const handleHeaderTrigger = () => {
      startReading();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('campusfix:read-aloud', handleHeaderTrigger);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('campusfix:read-aloud', handleHeaderTrigger);
      stopReading();
    };
  }, []);

  const showNotification = (msg: string) => {
    setTooltip(msg);
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip(null);
    }, 3500);
  };

  const getCleanSelectedText = (): string | null => {
    if (typeof window === 'undefined') return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parentEl = container.nodeType === Node.ELEMENT_NODE
      ? (container as HTMLElement)
      : container.parentElement;

    // Security check: Ignore password fields or explicitly hidden/sensitive content
    if (parentEl) {
      if (
        parentEl.tagName === 'INPUT' &&
        (parentEl as HTMLInputElement).type === 'password'
      ) {
        return null;
      }
      if (
        parentEl.getAttribute('aria-hidden') === 'true' ||
        parentEl.getAttribute('data-sensitive') === 'true' ||
        parentEl.closest('input[type="password"]')
      ) {
        return null;
      }
    }

    const rawText = selection.toString().trim();
    return rawText.length > 0 ? rawText : null;
  };

  const startReading = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showNotification('Speech synthesis is not supported on this browser.');
      return;
    }

    const textToRead = getCleanSelectedText();

    if (!textToRead) {
      showNotification('Please highlight any text on the page first.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseReading = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeReading = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopReading = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    utteranceRef.current = null;
  };

  return (
    <>
      {/* Floating Read Aloud Control (Positioned safely above Accessibility, never overlapping Logout) */}
      <div className="fixed bottom-20 left-4 sm:left-6 lg:left-72 z-30 transition-all duration-300 font-sans print:hidden">
        {/* Tooltip Notification */}
        {tooltip && (
          <div className="absolute bottom-full left-0 mb-2 w-64 p-2.5 rounded-xl bg-slate-900/95 text-white text-xs shadow-xl border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{tooltip}</span>
            </div>
          </div>
        )}

        {/* Control Button / Playing Toolbar */}
        {!isPlaying ? (
          <button
            onClick={startReading}
            type="button"
            aria-label="Read highlighted text aloud"
            title="Highlight any text on the page and click to read aloud"
            className={`group flex items-center gap-2 px-3 py-2.5 sm:px-3.5 sm:py-2.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
              hasSelection
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/50 shadow-indigo-500/30 animate-pulse'
                : 'bg-white/95 text-slate-700 hover:text-indigo-600 border-slate-200/90 shadow-slate-900/10'
            }`}
          >
            <Volume2
              className={`w-4 h-4 ${
                hasSelection ? 'text-white' : 'text-indigo-600 group-hover:scale-110'
              } transition-transform`}
            />
            <span className="hidden sm:inline">
              {hasSelection ? 'Read Selection' : 'Read Text'}
            </span>
            {hasSelection && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        ) : (
          /* Active Playing Controls with Play/Pause & Stop */
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/95 text-white rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isPaused ? 'Paused' : 'Reading'}</span>
            </div>

            {/* Pause / Resume button */}
            <button
              onClick={isPaused ? resumeReading : pauseReading}
              type="button"
              aria-label={isPaused ? 'Resume reading' : 'Pause reading'}
              title={isPaused ? 'Resume reading' : 'Pause reading'}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            {/* Stop button */}
            <button
              onClick={stopReading}
              type="button"
              aria-label="Stop reading"
              title="Stop speech"
              className="p-1.5 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
            >
              <Square className="w-3 h-3 fill-white" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
