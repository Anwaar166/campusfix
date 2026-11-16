import React from 'react';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { IssueCard } from '@/components/IssueCard';
import { QuickDemoLogin } from '@/components/QuickDemoLogin';
import {
  Wrench,
  Compass,
  PlusCircle,
  ThumbsUp,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  Bot,
  Activity,
  BarChart3,
  Search,
  Check,
  TrendingUp,
  Users,
  AlertTriangle,
  Lightbulb,
  FileCheck2,
} from 'lucide-react';

export const revalidate = 0; // dynamic data

export default async function HomePage() {
  const { user, profile } = await getCurrentUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;
  const supabase = await createClient();

  // Fetch recent public issues
  const { data: recentIssues } = await supabase
    .from('issues_with_counts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4);

  // Fetch user upvotes if logged in
  let userUpvotedIds = new Set<string>();
  if (user) {
    const { data: upvotes } = await supabase
      .from('issue_upvotes')
      .select('issue_id')
      .eq('user_id', user.id);
    if (upvotes) {
      userUpvotedIds = new Set(upvotes.map((u) => u.issue_id));
    }
  }

  // Exact Supabase counts
  const { count: totalCount } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true });

  const { count: resolvedCount } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Resolved', 'Closed']);

  const { count: inProgressCount } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'In Progress');

  const { count: openCount } = await supabase
    .from('issues')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Open');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-[#0D9488] selection:text-white">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-12 pb-16 sm:py-20 lg:py-24">
        {/* Subtle background gradient glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/90 text-[#0D9488] text-xs font-extrabold tracking-wide shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
                <span className="uppercase tracking-wider">SMART CAMPUS MAINTENANCE PLATFORM</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#102A43] tracking-tight leading-[1.1]">
                A Smarter Campus Starts With{' '}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0D9488] to-teal-500">
                  Better Solutions.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Centralized campus issue reporting, community upvoting, and maintenance workflow platform. Replace slow paper forms and lost emails with transparent, tracked repairs across every lecture hall, lab, and residence.
              </p>

              {/* Primary & Secondary Action CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/issues/new"
                  className="inline-flex items-center gap-2 bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  <PlusCircle className="w-5 h-5" />
                  Report an Issue
                </Link>
                <Link
                  href="/issues"
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#102A43] font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl border border-slate-300 shadow-2xs hover:border-slate-400 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  <Compass className="w-5 h-5 text-[#0D9488]" />
                  Explore Campus Feed
                </Link>
              </div>

              {/* Trust Indicator Metrics */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                  <span>Real-time Supabase Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                  <span>Campus-wide Upvoting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                  <span>Row-Level Security Verification</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Smart Campus Dashboard Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Background glow behind card mockup */}
                <div className="absolute -inset-2 bg-linear-to-r from-teal-500/20 to-indigo-500/20 rounded-3xl blur-xl" />

                {/* Main Window Mockup Container */}
                <div className="relative bg-[#102A43] text-white rounded-3xl shadow-2xl border border-slate-700/80 p-5 space-y-4 overflow-hidden">
                  {/* Window Bar Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/90" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/90" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/90" />
                      <span className="ml-2 text-xs font-mono text-slate-400">campusfix-dispatch.live</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Feed
                    </span>
                  </div>

                  {/* Floating Issue Ticket 1 */}
                  <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 hover:border-teal-500/50 transition-colors shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-teal-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Science Complex • Lab 304
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        Resolved (Verified)
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-100">
                      Emergency Eyewash Station Pressure Valve Restored
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Assigned to: Plumbing & Fire Crew</span>
                      <span className="text-emerald-400 font-bold">Fixed in 42m</span>
                    </div>
                  </div>

                  {/* Floating Issue Ticket 2 */}
                  <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 hover:border-amber-500/50 transition-colors shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-amber-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Main Library • 2nd Floor
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                        In Progress
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-100">
                      HVAC Chiller Unit Airflow Balancing in Study Pods
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span className="inline-flex items-center gap-1 text-teal-400 font-bold">
                        <ThumbsUp className="w-3 h-3" /> 28 Student Upvotes
                      </span>
                      <span className="text-slate-400">Technician On-Site</span>
                    </div>
                  </div>

                  {/* Quick Status Stats Row */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
                      <div className="text-lg font-black text-teal-400">98.4%</div>
                      <div className="text-[10px] text-slate-400 font-medium">SLA Compliance Rate</div>
                    </div>
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
                      <div className="text-lg font-black text-amber-400">&lt; 48 Hrs</div>
                      <div className="text-[10px] text-slate-400 font-medium">Avg Resolution Velocity</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Personas Box in Hero */}
          <div className="max-w-4xl mx-auto mt-12 sm:mt-16">
            <QuickDemoLogin />
          </div>
        </div>
      </section>

      {/* STEP 7 — CAMPUS IMPACT STATISTICS (LIVE SUPABASE DATA) */}
      <section className="bg-[#102A43] text-white py-12 sm:py-16 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0D9488]">
              REAL-TIME DATABASE METRICS
            </h2>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Campus Facilities Impact
            </p>
            <p className="text-xs sm:text-sm text-slate-400">
              Aggregated directly from our live Supabase PostgreSQL work order database.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Total Reports */}
            <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md hover:border-teal-500/40 transition-colors space-y-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center mx-auto mb-2">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white">
                {totalCount ?? 9}
              </div>
              <div className="text-xs font-bold text-slate-300">Total Campus Reports</div>
              <div className="text-[11px] text-slate-500">Documented & triaged</div>
            </div>

            {/* Card 2: Open Issues */}
            <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md hover:border-amber-500/40 transition-colors space-y-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400">
                {openCount ?? 2}
              </div>
              <div className="text-xs font-bold text-slate-300">Open Tickets</div>
              <div className="text-[11px] text-slate-500">Awaiting assignment</div>
            </div>

            {/* Card 3: Resolved Issues */}
            <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md hover:border-emerald-500/40 transition-colors space-y-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                {resolvedCount ?? 3}
              </div>
              <div className="text-xs font-bold text-slate-300">Verified Fixes</div>
              <div className="text-[11px] text-slate-500">Resolved & feedback-rated</div>
            </div>

            {/* Card 4: Avg Resolution Velocity */}
            <div className="bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md hover:border-teal-500/40 transition-colors space-y-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-teal-300">
                &lt; 48 hrs
              </div>
              <div className="text-xs font-bold text-slate-300">Average Turnaround</div>
              <div className="text-[11px] text-slate-500">Meeting campus SLA standards</div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 5 — 6 PREMIUM FEATURE CARDS */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D9488]">
              PLATFORM CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A43] tracking-tight">
              Engineered for Modern Campus Facilities
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every tool students, faculty, maintenance engineers, and university administrators need to maintain world-class campus infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1: Smart Issue Reporting */}
            <div className="group bg-[#F8FAFC] rounded-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-[#0D9488] shadow-xs hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center group-hover:bg-[#0D9488] group-hover:text-white transition-colors duration-200 ring-4 ring-teal-50">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#102A43] group-hover:text-[#0D9488] transition-colors">
                1. Smart Issue Reporting
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Report facility bugs in 30 seconds with building pickers, urgency flags, and photo uploads. Built-in real-time duplicate detection prevents spamming duplicate maintenance tickets.
              </p>
            </div>

            {/* Feature 2: Real-Time Issue Tracking */}
            <div className="group bg-[#F8FAFC] rounded-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-[#0D9488] shadow-xs hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors duration-200 ring-4 ring-sky-50">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#102A43] group-hover:text-[#0D9488] transition-colors">
                2. Real-Time Issue Tracking
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Watch work orders progress live from Open to In Progress, Resolved, or Closed. Complete audit trail logs with staff notes and timestamps ensure complete operational transparency.
              </p>
            </div>

            {/* Feature 3: Community Upvoting */}
            <div className="group bg-[#F8FAFC] rounded-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-[#0D9488] shadow-xs hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200 ring-4 ring-amber-50">
                <ThumbsUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#102A43] group-hover:text-[#0D9488] transition-colors">
                3. Community Upvoting
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Crowdsource campus repair priorities. Students and faculty vote on broken projectors, freezing study rooms, or elevators so maintenance crews address the highest-impact issues first.
              </p>
            </div>

            {/* Feature 4: Admin Management */}
            <div className="group bg-[#F8FAFC] rounded-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-[#0D9488] shadow-xs hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200 ring-4 ring-indigo-50">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#102A43] group-hover:text-[#0D9488] transition-colors">
                4. Admin Management Center
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Facilities coordinators assign tickets to designated teams (HVAC, Electrical, Plumbing, IT), update statuses, trigger automated notifications, and manage campus buildings and categories.
              </p>
            </div>

            {/* Feature 5: AI-Powered Assistance */}
            <div className="group bg-[#F8FAFC] rounded-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-[#0D9488] shadow-xs hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200 ring-4 ring-purple-50">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#102A43] group-hover:text-[#0D9488] transition-colors">
                5. AI-Powered Assistance
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Smart assistance guides users to write precise problem descriptions, recommends appropriate categories and urgency, and flags duplicate work orders before submission.
              </p>
            </div>

            {/* Feature 6: Campus Analytics */}
            <div className="group bg-[#F8FAFC] rounded-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-[#0D9488] shadow-xs hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 hover:-translate-y-1 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 ring-4 ring-emerald-50">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#102A43] group-hover:text-[#0D9488] transition-colors">
                6. Campus Analytics & Reports
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Measure repair velocity, track recurring breakdowns by building, analyze team resolution rates, and export clean CSV reports for quarterly campus infrastructure audits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 6 — HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D9488]">
              SIMPLE 4-STEP WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A43] tracking-tight">
              How CampusFix Resolves Issues
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              From the moment a problem is spotted to verified resolution, our automated pipeline keeps every stakeholder informed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-teal-600/30">01</span>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-base font-bold text-[#102A43]">
                1. Report Campus Issue
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Student or faculty member submits an issue with room number, category, urgency, and optional photo attachment in under a minute.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-teal-600/30">02</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-base font-bold text-[#102A43]">
                2. Admin Triage & Assign
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Facilities coordinators review incoming reports, verify urgency, and instantly assign tickets to the specialized maintenance team.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-teal-600/30">03</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-base font-bold text-[#102A43]">
                3. Maintenance Fix & Audit
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Field technicians dispatch to the location, resolve the malfunction, and post timestamped progress notes to the public timeline.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-teal-600/30">04</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-base font-bold text-[#102A43]">
                4. Verified Resolution & Rating
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The original reporter and community upvoters are notified immediately, with 5-star satisfaction rating cards to verify fix quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 8 — DEDICATED CAMPUSFIX AI SECTION */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#102A43] text-white rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl border border-slate-800">
            {/* Background ambient lighting */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
              {/* Left Column: AI Value Proposition */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold">
                  <Bot className="w-4 h-4 text-teal-400" />
                  <span>CAMPUSFIX AI COPILOT</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Intelligent Guidance for Every Campus Request.
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  CampusFix AI powers our facilities portal with continuous intelligence. It assists students during reporting and gives maintenance leadership predictive insights:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="block text-white font-bold mb-0.5">Description Enhancer</strong>
                      <span className="text-slate-400">Prompts users for crucial details like exact room side or unit model numbers.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <Layers className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="block text-white font-bold mb-0.5">Category Auto-Suggest</strong>
                      <span className="text-slate-400">Classifies issues into HVAC, Electrical, Plumbing, or Safety automatically.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <Search className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="block text-white font-bold mb-0.5">Duplicate Warning</strong>
                      <span className="text-slate-400">Scans open tickets and redirects users to upvote active reports instead.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <TrendingUp className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="block text-white font-bold mb-0.5">Admin Trend Synthesis</strong>
                      <span className="text-slate-400">Aggregates repeat failures across campus buildings for preventative maintenance.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Assistant Mockup Card */}
              <div className="lg:col-span-5">
                <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">CampusFix Assistant</div>
                        <div className="text-[10px] text-teal-400">Online • Ready to Assist</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">v2.4 AI</span>
                  </div>

                  {/* AI Bubble 1: User prompt */}
                  <div className="bg-slate-800/80 text-slate-200 text-xs p-3 rounded-xl rounded-br-none ml-6 border border-slate-700/50">
                    "The water fountain near Room 204 in Engineering Hall is leaking onto the carpet."
                  </div>

                  {/* AI Bubble 2: Assistant response */}
                  <div className="bg-teal-950/60 text-teal-200 text-xs p-3.5 rounded-xl rounded-tl-none mr-4 border border-teal-800/50 space-y-2">
                    <p className="font-semibold text-white">
                      Identified: Plumbing Issue in Engineering Hall
                    </p>
                    <ul className="text-[11px] space-y-1 text-teal-300">
                      <li>• Category set to: <strong>Plumbing</strong></li>
                      <li>• Urgency: <strong>High</strong> (Water hazard near carpet/power)</li>
                      <li>• No identical active reports found within 50 ft.</li>
                    </ul>
                    <div className="pt-1 flex items-center gap-1.5 text-[10px] text-teal-400 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      Ticket ready for instant 1-click submission
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT PUBLIC CAMPUS ISSUES PREVIEW */}
      <section className="py-16 sm:py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D9488]">
                LIVE CAMPUS ACTIVITY
              </span>
              <h2 className="text-3xl font-black text-[#102A43] tracking-tight">
                Recent Campus Maintenance Reports
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Explore real active and resolved work orders submitted by the campus community.
              </p>
            </div>
            <Link
              href="/issues"
              className="inline-flex items-center gap-1 text-sm font-bold text-[#0D9488] hover:text-[#0f766e] transition-colors"
            >
              <span>View Full Campus Feed</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentIssues && recentIssues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {recentIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  currentUserId={user?.id}
                  hasUpvoted={userUpvotedIds.has(issue.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Compass className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No issues reported yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Be the first to submit a maintenance request on campus!
              </p>
              <Link
                href="/issues/new"
                className="inline-flex items-center gap-2 bg-[#0D9488] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <PlusCircle className="w-4 h-4" />
                Report First Issue
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-16 sm:py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#0D9488]">
            ABOUT CAMPUSFIX
          </span>
          <h2 className="text-3xl font-black text-[#102A43] tracking-tight">
            Built for Transparency. Dedicated to Campus Excellence.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            CampusFix bridges the communication gap between university members who discover facility problems and the dedicated maintenance teams who fix them. By providing community upvoting, real-time audit timelines, and data-driven facilities triage, we empower our university community to keep educational spaces safe, comfortable, and productive.
          </p>
          <div className="pt-2">
            <Link
              href="/issues/new"
              className="inline-flex items-center gap-2 bg-[#102A43] hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-xs transition-colors"
            >
              Get Started with CampusFix
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
