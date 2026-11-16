import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Footer } from '@/components/Footer';
import { AdminNav } from '@/components/AdminNav';
import { StatusBadge } from '@/components/StatusBadge';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import { FeedFilters } from '@/components/FeedFilters';
import { IssueWithCounts, Building, Category } from '@/types/database';
import { Wrench, ArrowRight, CopyCheck, ThumbsUp } from 'lucide-react';

export const revalidate = 0; // dynamic

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    building?: string;
    urgency?: string;
    status?: string;
    sort?: string;
  }>;
}

export default async function AdminIssuesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const { user, profile } = await getCurrentUser();
  if (!user || (profile?.role !== 'admin' && profile?.role !== 'maintenance')) {
    redirect('/dashboard');
    return null;
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  const supabase = await createClient();

  const [{ data: buildings }, { data: categories }] = await Promise.all([
    supabase.from('buildings').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
  ]);

  let query = supabase.from('issues_with_counts').select('*');

  if (resolvedParams.q) {
    const term = `%${resolvedParams.q}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term},room_location.ilike.${term}`);
  }
  if (resolvedParams.category) query = query.eq('category', resolvedParams.category);
  if (resolvedParams.building) query = query.eq('building', resolvedParams.building);
  if (resolvedParams.urgency) query = query.eq('urgency', resolvedParams.urgency);
  if (resolvedParams.status) query = query.eq('status', resolvedParams.status);

  const sort = resolvedParams.sort || 'newest';
  if (sort === 'upvotes') {
    query = query.order('upvotes_count', { ascending: false });
  } else if (sort === 'urgency') {
    query = query.order('urgency', { ascending: false });
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: issues } = await query;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DashboardSidebar profile={profile} unreadCount={unreadCount} />

      <div className="lg:pl-64 flex-1 flex flex-col justify-between">
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Wrench className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Facilities Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Issue Triage & Work Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, prioritize, assign maintenance crews, and manage verified workflow resolutions.
          </p>
        </div>

        <AdminNav />

        <Suspense fallback={<div className="h-28 bg-white rounded-2xl animate-pulse" />}>
          <FeedFilters
            buildings={(buildings as Building[]) || []}
            categories={(categories as Category[]) || []}
          />
        </Suspense>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              {issues?.length || 0} Total Issues Listed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Title & Problem</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Reporter</th>
                  <th className="py-3.5 px-4">Assigned Crew</th>
                  <th className="py-3.5 px-4">Upvotes</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues?.map((issue: any) => (
                  <tr key={issue.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 line-clamp-1"
                      >
                        {issue.title}
                      </Link>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {issue.description}
                      </p>
                      {issue.duplicate_of && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-1">
                          <CopyCheck className="w-2.5 h-2.5 mr-1" />
                          Duplicate
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      <div>{issue.building}</div>
                      <div className="text-[11px] text-slate-500">{issue.room_location}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <UrgencyBadge urgency={issue.urgency} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={issue.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div>{issue.reporter_name || 'Campus Member'}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{issue.reporter_role}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      {issue.assigned_team_name ? (
                        <div className="font-semibold text-indigo-700">
                          {issue.assigned_team_name}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                        <ThumbsUp className="w-3 h-3 text-indigo-500" />
                        {issue.upvotes_count || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <span>Triage</span>
                        <ArrowRight className="w-3 h-3" />
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
    </div>
  );
}
