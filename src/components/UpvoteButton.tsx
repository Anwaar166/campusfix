'use client';

import React, { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Props {
  issueId: string;
  initialCount: number;
  initialHasUpvoted?: boolean;
  currentUserId?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function UpvoteButton({
  issueId,
  initialCount,
  initialHasUpvoted = false,
  currentUserId,
  size = 'md',
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      router.push(`/login?redirectTo=/issues/${issueId}`);
      return;
    }

    if (loading) return;
    setLoading(true);

    const prevCount = count;
    const prevHasUpvoted = hasUpvoted;

    // Optimistic update
    if (hasUpvoted) {
      setCount((prev) => Math.max(0, prev - 1));
      setHasUpvoted(false);
    } else {
      setCount((prev) => prev + 1);
      setHasUpvoted(true);
    }

    try {
      if (prevHasUpvoted) {
        // Remove upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .delete()
          .eq('issue_id', issueId)
          .eq('user_id', currentUserId);

        if (error) throw error;
      } else {
        // Add upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .insert({
            issue_id: issueId,
            user_id: currentUserId,
          });

        if (error) throw error;
      }
      router.refresh();
    } catch (err) {
      console.error('Failed to toggle upvote:', err);
      // Revert optimistic update
      setCount(prevCount);
      setHasUpvoted(prevHasUpvoted);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-xs py-1 px-2 gap-1',
    md: 'text-sm py-1.5 px-3 gap-1.5',
    lg: 'text-base py-2 px-4 gap-2 font-semibold',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={hasUpvoted ? 'Remove upvote' : 'Upvote issue'}
      className={`inline-flex items-center rounded-lg border transition-all duration-150 ${sizeClasses} ${
        hasUpvoted
          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs hover:bg-indigo-100'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
      }`}
    >
      <ThumbsUp
        className={`${iconSizes} transition-transform ${
          hasUpvoted ? 'fill-indigo-600 text-indigo-600 scale-110' : 'text-slate-400 group-hover:text-slate-600'
        }`}
      />
      <span className="font-semibold">{count}</span>
      <span className="sr-only">Upvotes</span>
    </button>
  );
}
