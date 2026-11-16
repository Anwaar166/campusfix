'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > 280) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-30 transition-all duration-300 animate-in fade-in zoom-in-95 print:hidden">
      <button
        onClick={scrollToTop}
        type="button"
        aria-label="Back to top"
        title="Scroll back to top"
        className="group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-slate-900/90 hover:bg-[#0D9488] text-white text-xs font-semibold shadow-xl shadow-slate-900/25 hover:shadow-teal-500/30 backdrop-blur-md border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 text-teal-300 group-hover:text-white" />
        <span className="hidden sm:inline">Back to Top</span>
      </button>
    </div>
  );
}
