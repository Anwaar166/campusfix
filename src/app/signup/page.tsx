import React, { Suspense } from 'react';
import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { Wrench } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">
            Campus<span className="text-indigo-600">Fix</span>
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Register New Campus Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Create an account to report issues, upvote requests, and receive resolution updates.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 sm:px-10 shadow-sm border border-slate-200/90 rounded-2xl">
          <Suspense fallback={<div className="text-center py-8 text-xs text-slate-400">Loading form...</div>}>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
