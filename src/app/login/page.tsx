import React, { Suspense } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { Wrench, ArrowLeft, ShieldCheck, CheckCircle2, ThumbsUp, Activity, Sparkles, Bot } from 'lucide-react';

export default function LoginPage() {
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
          <span>Encrypted University Session</span>
        </div>
      </header>

      {/* Main 2-Column Content (Fits cleanly in Desktop Viewport) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Left Column: Branded CampusFix SaaS Information Panel */}
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
                    Facilities Hub
                  </span>
                </div>
              </Link>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  Welcome to Your Campus Maintenance Portal
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Sign in to track reported repairs, upvote high-priority facility issues, or access the administration triage board.
                </p>
              </div>

              {/* Floating Feature Cards */}
              <div className="space-y-2.5 pt-1">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="text-[11px]">
                    <strong className="block text-white font-bold">Real-Time Ticket Progression</strong>
                    <span className="text-slate-400">Watch repairs move from Open to Resolved.</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                    <ThumbsUp className="w-4 h-4" />
                  </div>
                  <div className="text-[11px]">
                    <strong className="block text-white font-bold">Community Prioritization</strong>
                    <span className="text-slate-400">Upvote urgent lab and study room repairs.</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="text-[11px]">
                    <strong className="block text-white font-bold">CampusFix AI Assistant</strong>
                    <span className="text-slate-400">Smart duplicate detection and categorization.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Ticker */}
            <div className="relative z-10 pt-4 mt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live System Operational
              </span>
              <span className="font-mono text-teal-300 font-bold">v2.4 Supabase</span>
            </div>
          </div>

          {/* Right Column: Sleek Auth Form */}
          <div className="lg:col-span-7 p-6 sm:p-8">
            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl font-black text-[#102A43] tracking-tight">
                Sign In to Your Account
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your university credentials or click a demo role below.
              </p>
            </div>

            <Suspense fallback={<div className="text-center py-8 text-xs text-slate-400">Loading portal...</div>}>
              <AuthForm mode="login" />
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
