'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err?: any) => void;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          theme?: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (err: any) => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, Props>(
  ({ onVerify, onExpire, onError, theme = 'light', className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error'>('loading');

    const siteKey =
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.reset(widgetIdRef.current);
            setStatus('ready');
          } catch (e) {
            console.warn('Failed to reset Turnstile:', e);
          }
        }
      },
    }));

    useEffect(() => {
      let isMounted = true;

      const renderWidget = () => {
        if (
          !isMounted ||
          !containerRef.current ||
          !window.turnstile ||
          widgetIdRef.current !== null
        ) {
          return;
        }

        try {
          // Clear any children in container
          containerRef.current.innerHTML = '';

          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            callback: (token: string) => {
              if (isMounted) {
                setStatus('verified');
                onVerify(token);
              }
            },
            'expired-callback': () => {
              if (isMounted) {
                setStatus('ready');
                onExpire?.();
              }
            },
            'error-callback': (err: any) => {
              console.warn('Turnstile error:', err);
              if (isMounted) {
                setStatus('error');
                onError?.(err);
              }
            },
          });

          widgetIdRef.current = id;
          setStatus('ready');
          setIsLoaded(true);
        } catch (err) {
          console.error('Failed to render Turnstile:', err);
          if (isMounted) setStatus('error');
        }
      };

      // Check if script is already injected
      if (typeof window !== 'undefined') {
        if (window.turnstile) {
          renderWidget();
        } else {
          const scriptId = 'cloudflare-turnstile-script';
          let script = document.getElementById(scriptId) as HTMLScriptElement | null;

          if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
          }

          const checkInterval = setInterval(() => {
            if (window.turnstile && containerRef.current) {
              clearInterval(checkInterval);
              renderWidget();
            }
          }, 100);

          return () => {
            isMounted = false;
            clearInterval(checkInterval);
            if (widgetIdRef.current && window.turnstile) {
              try {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
              } catch {}
            }
          };
        }
      }

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
          } catch {}
        }
      };
    }, [siteKey, theme, onVerify, onExpire, onError]);

    return (
      <div className={`my-3 flex flex-col items-center justify-center ${className}`}>
        {/* Cloudflare Widget Container */}
        <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />

        {/* Loading placeholder before script loads */}
        {status === 'loading' && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
            <span>Verifying human identity security...</span>
          </div>
        )}

        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Protected by Cloudflare Turnstile & CampusFix Guard</span>
        </div>
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';
