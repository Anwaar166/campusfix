'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/database';
import { QuickDemoLogin } from './QuickDemoLogin';
import { TurnstileWidget, TurnstileWidgetRef } from './TurnstileWidget';
import {
  Mail,
  Lock,
  User,
  Building,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  School,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  mode: 'login' | 'signup' | 'forgot-password';
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '';
  const isVerified = searchParams.get('verified') === 'true';
  const errorParam = searchParams.get('error');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [portalPref, setPortalPref] = useState<'student' | 'faculty' | 'admin'>('student');

  // Security CAPTCHA State
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [registrationSuccessData, setRegistrationSuccessData] = useState<{ email: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    if (errorParam === 'verification_failed') {
      setErrorMsg('Email verification link is invalid or has expired. Please request a new one below.');
    }
  }, [errorParam]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendVerification = async (targetEmail: string) => {
    if (!targetEmail || resendCooldown > 0) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSuccessMsg(`A fresh verification link has been sent to ${targetEmail}.`);
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend email verification.');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUnverifiedEmail(null);

    try {
      // 1. CAPTCHA verification on Login and Registration
      if (mode === 'login' || mode === 'signup') {
        if (!captchaToken) {
          throw new Error('Please complete the security verification challenge before continuing.');
        }

        const captchaRes = await fetch('/api/auth/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: captchaToken }),
        });

        const captchaData = await captchaRes.json();
        if (!captchaRes.ok || !captchaData.success) {
          turnstileRef.current?.reset();
          setCaptchaToken(null);
          throw new Error(captchaData.error || 'Security verification failed. Please complete the CAPTCHA again.');
        }
      }

      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message?.toLowerCase().includes('email not confirmed')) {
            setUnverifiedEmail(email.trim());
            throw new Error('Your email address has not been verified yet. Please check your inbox or click resend.');
          }
          throw error;
        }

        // Fetch user profile from trusted server-side table
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single();

        if (profileErr) {
          console.error('Error fetching profile:', profileErr);
        }

        const actualRole = profile?.role || 'student';

        // Check portal preference match
        if (portalPref === 'admin' && actualRole !== 'admin' && actualRole !== 'maintenance') {
          setSuccessMsg(`Authenticated as ${actualRole}. Redirecting to your authorized dashboard...`);
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1200);
          return;
        }

        if (redirectTo) {
          router.push(redirectTo);
        } else if (actualRole === 'admin' || actualRole === 'maintenance') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else if (mode === 'signup') {
        // Validation
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }

        // Strict: Normal users can only register as student or faculty
        const sanitizedRole: 'student' | 'faculty' = role === 'faculty' ? 'faculty' : 'student';

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              department: department.trim(),
              role: sanitizedRole,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        // Redirect to dedicated verification page with email param
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/profile`,
        });

        if (error) throw error;

        setSuccessMsg(
          'Password reset instructions have been sent to your university email.'
        );
      }
    } catch (err: any) {
      console.error('Auth action error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
      // Reset CAPTCHA on error so user can retry
      turnstileRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* SUCCESS MODAL: EMAIL VERIFIED ON LOGIN */}
      {isVerified && mode === 'login' && (
        <div className="mb-4 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-start gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="block font-bold text-sm text-[#102A43]">
              Email Verified Successfully!
            </strong>
            <p className="text-slate-600 mt-0.5">
              Your CampusFix account is now activated. Sign in below to enter your dashboard.
            </p>
          </div>
        </div>
      )}

      {/* ERROR & UNVERIFIED EMAIL ALERTS */}
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{errorMsg}</span>
            {unverifiedEmail && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => handleResendVerification(unverifiedEmail)}
                  disabled={resendCooldown > 0}
                  className="inline-flex items-center gap-1 font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Resend link (${resendCooldown}s)` : 'Resend verification email now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {successMsg && !registrationSuccessData && (
        <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* THE FORM */}
      <form onSubmit={handleAuth} className="space-y-3.5">
        {/* LOGIN PORTAL SELECTION */}
        {mode === 'login' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Portal Destination
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPortalPref('student')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                  portalPref === 'student'
                    ? 'bg-teal-50 border-[#0D9488] text-[#0D9488] shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => setPortalPref('faculty')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                  portalPref === 'faculty'
                    ? 'bg-teal-50 border-[#0D9488] text-[#0D9488] shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => setPortalPref('admin')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                  portalPref === 'admin'
                    ? 'bg-[#102A43] border-[#102A43] text-white shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* FULL NAME (SIGNUP ONLY) */}
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {/* EMAIL (ALL MODES) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            University Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@campusfix.edu"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* ROLE SELECTION (SIGNUP ONLY) */}
        {mode === 'signup' && (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'faculty')}
                className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] transition-all cursor-pointer"
              >
                <option value="student">Student Account</option>
                <option value="faculty">Faculty Member</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] transition-all"
              />
            </div>
          </div>
        )}

        {/* PASSWORD FIELD (LOGIN & SIGNUP) */}
        {mode !== 'forgot-password' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Password
              </label>
              {mode === 'login' && (
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-[#0D9488] hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM PASSWORD (SIGNUP ONLY) */}
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* CLOUDFLARE TURNSTILE CAPTCHA (LOGIN & SIGNUP) */}
        {mode !== 'forgot-password' && (
          <TurnstileWidget
            ref={turnstileRef}
            onVerify={(tok) => setCaptchaToken(tok)}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || (mode !== 'forgot-password' && !captchaToken)}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md hover:shadow-teal-500/20 transition-all duration-200 disabled:opacity-50 mt-1 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
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

      {/* FOOTER SWITCH */}
      <div className="mt-4 pt-4 border-t border-slate-100 text-center">
        {mode === 'login' && (
          <p className="text-xs text-slate-600">
            Don&apos;t have a university account?{' '}
            <Link
              href="/signup"
              className="font-bold text-[#0D9488] hover:text-[#0f766e] transition-colors"
            >
              Register here
            </Link>
          </p>
        )}

        {mode === 'signup' && (
          <p className="text-xs text-slate-600">
            Already have an active account?{' '}
            <Link
              href="/login"
              className="font-bold text-[#0D9488] hover:text-[#0f766e] transition-colors"
            >
              Sign in
            </Link>
          </p>
        )}

        {mode === 'forgot-password' && (
          <p className="text-xs text-slate-600">
            Remembered your credentials?{' '}
            <Link
              href="/login"
              className="font-bold text-[#0D9488] hover:text-[#0f766e] transition-colors"
            >
              Back to Sign In
            </Link>
          </p>
        )}
      </div>

      {/* QUICK DEMO CREDENTIALS SHORTCUT ON LOGIN */}
      {mode === 'login' && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <QuickDemoLogin
            onSelectRole={(demoEmail, demoPassword, demoRole) => {
              setEmail(demoEmail);
              setPassword(demoPassword);
              setPortalPref(demoRole === 'admin' ? 'admin' : demoRole === 'faculty' ? 'faculty' : 'student');
            }}
          />
        </div>
      )}
    </div>
  );
}
