import React from 'react';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { IssueCard } from '@/components/IssueCard';
import { QuickDemoLogin } from '@/components/QuickDemoLogin';
import { IssueWithCounts } from '@/types/database';
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
} from 'lucide-react';

export const revalidate = 0; // dynamic

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

  // Aggregate stats
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-16 sm:py-24">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 bg-radial from-indigo-50/50 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Next-Generation Campus Facilities Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              A smarter way to report, track, and fix campus issues.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Replace lost messages and paper logs with a transparent, community-driven maintenance portal. Report problems in seconds, upvote urgent repairs, and track verified resolutions in real time.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/issues/new"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md hover:shadow-indigo-200 hover:scale-105 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Report an Issue
              </Link>
              <Link
                href="/issues"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm px-6 py-3.5 rounded-xl transition-all"
              >
                <Compass className="w-4 h-4 text-slate-500" />
                View Campus Feed
              </Link>
            </div>
          </div>

          {/* Quick Demo Personas Box right in Hero */}
          <div className="max-w-3xl mx-auto mt-12">
            <QuickDemoLogin />
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="bg-slate-900 text-white py-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-black text-indigo-400">
                {totalCount || 9}+
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Total Campus Reports
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-emerald-400">
                {resolvedCount || 3}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Verified Fixes Completed
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-amber-400">
                {inProgressCount || 4}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Active Work In Progress
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-sky-400">
                5 Teams
              </div>
              <div className="text-xs text-slate-400 font-medium">
                IT, Power, Plumbing, Labs & Ops
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Workflow Pillars */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Engineered for Transparent Campus Operations
            </h2>
            <p className="text-sm text-slate-600">
              Built specifically to eliminate duplicate reports, prioritize high-impact concerns, and enforce auditable database security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Duplicate Detection & Prevention
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                As students report issues, the platform cross-references recent submissions in the same building and category, prompting them to upvote an existing report instead of cluttering facilities triage.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Community Upvoting & Priority
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Campus members can endorse open issues. Administrators sort by community impact alongside urgency and age to allocate technician crews where they are needed most.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Verified Resolution & Auditing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Status transitions require documented explanations. Once resolved, the original reporter receives an in-app alert and submits optional 1-5 star verification feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Campus Issues Feed Preview */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Recent Campus Reports</h3>
              <p className="text-xs text-slate-500">Live feed of active maintenance tickets across campus.</p>
            </div>
            <Link
              href="/issues"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>Explore full campus feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentIssues?.map((issue: any) => (
              <IssueCard
                key={issue.id}
                issue={issue as IssueWithCounts}
                currentUserId={user?.id}
                hasUpvoted={userUpvotedIds.has(issue.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
