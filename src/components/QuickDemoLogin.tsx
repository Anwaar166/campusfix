'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ShieldAlert, GraduationCap, School, Wrench, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  redirectTo?: string;
  onSelectRole?: (demoEmail: string, demoPassword: string, demoRole: string) => void;
}

export function QuickDemoLogin({ redirectTo, onSelectRole }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleDemoSignIn = async (email: string, role: string) => {
    if (onSelectRole) {
      onSelectRole(email, 'CampusFix2026!', role.toLowerCase());
      return;
    }

    setLoading(role);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'CampusFix2026!',
      });

      if (error) throw error;

      if (redirectTo) {
        router.push(redirectTo);
      } else if (role === 'Admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      console.error('Demo login error:', err);
      alert('Demo sign in failed: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-linear-to-br from-slate-50 via-indigo-50/40 to-slate-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900">
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            One-Click Instant Demo Login
          </h4>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100/80 text-indigo-700">
          No typing required
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Select a demo persona to test role-based access, triage workflows, and campus community feeds:
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Administrator */}
        <button
          type="button"
          onClick={() => handleDemoSignIn('admin@campusfix.edu', 'Admin')}
          disabled={loading !== null}
          className="group relative flex flex-col items-center justify-between p-3 rounded-xl bg-white border border-indigo-200/90 hover:border-indigo-500 hover:bg-linear-to-b hover:from-indigo-50/80 hover:to-white shadow-xs hover:shadow-md hover:shadow-indigo-500/15 transition-all duration-200 text-center hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1.5 ring-2 ring-indigo-200/50 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            {loading === 'Admin' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Admin
          </span>
          <span className="text-[10px] font-medium text-slate-500 mt-0.5">
            Full Triage & KPIs
          </span>
          <div className="mt-1.5 flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Enter</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </button>

        {/* Student */}
        <button
          type="button"
          onClick={() => handleDemoSignIn('student@campusfix.edu', 'Student')}
          disabled={loading !== null}
          className="group relative flex flex-col items-center justify-between p-3 rounded-xl bg-white border border-sky-200/90 hover:border-sky-500 hover:bg-linear-to-b hover:from-sky-50/80 hover:to-white shadow-xs hover:shadow-md hover:shadow-sky-500/15 transition-all duration-200 text-center hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-1.5 ring-2 ring-sky-200/50 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all">
            {loading === 'Student' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
            Student
          </span>
          <span className="text-[10px] font-medium text-slate-500 mt-0.5">
            Alex Rivera
          </span>
          <div className="mt-1.5 flex items-center gap-0.5 text-[9px] font-bold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Enter</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </button>

        {/* Faculty */}
        <button
          type="button"
          onClick={() => handleDemoSignIn('faculty@campusfix.edu', 'Faculty')}
          disabled={loading !== null}
          className="group relative flex flex-col items-center justify-between p-3 rounded-xl bg-white border border-emerald-200/90 hover:border-emerald-500 hover:bg-linear-to-b hover:from-emerald-50/80 hover:to-white shadow-xs hover:shadow-md hover:shadow-emerald-500/15 transition-all duration-200 text-center hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 ring-2 ring-emerald-200/50 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            {loading === 'Faculty' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <School className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
            Faculty
          </span>
          <span className="text-[10px] font-medium text-slate-500 mt-0.5">
            Dr. Sarah Chen
          </span>
          <div className="mt-1.5 flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Enter</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </button>

        {/* Maintenance */}
        <button
          type="button"
          onClick={() => handleDemoSignIn('maintenance@campusfix.edu', 'Maintenance')}
          disabled={loading !== null}
          className="group relative flex flex-col items-center justify-between p-3 rounded-xl bg-white border border-amber-200/90 hover:border-amber-500 hover:bg-linear-to-b hover:from-amber-50/80 hover:to-white shadow-xs hover:shadow-md hover:shadow-amber-500/15 transition-all duration-200 text-center hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5 ring-2 ring-amber-200/50 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all">
            {loading === 'Maintenance' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wrench className="w-4 h-4" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
            Staff
          </span>
          <span className="text-[10px] font-medium text-slate-500 mt-0.5">
            Facilities Team
          </span>
          <div className="mt-1.5 flex items-center gap-0.5 text-[9px] font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Enter</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </button>
      </div>
    </div>
  );
}
