import React from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, UserPlus, LogIn, Sparkles } from 'lucide-react';

export function FeedAuthGate() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200/90 text-center space-y-6 animate-in fade-in zoom-in-95">
        {/* Shield icon */}
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto shadow-lg shadow-teal-500/10 ring-4 ring-teal-50">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0D9488] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CAMPUS COMMUNITY ACCESS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#102A43] tracking-tight">
            Authentication Required to Access Campus Feed
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            To protect student and faculty privacy, prevent unsolicited submissions, and safeguard real-time maintenance dispatch logs, you must be signed in to view the Campus Feed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login?redirectTo=/issues"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs hover:shadow transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to View Feed</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/signup?redirectTo=/issues"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#102A43] font-bold text-xs sm:text-sm px-6 py-3 rounded-xl border border-slate-300 shadow-2xs hover:border-slate-400 transition-all"
          >
            <UserPlus className="w-4 h-4 text-[#0D9488]" />
            <span>Create Campus Account</span>
          </Link>
        </div>

        {/* Back to Home Link */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-[#0D9488] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Home</span>
          </Link>

          <div className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Row-Level Security Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
