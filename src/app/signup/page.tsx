import React, { Suspense } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { Wrench, ArrowLeft, ShieldCheck, GraduationCap, School, CheckCircle2, Sparkles } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-[#F8FAFC] flex flex-col justify-between overflow-y-auto lg:overflow-hidden">
      {/* Top Header Bar with prominent Back to Home */}
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
          <span>Campus Identity Enrollment</span>
        </div>
      </header>

      {/* Main 2-Column Content (Fits cleanly in Desktop Viewport) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Left Column: Branded SaaS Information Panel */}
          <div className="lg:col-span-5 bg-[#102A43] text-white p-6 sm:p-8 flex flex-col justify-between self-stretch relative overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-2xl tracking-tight text-white">
                    Campus<span className="text-[#0D9488]">Fix</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 -mt-1">
                    Student & Faculty Hub
                  </span>
                </div>
              </Link>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  Join the Campus Maintenance Community
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Create your university account to report maintenance issues in seconds, receive resolution alerts, and vote on community priorities.
                </p>
              </div>

              {/* Roles allowed */}
              <div className="space-y-2.5 pt-1">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="text-[11px]">
                    <strong className="block text-white font-bold">Student Accounts</strong>
                    <span className="text-slate-400">Report dorm, classroom, and library repairs.</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">
                    <School className="w-4 h-4" />
                  </div>
                  <div className="text-[11px]">
                    <strong className="block text-white font-bold">Faculty Accounts</strong>
                    <span className="text-slate-400">Urgent reporting for research labs & lecture halls.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-950/60 border border-teal-800/60 text-xs text-teal-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Administrative Notice</span>
                </div>
                <p className="text-[10px] text-teal-300 leading-normal">
                  Administrator privileges are granted exclusively by campus facilities managers and cannot be self-registered.
                </p>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="relative z-10 pt-4 mt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Email Verification Active
              </span>
              <span className="font-mono text-teal-300 font-bold">RLS Guarded</span>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-7 p-6 sm:p-8">
            <div className="mb-3">
              <h1 className="text-xl sm:text-2xl font-black text-[#102A43] tracking-tight">
                Create Campus Account
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Select Student or Faculty to register your verified account.
              </p>
            </div>

            <Suspense fallback={<div className="text-center py-8 text-xs text-slate-400">Loading form...</div>}>
              <AuthForm mode="signup" />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="px-4 py-2.5 text-center text-[11px] text-slate-500 border-t border-slate-200/80 bg-white/60 shrink-0">
        © {new Date().getFullYear()} CampusFix • Smart Campus Maintenance & Work Order Management
      </footer>
    </div>
  );
}
