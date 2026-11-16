import React, { Suspense } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { Wrench, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-[#F8FAFC] flex flex-col justify-between overflow-y-auto lg:overflow-hidden">
      {/* Top Header Bar */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-200/90 bg-white/80 backdrop-blur-md shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#0D9488] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Home</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
          <span>Campus Identity Recovery</span>
        </div>
      </header>

      {/* Main 2-Column Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Left Column */}
          <div className="lg:col-span-5 bg-[#102A43] text-white p-6 sm:p-8 flex flex-col justify-between self-stretch relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-2xl text-white">
                  Campus<span className="text-[#0D9488]">Fix</span>
                </span>
              </Link>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">
                  Account Recovery
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your university email address and we will dispatch a secure password reset link to your official inbox.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                Reset links expire in 60 minutes for security compliance.
              </div>
            </div>

            <div className="relative z-10 pt-4 mt-6 border-t border-slate-800 text-[11px] text-slate-400">
              Campus Security Gateway
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7 p-6 sm:p-8">
            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl font-black text-[#102A43] tracking-tight">
                Reset Your Password
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                We'll email you a secure link to choose a new password.
              </p>
            </div>

            <Suspense fallback={<div className="text-center py-8 text-xs text-slate-400">Loading form...</div>}>
              <AuthForm mode="forgot-password" />
            </Suspense>
          </div>
        </div>
      </main>

      <footer className="px-4 py-2.5 text-center text-[11px] text-slate-500 border-t border-slate-200/80 bg-white/60 shrink-0">
        © {new Date().getFullYear()} CampusFix • Smart Campus Maintenance
      </footer>
    </div>
  );
}
