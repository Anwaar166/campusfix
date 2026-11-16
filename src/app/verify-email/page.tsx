'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Wrench, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || !canResend || loading) return;
    setLoading(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMsg({
        type: 'success',
        text: 'A fresh verification link has been sent to your email inbox.',
      });
      setCanResend(false);
      setCooldown(60);
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.message || 'Failed to resend verification email. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/90 text-center space-y-6">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto shadow-md shadow-teal-500/10 ring-4 ring-teal-50">
        <Mail className="w-8 h-8 animate-pulse" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-[#102A43] tracking-tight">
          Verify Your Email Address
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We’ve sent a verification link to your email. Please check your inbox and verify your account before logging in.
        </p>
      </div>

      {email && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 break-all">
          {email}
        </div>
      )}

      {/* Messages */}
      {msg && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-xs text-left ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Resend Action */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {canResend
            ? 'Resend Verification Email'
            : `Resend Available in ${cooldown}s`}
        </button>

        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#102A43] py-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-600">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>CampusFix Identity Protection</span>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <Link
        href="/"
        className="inline-flex items-center gap-2 mb-8 text-xs font-bold text-slate-600 hover:text-[#102A43] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>← Back to Home</span>
      </Link>

      <Suspense fallback={<div className="text-center text-xs text-slate-600">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
