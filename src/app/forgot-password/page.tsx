import React, { Suspense } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { Wrench, KeyRound, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-slate-900 via-indigo-950 to-slate-900 text-slate-100 overflow-hidden">
      {/* Decorative gradient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-6 transition-transform hover:scale-105 duration-200">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-2 ring-white/20 group-hover:shadow-indigo-500/50 transition-all">
            <Wrench className="w-6 h-6 transition-transform group-hover:rotate-12" />
          </div>
          <span className="font-extrabold text-3xl tracking-tight text-white drop-shadow-sm">
            Campus<span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-violet-400">Fix</span>
          </span>
        </Link>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3 backdrop-blur-md">
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>Account Recovery</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Reset Your Password
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-sm mx-auto">
          Enter your registered university email to receive secure recovery instructions.
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white/95 backdrop-blur-xl text-slate-900 py-8 px-6 sm:px-10 shadow-2xl shadow-indigo-950/40 border border-white/40 rounded-3xl ring-1 ring-slate-900/5">
          <Suspense fallback={<div className="text-center py-12 text-sm text-slate-400">Loading form...</div>}>
            <AuthForm mode="forgot-password" />
          </Suspense>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Encrypted Supabase Magic Link
          </span>
        </div>
      </div>
    </div>
  );
}
