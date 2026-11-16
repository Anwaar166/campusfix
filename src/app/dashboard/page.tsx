import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { IssueCard } from '@/components/IssueCard';
import { IssueWithCounts } from '@/types/database';
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Wrench,
  CheckCircle2,
  ThumbsUp,
  ArrowRight,
  Sparkles,
  Inbox,
  User,
} from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUser();
  if (!user) {
    redirect('/login?redirectTo=/dashboard');
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  const supabase = await createClient();

  // 1. Fetch user's own issues
  const { data: myIssues } = await supabase
    .from('issues_with_counts')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  // 2. Fetch user upvotes
  const { data: upvotes } = await supabase
    .from('issue_upvotes')
    .select('issue_id')
    .eq('user_id', user.id);
  const userUpvotedIds = new Set((upvotes || []).map((u) => u.issue_id));

  // 3. User KPI counts
  const totalMyReports = myIssues?.length || 0;
  const myOpenReports = myIssues?.filter((i) => i.status === 'Open').length || 0;
  const myInProgress = myIssues?.filter((i) => i.status === 'In Progress').length || 0;
  const myResolved = myIssues?.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length || 0;

  // 4. Fetch trending campus issues
  const { data: trendingIssues } = await supabase
    .from('issues_with_counts')
    .select('*')
    .in('status', ['Open', 'In Progress'])
    .order('upvotes_count', { ascending: false })
    .limit(3);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>CampusFix Member Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {profile?.full_name || 'Campus Member'}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
              Track the live progress of your campus reports, review facility triage updates, and upvote urgent maintenance requests.
            </p>
          </div>

          <Link
            href="/issues/new"
            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            Report New Issue
          </Link>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="text-slate-500 text-xs font-bold flex items-center justify-between">
              <span>My Submissions</span>
              <User className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">{totalMyReports}</div>
            <div className="text-[11px] text-slate-400 mt-1">Submitted tickets</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs">
            <div className="text-blue-700 text-xs font-bold flex items-center justify-between">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-blue-900 mt-2">{myOpenReports}</div>
            <div className="text-[11px] text-blue-600 mt-1">Awaiting technician triage</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="text-amber-800 text-xs font-bold flex items-center justify-between">
              <span>In Progress</span>
              <Wrench className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-900 mt-2">{myInProgress}</div>
            <div className="text-[11px] text-amber-600 mt-1">Assigned to facilities crew</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
            <div className="text-emerald-700 text-xs font-bold flex items-center justify-between">
              <span>Resolved & Fixed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-900 mt-2">{myResolved}</div>
            <div className="text-[11px] text-emerald-600 mt-1">Repairs completed</div>
          </div>
        </div>

        {/* Two Column Layout: My Recent Reports vs Trending Campus Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: My Reports */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                My Reported Issues
              </h2>
              <Link
                href="/my-issues"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View all ({totalMyReports})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {myIssues && myIssues.length > 0 ? (
              <div className="space-y-3">
                {myIssues.slice(0, 4).map((issue: any) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue as IssueWithCounts}
                    currentUserId={user.id}
                    hasUpvoted={userUpvotedIds.has(issue.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No issues reported yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Noticed a broken power outlet, Wi-Fi problem, or water leak on campus? Submit a request to get it resolved.
                </p>
                <Link
                  href="/issues/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Report an Issue
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Trending Campus Upvotes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-indigo-600" />
                Trending on Campus
              </h2>
              <Link
                href="/issues?sort=upvotes"
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600"
              >
                Top upvoted
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 divide-y divide-slate-100 p-4 shadow-2xs space-y-3">
              {trendingIssues?.map((issue: any) => (
                <div key={issue.id} className="pt-3 first:pt-0">
                  <Link
                    href={`/issues/${issue.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2"
                  >
                    {issue.title}
                  </Link>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>{issue.building}</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {issue.upvotes_count || 0} upvotes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
