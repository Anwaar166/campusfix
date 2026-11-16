import React from 'react';
import Link from 'next/link';
import { Wrench, PhoneCall, ShieldCheck, HeartHandshake } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Campus<span className="text-indigo-600">Fix</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Centralized smart campus issue reporting, community upvoting, and transparent maintenance resolution workflow.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Campus Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/issues" className="hover:text-indigo-600 transition-colors">
                  Campus Issue Feed
                </Link>
              </li>
              <li>
                <Link href="/issues/new" className="hover:text-indigo-600 transition-colors">
                  Submit a Maintenance Request
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
                  Student & Faculty Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-indigo-600 transition-colors">
                  Administration Triage
                </Link>
              </li>
            </ul>
          </div>

          {/* Facilities Hotline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-indigo-500" />
              Emergency Dispatch
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex flex-col">
                <span className="font-semibold text-slate-700">Campus Facilities Hotline:</span>
                <span className="text-indigo-600 font-mono">(555) 234-5678</span>
              </li>
              <li className="flex flex-col">
                <span className="font-semibold text-slate-700">Campus Security & Safety:</span>
                <span className="text-rose-600 font-mono font-bold">(555) 911-0000</span>
              </li>
              <li className="text-[11px] text-slate-600">
                For active fires, gas leaks, or bodily hazards, contact emergency dispatch immediately.
              </li>
            </ul>
          </div>

          {/* Trust and Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Security & Access
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Powered by Supabase PostgreSQL Row Level Security (RLS) with role-based audit verification.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <HeartHandshake className="w-4 h-4 text-indigo-500" />
              <span>University Campus Operations</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600">
          <p>© {new Date().getFullYear()} CampusFix. Smart Campus Issue & Maintenance Platform.</p>
          <p className="mt-2 sm:mt-0">Built with Next.js, Supabase, PostgreSQL & Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
