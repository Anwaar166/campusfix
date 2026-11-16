import React, { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { IssueCard } from '@/components/IssueCard';
import { FeedFilters } from '@/components/FeedFilters';
import { FeedAuthGate } from '@/components/FeedAuthGate';
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

  // PART 5: Server-side Authentication Gate for Campus Feed
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar initialProfile={profile} unreadCount={unreadCount} />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex items-center justify-center">
          <FeedAuthGate />
        </main>
        <Footer />
      </div>
    );
  }

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
  if (resolvedParams.sort === 'upvotes') {
    query = query.order('upvotes_count', { ascending: false });
  } else if (resolvedParams.sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    // Default newest
    query = query.order('created_at', { ascending: false });
  }

  const { data: issues, error } = await query;

  // Fetch IDs of issues upvoted by logged-in user
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#0D9488]" />
              <h1 className="text-2xl font-black text-[#102A43] tracking-tight">
                Campus Maintenance Feed
              </h1>
            </div>
            <p className="text-xs text-slate-600">
              Real-time community work orders, repairs, and community-voted priorities.
            </p>
          </div>

          <Link
            href="/issues/new"
            className="inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs hover:shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Issue</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <Suspense fallback={<div className="h-16 bg-white rounded-2xl animate-pulse" />}>
          <FeedFilters
            buildings={buildings || []}
            categories={categories || []}
          />
        </Suspense>

        {/* Issues List */}
        {error ? (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="font-bold text-sm">Error Loading Campus Feed</h3>
            <p className="text-xs">{error.message}</p>
          </div>
        ) : !issues || issues.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
            <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#102A43]">No issues match your filters</h3>
              <p className="text-xs text-slate-500">
                Try clearing or adjusting your search filters to view more results.
              </p>
            </div>
            <Link
              href="/issues"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:underline"
            >
              Reset All Filters
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Showing <strong>{issues.length}</strong> active campus reports</span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  currentUserId={user?.id}
                  hasUpvoted={userUpvotedIds.has(issue.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
