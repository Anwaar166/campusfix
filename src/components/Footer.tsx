import React from 'react';
import Link from 'next/link';
import { Wrench, PhoneCall, ShieldCheck, HeartHandshake, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto bg-[#102A43] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">
                Campus<span className="text-[#0D9488]">Fix</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The next-generation smart campus maintenance ecosystem. Transforming student complaints into resolved work orders with transparency, AI routing, and community collaboration.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Campus Systems Operational</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Platform Links
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link href="/issues" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                  <span>Campus Issue Feed</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link href="/issues/new" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                  <span>Report an Issue</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-teal-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-teal-400 transition-colors">
                  Platform Features
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-teal-400 transition-colors">
                  Student & Faculty Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-teal-400 transition-colors">
                  Administration Triage
                </Link>
              </li>
            </ul>
          </div>

          {/* Facilities Hotline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-teal-400" />
              Emergency Dispatch
            </h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex flex-col bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Campus Facilities Hotline:</span>
                <span className="text-teal-300 font-mono font-bold text-sm">(555) 234-5678</span>
              </li>
              <li className="flex flex-col bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Campus Security & Safety:</span>
                <span className="text-rose-400 font-mono font-bold text-sm">(555) 911-0000</span>
              </li>
              <li className="text-[11px] text-slate-400 leading-normal">
                For active chemical leaks, electrical fire hazards, or physical emergencies, dial dispatch immediately.
              </li>
            </ul>
          </div>

          {/* Trust and Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Security & Compliance
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Protected by Supabase Row-Level Security (RLS) policies, encrypted sessions, and full audit logging for facilities compliance.
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Zero-Trust Role-Based Access (RBAC)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Encrypted Audit History</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                <span>Official University Partner</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CampusFix. Smart Campus Issue & Maintenance Platform. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-2">
            <span>Powered by Next.js 15, Supabase & Tailwind CSS</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
