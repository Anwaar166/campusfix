import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getServerTranslation } from '@/lib/i18n/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Footer } from '@/components/Footer';
import { IssueCard } from '@/components/IssueCard';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  Building2,
  Bell,
  User,
  Settings,
  LogOut,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Inbox,
  Activity,
  ThumbsUp,
} from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function DashboardPage() {
  const { t, lang } = await getServerTranslation();
  const { user, profile } = await getCurrentUser();
  if (!user) {
    redirect('/login?redirectTo=/dashboard');
    return null;
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

  // 4. Fetch recent updates on user's issues
  const myIssueIds = (myIssues || []).map((i) => i.id);
  let recentUpdates: any[] = [];
  if (myIssueIds.length > 0) {
    const { data: updates } = await supabase
      .from('issue_updates')
      .select('*, issues(title, room_location, building)')
      .in('issue_id', myIssueIds)
      .order('created_at', { ascending: false })
      .limit(5);
    recentUpdates = updates || [];
  }

  // 5. Fetch trending campus issues
  const { data: trendingIssues } = await supabase
    .from('issues_with_counts')
    .select('*')
    .in('status', ['Open', 'In Progress'])
    .order('upvotes_count', { ascending: false })
    .limit(3);

  const roleDisplay = profile?.role === 'faculty'
    ? (lang === 'ur' ? 'فیکلٹی ممبر' : 'Faculty Member')
    : (lang === 'ur' ? 'طالب علم' : 'Student');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Dedicated Workspace Left Sidebar */}
      <DashboardSidebar profile={profile} unreadCount={unreadCount} />

      {/* Main Content Area with sidebar offset on desktop */}
      <div className="lg:pl-64 flex-1 flex flex-col justify-between">
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-[#102A43] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-slate-800">
            {/* Subtle Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>{roleDisplay} {lang === 'ur' ? 'کنٹرول سینٹر' : 'Control Center'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {t('dashboard.welcome_back', 'Welcome back,')} {profile?.full_name?.split(' ')[0] || (lang === 'ur' ? 'کیمپس رکن' : 'Campus Member')}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {t('dashboard.subtitle', 'Track the real-time resolution status of your maintenance requests, review timeline updates, and help prioritize campus repairs.')}
              </p>
            </div>

            <Link
              href="/issues/new"
              className="inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-teal-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('dashboard.report_new_issue', 'Report New Issue')}</span>
            </Link>
          </div>

          {/* 4 KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <div className="text-slate-500 text-xs font-bold flex items-center justify-between">
                <span>{t('dashboard.reported_by_you', 'My Reports')}</span>
                <User className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-[#102A43]">{totalMyReports}</div>
              <div className="text-[11px] text-slate-400">{lang === 'ur' ? 'کل شکایات' : 'Total submitted'}</div>
            </div>

            {/* Card 2: Open */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <div className="text-slate-500 text-xs font-bold flex items-center justify-between">
                <span>{t('dashboard.pending_review', 'Open Tickets')}</span>
                <Clock className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-3xl font-black text-sky-600">{myOpenReports}</div>
              <div className="text-[11px] text-slate-400">{lang === 'ur' ? 'زیرِ جائزہ' : 'Under review'}</div>
            </div>

            {/* Card 3: In Progress */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <div className="text-slate-500 text-xs font-bold flex items-center justify-between">
                <span>{t('dashboard.in_progress', 'In Progress')}</span>
                <Wrench className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-600">{myInProgress}</div>
              <div className="text-[11px] text-slate-400">{lang === 'ur' ? 'ٹیکنیشن فعال' : 'Technician active'}</div>
            </div>

            {/* Card 4: Resolved */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <div className="text-slate-500 text-xs font-bold flex items-center justify-between">
                <span>{t('dashboard.resolved', 'Resolved')}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-emerald-600">{myResolved}</div>
              <div className="text-[11px] text-slate-400">{lang === 'ur' ? 'مکمل و تصدیق شدہ' : 'Verified & closed'}</div>
            </div>
          </div>

          {/* My Reported Issues */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#102A43]">
                  {t('issues.my_complaints_title', 'My Reported Issues')}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'ur'
                    ? 'آپ کی جمع کروائی گئی شکایات کی موجودہ صورتحال اور پیش رفت۔'
                    : 'Live status and updates for your submitted campus tickets.'}
                </p>
              </div>
              {totalMyReports > 0 && (
                <Link
                  href="/my-issues"
                  className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1"
                >
                  <span>{lang === 'ur' ? `تمام دیکھیں (${totalMyReports})` : `View all (${totalMyReports})`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {!myIssues || myIssues.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-200/90 space-y-3">
                <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#102A43]">{t('dashboard.no_issues_found', "You haven't reported any issues yet")}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {t('dashboard.no_issues_desc', 'Notice a broken desk, flickering light, or HVAC issue on campus? Submit a quick report to dispatch facilities crews.')}
                  </p>
                </div>
                <Link
                  href="/issues/new"
                  className="inline-flex items-center gap-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('dashboard.report_new_issue', 'Report Your First Issue')}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {myIssues.slice(0, 3).map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    currentUserId={user.id}
                    hasUpvoted={userUpvotedIds.has(issue.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Trending Campus Issues */}
          {trendingIssues && trendingIssues.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-[#102A43]">
                    {lang === 'ur' ? 'جامعہ میں سب سے زیادہ زیرِ بحث مسائل' : 'Trending Campus Issues (Community Priority)'}
                  </h3>
                </div>
                <Link href="/issues?sort=upvotes" className="text-xs font-bold text-[#0D9488] hover:underline">
                  {lang === 'ur' ? 'ٹرینڈنگ فیڈ دیکھیں ←' : 'View Trending Feed →'}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {trendingIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.id}`}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#0D9488]">
                        {issue.building}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#0D9488] transition-colors line-clamp-2">
                        {issue.title}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <ThumbsUp className="w-3 h-3" /> {issue.upvotes_count || 0}
                      </span>
                      <span className="font-medium text-slate-600">{issue.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
