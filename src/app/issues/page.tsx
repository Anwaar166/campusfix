import React, { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { IssueCard } from '@/components/IssueCard';
import { FeedFilters } from '@/components/FeedFilters';
import { IssueWithCounts, Building, Category } from '@/types/database';
import { PlusCircle, Compass, Inbox, AlertTriangle } from 'lucide-react';

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

export default async function IssuesFeedPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const { user, profile } = await getCurrentUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;
  const supabase = await createClient();

  // Fetch reference metadata for filters
  const [{ data: buildings }, { data: categories }] = await Promise.all([
    supabase.from('buildings').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
  ]);

  // Construct query on `issues_with_counts` view
  let query = supabase.from('issues_with_counts').select('*');

  // Search filter
  if (resolvedParams.q) {
    const term = `%${resolvedParams.q}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term},room_location.ilike.${term}`);
  }

  // Category filter
  if (resolvedParams.category) {
    query = query.eq('category', resolvedParams.category);
  }

  // Building filter
  if (resolvedParams.building) {
    query = query.eq('building', resolvedParams.building);
  }

  // Urgency filter
  if (resolvedParams.urgency) {
    query = query.eq('urgency', resolvedParams.urgency);
  }

  // Status filter
  if (resolvedParams.status) {
    query = query.eq('status', resolvedParams.status);
  }

  // Sorting
  const sort = resolvedParams.sort || 'newest';
  if (sort === 'upvotes') {
    query = query.order('upvotes_count', { ascending: false }).order('created_at', { ascending: false });
  } else if (sort === 'urgency') {
    // Sort critical and high first, then date
    query = query.order('urgency', { ascending: false }).order('created_at', { ascending: false });
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    // newest default
    query = query.order('created_at', { ascending: false });
  }

  const { data: issues, error } = await query;

  // Fetch user upvotes
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-600" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Campus Issue Feed
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explore public campus reports, upvote existing issues, or submit a new maintenance request.
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

        {/* Filter Bar with Suspense */}
        <Suspense fallback={<div className="h-28 bg-white rounded-2xl animate-pulse" />}>
          <FeedFilters
            buildings={(buildings as Building[]) || []}
            categories={(categories as Category[]) || []}
          />
        </Suspense>

        {/* Results Count Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            Showing <strong className="text-slate-800">{issues?.length || 0}</strong> campus issues
          </span>
          {resolvedParams.q && (
            <span>
              Matching: &ldquo;<strong className="text-slate-800">{resolvedParams.q}</strong>&rdquo;
            </span>
          )}
        </div>

        {/* Issues List */}
        {error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error loading campus issues</p>
              <p className="text-xs mt-0.5">{error.message}</p>
            </div>
          </div>
        ) : issues && issues.length > 0 ? (
          <div className="space-y-3">
            {issues.map((issue: any) => (
              <IssueCard
                key={issue.id}
                issue={issue as IssueWithCounts}
                currentUserId={user?.id}
                hasUpvoted={userUpvotedIds.has(issue.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No issues found matching criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Try clearing your search query or adjusting your category and building filters.
              </p>
            </div>
            <Link
              href="/issues"
              className="inline-block text-xs font-bold text-indigo-600 hover:underline"
            >
              Reset all filters
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
