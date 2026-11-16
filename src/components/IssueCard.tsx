import React from 'react';
import Link from 'next/link';
import { IssueWithCounts } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import { CategoryBadge } from './CategoryBadge';
import { UpvoteButton } from './UpvoteButton';
import { MapPin, User, CopyCheck, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  issue: IssueWithCounts;
  currentUserId?: string | null;
  hasUpvoted?: boolean;
}

export function IssueCard({ issue, currentUserId, hasUpvoted = false }: Props) {
  const formattedDate = new Date(issue.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-teal-400/80 shadow-xs hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 p-5 flex flex-col md:flex-row gap-4 items-start relative hover:-translate-y-0.5">
      {/* Upvote Column on Desktop */}
      <div className="hidden md:flex flex-col items-center pt-1">
        <UpvoteButton
          issueId={issue.id}
          initialCount={issue.upvotes_count || 0}
          initialHasUpvoted={hasUpvoted}
          currentUserId={currentUserId}
          size="md"
        />
      </div>

      {/* Main content body */}
      <div className="flex-1 min-w-0 w-full space-y-3">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={issue.category} size="sm" />
          <UrgencyBadge urgency={issue.urgency} size="sm" />
          <StatusBadge status={issue.status} size="sm" />

          {issue.duplicate_of && (
            <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              <CopyCheck className="w-3 h-3 mr-1 text-slate-500" />
              Duplicate Link
            </span>
          )}

          <span className="text-xs text-slate-500 ml-auto hidden sm:inline">
            Reported {formattedDate}
          </span>
        </div>

        {/* Title */}
        <div>
          <Link
            href={`/issues/${issue.id}`}
            className="text-base sm:text-lg font-bold text-[#102A43] group-hover:text-[#0D9488] transition-colors line-clamp-2"
          >
            {issue.title}
          </Link>
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1">
            {issue.description}
          </p>
        </div>

        {/* Meta details footer */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {/* Location */}
            <div className="flex items-center gap-1 font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-xs">
                {issue.building} • {issue.room_location}
              </span>
            </div>

            {/* Reporter */}
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{issue.reporter_name || 'Anonymous Campus Member'}</span>
            </div>

            {/* Assigned info */}
            {issue.assigned_team_name && (
              <div className="hidden lg:flex items-center gap-1 text-[#0D9488] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{issue.assigned_team_name}</span>
              </div>
            )}
          </div>

          {/* View Details Action Link */}
          <Link
            href={`/issues/${issue.id}`}
            className="inline-flex items-center gap-1 font-semibold text-[#0D9488] hover:text-teal-700 ml-auto"
          >
            <span>View details</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Upvote Bar */}
        <div className="flex md:hidden items-center justify-between pt-2 border-t border-slate-100">
          <UpvoteButton
            issueId={issue.id}
            initialCount={issue.upvotes_count || 0}
            initialHasUpvoted={hasUpvoted}
            currentUserId={currentUserId}
            size="sm"
          />
          <span className="text-xs text-slate-500 sm:hidden">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
