'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Shield, RefreshCw } from 'lucide-react';

export interface GoogleRecaptchaRef {
  reset: () => void;
  getResponse: () => string;
}

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err?: any) => void;
  theme?: 'light' | 'dark';
  className?: string;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready?: (callback: () => void) => void;
      render?: (
        container: HTMLElement | string,
        parameters: {
          sitekey: string;
          theme?: 'light' | 'dark';
          size?: 'normal' | 'compact';
          tabindex?: number;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (err?: any) => void;
        }
      ) => number;
      reset?: (widgetId?: number) => void;
      getResponse?: (widgetId?: number) => string;
    };
    onGoogleRecaptchaLoad?: () => void;
  }
}

export const GoogleRecaptcha = forwardRef<GoogleRecaptchaRef, Props>(
  ({ onVerify, onExpire, onError, theme = 'light', className = '' }, ref) => {
    const { language } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const siteKey =
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LebCSUuAAAAAOPk_wtNSFZXvSxqpznp8tyAS9z3';

    // Expose reset and getResponse methods to parent forms
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current !== null && typeof window !== 'undefined' && window.grecaptcha?.reset) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (e) {
            console.warn('Error resetting Google reCAPTCHA:', e);
          }
        }
      },
      getResponse: () => {
        if (widgetIdRef.current !== null && typeof window !== 'undefined' && window.grecaptcha?.getResponse) {
          try {
            return window.grecaptcha.getResponse(widgetIdRef.current);
          } catch {
            return '';
          }
        }
        return '';
      },
    }));

    useEffect(() => {
      let isMounted = true;

      const renderWidget = () => {
        if (!isMounted || !containerRef.current || !window.grecaptcha?.render || widgetIdRef.current !== null) {
          return;
        }

        try {
          // Empty container before rendering
          containerRef.current.innerHTML = '';

          const id = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            callback: (token: string) => {
              if (isMounted) {
                setHasError(false);
                onVerify(token);
              }
            },
            'expired-callback': () => {
              if (isMounted) {
                onExpire?.();
              }
            },
            'error-callback': (err: any) => {
              console.warn('Google reCAPTCHA notification:', err);
              if (isMounted) {
                setHasError(true);
                onError?.(err);
              }
            },
          });

          widgetIdRef.current = id;
          setIsLoaded(true);
        } catch (err) {
          console.warn('Error rendering Google reCAPTCHA:', err);
          if (isMounted) {
            setHasError(true);
          }
        }
      };

      if (typeof window !== 'undefined') {
        const scriptId = 'google-recaptcha-v2-script';
        const langParam = language === 'ur' ? 'ur' : 'en';

        // Check if script already exists
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;

        window.onGoogleRecaptchaLoad = () => {
          if (isMounted && typeof window.grecaptcha?.ready === 'function') {
            window.grecaptcha.ready(renderWidget);
          }
        };

        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://www.google.com/recaptcha/api.js?onload=onGoogleRecaptchaLoad&render=explicit&hl=${langParam}`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        } else if (typeof window.grecaptcha?.render === 'function' && typeof window.grecaptcha?.ready === 'function') {
          window.grecaptcha.ready(renderWidget);
        } else {
          // If script tag exists but grecaptcha not yet ready, poll briefly
          const interval = setInterval(() => {
            if (typeof window.grecaptcha?.render === 'function' && typeof window.grecaptcha?.ready === 'function' && containerRef.current) {
              clearInterval(interval);
              window.grecaptcha.ready(renderWidget);
            }
          }, 100);

          return () => {
            isMounted = false;
            clearInterval(interval);
          };
        }
      }

      return () => {
        isMounted = false;
      };
    }, [siteKey, theme, language, onVerify, onExpire, onError]);

    return (
      <div className={`my-3 select-none flex flex-col items-center justify-center ${className}`}>
        {/* Loading skeleton placeholder before reCAPTCHA iframe appears */}
        {!isLoaded && !hasError && (
          <div className="w-[304px] h-[78px] rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-xs text-slate-400 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0D9488]" />
            <span>{language === 'ur' ? 'گوگل کیپچا لوڈ ہو رہا ہے...' : 'Loading Google reCAPTCHA...'}</span>
          </div>
        )}

        {/* Google reCAPTCHA Container */}
        <div
          ref={containerRef}
          className={`flex items-center justify-center transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
          }`}
          style={{ minHeight: isLoaded ? '78px' : '0' }}
        />

        {/* Security badge note */}
        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400">
          <Shield className="w-3 h-3 text-[#0D9488]" />
          <span>
            {language === 'ur'
              ? 'گوگل سیکیورٹی اور کیپچا سے محفوظ'
              : 'Protected by Google reCAPTCHA'}
          </span>
        </div>
      </div>
    );
  }
);

GoogleRecaptcha.displayName = 'GoogleRecaptcha';
