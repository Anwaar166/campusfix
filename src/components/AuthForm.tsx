'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/database';
import { QuickDemoLogin } from './QuickDemoLogin';
import {
  Mail,
  Lock,
  User,
  Building,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface Props {
  mode: 'login' | 'signup' | 'forgot-password';
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Fetch user profile to route appropriately
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (redirectTo) {
          router.push(redirectTo);
        } else if (profile?.role === 'admin' || profile?.role === 'maintenance') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              department: department.trim(),
              role,
            },
          },
        });

        if (error) throw error;

        // With our auto-confirm trigger, the user is confirmed and ready
        setSuccessMsg(
          'Account created successfully! Signing in...'
        );

        // Sign in immediately
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

        setTimeout(() => {
          if (role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
          router.refresh();
        }, 1000);
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });

        if (error) throw error;
        setSuccessMsg(
          'Password reset link dispatched. Please check your campus inbox.'
        );
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Demo Login Personas */}
      <QuickDemoLogin redirectTo={redirectTo} />

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Or use your campus credentials
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  Account Type
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty / Staff</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Biology"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
                  required
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            Campus Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. user@campusfix.edu"
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white"
            required
          />
        </div>

        {mode !== 'forgot-password' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                Password
              </label>
              {mode === 'login' && (
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 p-3 bg-white"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md transition-all mt-2"
        >
          {loading ? (
            <span>Processing...</span>
          ) : (
            <>
              <span>
                {mode === 'login'
                  ? 'Sign In to CampusFix'
                  : mode === 'signup'
                  ? 'Create Campus Account'
                  : 'Send Reset Link'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer link to switch mode */}
      <div className="text-center text-xs text-slate-600">
        {mode === 'login' ? (
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-bold text-indigo-600 hover:underline">
              Register now
            </Link>
          </p>
        ) : (
          <p>
            Already registered?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:underline">
              Sign in here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
