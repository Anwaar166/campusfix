'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ShieldAlert, GraduationCap, School, Wrench, Sparkles } from 'lucide-react';

interface Props {
  redirectTo?: string;
}

export function QuickDemoLogin({ redirectTo }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleDemoSignIn = async (email: string, role: string) => {
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
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2 text-slate-800">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h4 className="text-xs font-bold uppercase tracking-wider">
          One-Click Demo Roles (Instant Access)
        </h4>
      </div>
      <p className="text-xs text-slate-500">
        Click any persona below to authenticate instantly and explore its role-based views and permissions:
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => handleDemoSignIn('admin@campusfix.edu', 'Admin')}
          disabled={loading !== null}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-2xs transition-all text-center group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900">Administrator</span>
          <span className="text-[10px] text-slate-500">Full Facilities Triage</span>
        </button>

        <button
          type="button"
          onClick={() => handleDemoSignIn('student@campusfix.edu', 'Student')}
          disabled={loading !== null}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-sky-200 hover:border-sky-400 hover:bg-sky-50/50 shadow-2xs transition-all text-center group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900">Student</span>
          <span className="text-[10px] text-slate-500">Alex Rivera</span>
        </button>

        <button
          type="button"
          onClick={() => handleDemoSignIn('faculty@campusfix.edu', 'Faculty')}
          disabled={loading !== null}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-2xs transition-all text-center group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <School className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900">Faculty</span>
          <span className="text-[10px] text-slate-500">Dr. Sarah Chen</span>
        </button>

        <button
          type="button"
          onClick={() => handleDemoSignIn('maintenance@campusfix.edu', 'Maintenance')}
          disabled={loading !== null}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 shadow-2xs transition-all text-center group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900">Technician</span>
          <span className="text-[10px] text-slate-500">Marcus Vance</span>
        </button>
      </div>

      {loading && (
        <div className="text-center text-xs font-semibold text-indigo-600 animate-pulse pt-1">
          Authenticating as {loading}...
        </div>
      )}
    </div>
  );
}
