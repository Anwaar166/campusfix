'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 240) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
      <button
        onClick={scrollToTop}
        type="button"
        aria-label="Scroll back to top"
        className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-indigo-600 text-white text-xs font-semibold shadow-xl shadow-slate-900/20 hover:shadow-indigo-500/30 backdrop-blur-md border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-colors">
          <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
        </div>
        <span>Back to Top</span>
      </button>
    </div>
  );
}
