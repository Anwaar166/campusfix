import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { IssueCard } from '@/components/IssueCard';
import { IssueWithCounts } from '@/types/database';
import { Building2, PlusCircle, Inbox } from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function MyIssuesPage() {
  const { user, profile } = await getCurrentUser();
  if (!user) {
    redirect('/login?redirectTo=/my-issues');
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  const supabase = await createClient();

  const { data: myIssues } = await supabase
    .from('issues_with_counts')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  // Fetch upvotes
  const { data: upvotes } = await supabase
    .from('issue_upvotes')
    .select('issue_id')
    .eq('user_id', user.id);
  const userUpvotedIds = new Set((upvotes || []).map((u) => u.issue_id));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                My Submitted Reports
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Personal history of all facilities tickets you have opened on CampusFix.
            </p>
          </div>

          <Link
            href="/issues/new"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Report Issue
          </Link>
        </div>

        {myIssues && myIssues.length > 0 ? (
          <div className="space-y-3">
            {myIssues.map((issue: any) => (
              <IssueCard
                key={issue.id}
                issue={issue as IssueWithCounts}
                currentUserId={user.id}
                hasUpvoted={userUpvotedIds.has(issue.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No submissions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t submitted any issues yet. Click below to submit your first report.
            </p>
            <Link
              href="/issues/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
            >
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
