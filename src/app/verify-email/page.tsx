'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ShieldCheck,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function maskEmail(emailStr: string): string {
  if (!emailStr || !emailStr.includes('@')) return emailStr;
  const [local, domain] = emailStr.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const maskedLocal = `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status'); // 'success' | 'failed' | null
  const reason = searchParams.get('reason') || '';
  const emailParam = searchParams.get('email') || '';

  const [inputEmail, setInputEmail] = useState(emailParam);
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = (inputEmail || emailParam).trim();
    if (!targetEmail || !canResend || resending) return;

    setResending(true);
    setResendMsg(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setResendMsg({
        type: 'success',
        text: 'A fresh verification link has been sent to your email inbox.',
      });
      setCanResend(false);
      setCooldown(60);
    } catch (err: any) {
      setResendMsg({
        type: 'error',
        text: err.message || 'Failed to resend verification link. Please check the email and try again.',
      });
    } finally {
      setResending(false);
    }
  };

  // -------------------------------------------------------------
  // STATE 1: EMAIL VERIFIED SUCCESSFULLY
  // -------------------------------------------------------------
  if (status === 'success') {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200/90 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20 ring-4 ring-teal-50">
          <CheckCircle2 className="w-9 h-9 text-[#0D9488]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#102A43] tracking-tight">
            Email Verified Successfully!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Your CampusFix account has been verified. You can now log in to your account.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <span>Go to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>CampusFix Identity Verified & Activated</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: EMAIL VERIFICATION FAILED / EXPIRED / INVALID
  // -------------------------------------------------------------
  if (status === 'failed') {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200/90 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10 ring-4 ring-rose-50">
          <XCircle className="w-9 h-9 text-rose-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#102A43] tracking-tight">
            Email Verification Failed
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {reason
              ? `Verification error: ${reason}`
              : 'The verification link may have expired or is invalid. Please request a new verification email below.'}
          </p>
        </div>

        {/* Resend input if user needs to supply email */}
        <form onSubmit={handleResend} className="space-y-3 text-left">
          <label className="block text-xs font-bold text-slate-700">
            University Email Address
          </label>
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="student@university.edu"
            required
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          {resendMsg && (
            <div
              className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
                resendMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {resendMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{resendMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!inputEmail.trim() || !canResend || resending}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            {canResend
              ? 'Resend Verification Email'
              : `Resend Available in ${cooldown}s`}
          </button>
        </form>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#102A43] py-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: PENDING VERIFICATION (SHOWN RIGHT AFTER REGISTRATION)
  // -------------------------------------------------------------
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200/90 text-center space-y-6 animate-in fade-in">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto shadow-md shadow-teal-500/10 ring-4 ring-teal-50">
        <Mail className="w-8 h-8 animate-pulse text-[#0D9488]" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-[#102A43] tracking-tight">
          Registration Successful!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          We&apos;ve sent a verification link to your email address. Please verify your email before logging in.
        </p>
      </div>

      {emailParam && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 break-all">
          {maskEmail(emailParam)}
        </div>
      )}

      {/* Messages */}
      {resendMsg && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-xs text-left ${
            resendMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {resendMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{resendMsg.text}</span>
        </div>
      )}

      {/* Resend Action */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => handleResend()}
          disabled={!canResend || resending}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-xs hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
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

      <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
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
        <span>← Back to CampusFix Home</span>
      </Link>

      <Suspense fallback={<div className="text-center text-xs text-slate-600">Loading verification details...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
