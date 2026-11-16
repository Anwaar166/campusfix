import React from 'react';
import Link from 'next/link';
import { Compass, Home, Wrench } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
        <Wrench className="w-7 h-7" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-700 mt-2">Campus Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1">
        The issue or maintenance ticket you are looking for may have been removed, archived, or is inaccessible.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link
          href="/issues"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors"
        >
          <Compass className="w-4 h-4" />
          <span>Campus Feed</span>
        </Link>
      </div>
    </div>
  );
}
