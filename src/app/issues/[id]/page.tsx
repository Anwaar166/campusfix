import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import { CategoryBadge } from '@/components/CategoryBadge';
import { UpvoteButton } from '@/components/UpvoteButton';
import { Timeline } from '@/components/Timeline';
import { AddCommentBox } from '@/components/AddCommentBox';
import { IssueFeedbackCard } from '@/components/IssueFeedbackCard';
import { AdminTriagePanel } from '@/components/AdminTriagePanel';
import { IssueReporterActions } from '@/components/IssueReporterActions';
import {
  IssueWithCounts,
  IssueUpdate,
  MaintenanceTeam,
  Profile,
  IssueFeedback,
} from '@/types/database';
import {
  MapPin,
  Calendar,
  User,
  ShieldAlert,
  CopyCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

export const revalidate = 0; // dynamic

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function IssueDetailPage({ params }: Props) {
  const { id } = await params;
  const { user, profile } = await getCurrentUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  // Server-side authentication gate
  if (!user) {
    const { FeedAuthGate } = await import('@/components/FeedAuthGate');
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

  // 1. Fetch issue details from view
  const { data: issue, error } = await supabase
    .from('issues_with_counts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !issue) {
    notFound();
  }

  // 2. Fetch canonical issue if this is a duplicate
  let canonicalIssue: IssueWithCounts | null = null;
  if (issue.duplicate_of) {
    const { data: canData } = await supabase
      .from('issues_with_counts')
      .select('*')
      .eq('id', issue.duplicate_of)
      .single();
    if (canData) canonicalIssue = canData as IssueWithCounts;
  }

  // 3. Fetch chronological updates / timeline
  const { data: updates } = await supabase
    .from('issue_updates')
    .select(`
      *,
      author:profiles!issue_updates_author_id_fkey(*)
    `)
    .eq('issue_id', id)
    .order('created_at', { ascending: true });

  // 4. Fetch upvote state for current user
  let hasUpvoted = false;
  if (user) {
    const { data: vote } = await supabase
      .from('issue_upvotes')
      .select('id')
      .eq('issue_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    hasUpvoted = Boolean(vote);
  }

  // 5. Fetch feedback if resolved/closed
  let existingFeedback: IssueFeedback | null = null;
  if (issue.status === 'Resolved' || issue.status === 'Closed') {
    const { data: fb } = await supabase
      .from('issue_feedback')
      .select('*')
      .eq('issue_id', id)
      .maybeSingle();
    existingFeedback = fb as IssueFeedback | null;
  }

  // 6. Fetch teams and technicians for admin triage if privileged
  const isAdminOrStaff = profile?.role === 'admin' || profile?.role === 'maintenance';
  let maintenanceTeams: MaintenanceTeam[] = [];
  let technicians: Profile[] = [];

  if (isAdminOrStaff) {
    const [{ data: tms }, { data: techs }] = await Promise.all([
      supabase.from('maintenance_teams').select('*').order('name'),
      supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'maintenance'])
        .order('full_name'),
    ]);
    maintenanceTeams = (tms as MaintenanceTeam[]) || [];
    technicians = (techs as Profile[]) || [];
  }

  const isReporter = user?.id === issue.created_by;
  const isReporterAndOpen = isReporter && issue.status === 'Open';

  const formattedCreated = new Date(issue.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/issues"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Campus Feed</span>
          </Link>

          {isReporterAndOpen && <IssueReporterActions issue={issue as IssueWithCounts} />}
        </div>

        {/* Duplicate Banner if linked to canonical issue */}
        {canonicalIssue && (
          <div className="rounded-2xl border border-purple-300 bg-purple-50/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CopyCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-purple-950">
                  Duplicate Issue Notice
                </h4>
                <p className="text-xs text-purple-800 mt-0.5">
                  This report has been identified as a duplicate of an existing canonical issue. Work and updates are tracked on the primary ticket.
                </p>
              </div>
            </div>
            <Link
              href={`/issues/${canonicalIssue.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-purple-700 font-bold text-xs rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors shrink-0 shadow-2xs"
            >
              <span>View Canonical Ticket</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Resolution Banner if resolved */}
        {issue.status === 'Resolved' && issue.resolution_notes && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Official Resolution Summary</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-emerald-200">
              {issue.resolution_notes}
            </p>
          </div>
        )}

        {/* Rejection Banner if rejected */}
        {issue.status === 'Rejected' && issue.rejection_reason && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50/90 p-5 space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Issue Rejected Reason</span>
            </div>
            <p className="text-xs sm:text-sm text-rose-950 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-rose-200">
              {issue.rejection_reason}
            </p>
          </div>
        )}

        {/* Main Issue Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Badges + Upvote bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={issue.category} size="md" />
              <UrgencyBadge urgency={issue.urgency} size="md" />
              <StatusBadge status={issue.status} size="md" />
            </div>

            <UpvoteButton
              issueId={issue.id}
              initialCount={issue.upvotes_count || 0}
              initialHasUpvoted={hasUpvoted}
              currentUserId={user?.id}
              size="md"
            />
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {issue.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-700 whitespace-pre-line leading-relaxed">
              {issue.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="space-y-1">
              <span className="text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                Location
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  {issue.building} • {issue.room_location}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                Submitted By
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {issue.reporter_name || 'Campus Member'} ({issue.reporter_role || 'student'})
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-600 uppercase font-bold tracking-wider text-[10px]">
                Date Reported
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{formattedCreated}</span>
              </div>
            </div>
          </div>

          {/* Assigned Team & Technician if present */}
          {(issue.assigned_team_name || issue.assignee_name) && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-700">Maintenance Assignment:</span>
                <span className="font-bold text-slate-900">
                  {issue.assigned_team_name || 'Campus Operations'}
                </span>
                {issue.assignee_name && (
                  <span className="text-slate-600">
                    (Lead Tech: {issue.assignee_name})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reporter Feedback Card if Resolved/Closed */}
        {(issue.status === 'Resolved' || issue.status === 'Closed') && user && (
          <IssueFeedbackCard
            issueId={issue.id}
            userId={user.id}
            initialFeedback={existingFeedback}
          />
        )}

        {/* Admin Triage & Management Panel (Only visible to admin / maintenance staff) */}
        {isAdminOrStaff && user && (
          <AdminTriagePanel
            issue={issue as IssueWithCounts}
            teams={maintenanceTeams}
            technicians={technicians}
            currentUserId={user.id}
          />
        )}

        {/* Public Timeline & Audit History */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">
                Issue Timeline & Auditable History
              </h3>
              <p className="text-xs text-slate-500">
                Immutable event stream of submissions, assignments, technician notes, and status changes.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {updates?.length || 0} events
            </span>
          </div>

          <Timeline updates={(updates as IssueUpdate[]) || []} />

          {/* Add comment box for signed in campus users */}
          {user && <AddCommentBox issueId={issue.id} currentUserId={user.id} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
