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
      {/* Toast Notification if no text selected */}
      {tooltip && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 p-3 rounded-2xl bg-slate-900/95 text-white text-xs shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-top-2 max-w-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{tooltip}</span>
          </div>
        </div>
      )}

      {/* Active Playing Controls with Play/Pause & Stop (Only visible when user starts reading) */}
      {isPlaying && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-slate-900/95 text-white rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isPaused ? 'Paused' : 'Reading Text'}</span>
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
            className="p-1.5 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3 fill-white" />
          </button>
        </div>
      )}
    </>
  );
}
