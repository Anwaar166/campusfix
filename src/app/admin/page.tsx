import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AdminNav } from '@/components/AdminNav';
import { StatusBadge } from '@/components/StatusBadge';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import { IssueWithCounts } from '@/types/database';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Flame,
  ThumbsUp,
} from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function AdminOverviewPage() {
  const { user, profile } = await getCurrentUser();
  if (!user || (profile?.role !== 'admin' && profile?.role !== 'maintenance')) {
    redirect('/dashboard');
    return null;
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  const supabase = await createClient();

  // Fetch all issues for KPIs
  const { data: allIssues } = await supabase
    .from('issues_with_counts')
    .select('*')
    .order('created_at', { ascending: false });

  const issues: IssueWithCounts[] = (allIssues as IssueWithCounts[]) || [];

  const total = issues.length;
  const openCount = issues.filter((i) => i.status === 'Open').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
  const criticalCount = issues.filter((i) => i.urgency === 'Critical' && i.status !== 'Resolved' && i.status !== 'Closed').length;

  // Urgent action items requiring immediate triage (Critical or High with Open status)
  const urgentQueue = issues
    .filter((i) => (i.urgency === 'Critical' || i.urgency === 'High') && i.status === 'Open')
    .slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Facilities Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Maintenance Command Center
            </h1>
          </div>

          <Link
            href="/admin/issues"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
          >
            <Wrench className="w-4 h-4" />
            Launch Full Triage Table
          </Link>
        </div>

        {/* Sub Navigation */}
        <AdminNav />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="text-slate-500 text-xs font-bold">Total Campus Reports</div>
            <div className="text-3xl font-black text-slate-900 mt-2">{total}</div>
            <div className="text-[11px] text-slate-600 mt-1">Across all buildings</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
            <div className="text-rose-700 text-xs font-bold flex items-center justify-between">
              <span>Critical Attention</span>
              <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
            </div>
            <div className="text-3xl font-black text-rose-900 mt-2">{criticalCount}</div>
            <div className="text-[11px] text-rose-600 mt-1">Immediate hazards</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs">
            <div className="text-blue-700 text-xs font-bold flex items-center justify-between">
              <span>Open (Untriaged)</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-blue-900 mt-2">{openCount}</div>
            <div className="text-[11px] text-blue-600 mt-1">Needs crew assignment</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="text-amber-800 text-xs font-bold flex items-center justify-between">
              <span>In Progress</span>
              <Wrench className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-900 mt-2">{inProgressCount}</div>
            <div className="text-[11px] text-amber-700 mt-1">Active technician work</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs col-span-2 lg:col-span-1">
            <div className="text-emerald-700 text-xs font-bold flex items-center justify-between">
              <span>Resolved / Closed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-900 mt-2">{resolvedCount}</div>
            <div className="text-[11px] text-emerald-700 mt-1">Completed repairs</div>
          </div>
        </div>

        {/* Priority Urgent Action Queue */}
        <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Immediate Action Queue (Open High/Critical)
              </h2>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              {urgentQueue.length} pending
            </span>
          </div>

          {urgentQueue.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {urgentQueue.map((item) => (
                <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UrgencyBadge urgency={item.urgency} size="sm" />
                      <StatusBadge status={item.status} size="sm" />
                      <span className="text-xs text-slate-500 font-medium">
                        {item.building} • {item.room_location}
                      </span>
                    </div>
                    <Link
                      href={`/issues/${item.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {item.title}
                    </Link>
                  </div>

                  <Link
                    href={`/issues/${item.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-2xs self-start sm:self-auto shrink-0"
                  >
                    <span>Triage Ticket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-3">
              No urgent high-priority tickets are waiting in the open queue!
            </div>
          )}
        </div>

        {/* Quick Triage Feed Preview */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Latest Campus Tickets
            </h2>
            <Link
              href="/admin/issues"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Open All Issues Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Title & Location</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Assigned Team</th>
                  <th className="py-3 px-3">Upvotes</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.slice(0, 6).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <Link
                        href={`/issues/${item.id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <div className="text-[11px] text-slate-500">
                        {item.building} • {item.room_location}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{item.category}</td>
                    <td className="py-3 px-3">
                      <UrgencyBadge urgency={item.urgency} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.assigned_team_name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {item.upvotes_count || 0}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/issues/${item.id}`}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
