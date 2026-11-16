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
    sm: 'text-xs py-1 px-2.5 gap-1.5 rounded-lg',
    md: 'text-xs font-bold py-2 px-3 gap-1.5 rounded-xl',
    lg: 'text-sm font-bold py-2.5 px-4 gap-2 rounded-xl',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  }[size];

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={hasUpvoted ? 'Remove upvote' : 'Upvote issue'}
      className={`inline-flex items-center justify-center border transition-all duration-200 cursor-pointer ${sizeClasses} ${
        hasUpvoted
          ? 'bg-teal-50 border-teal-300 text-[#0D9488] shadow-xs hover:bg-teal-100 hover:scale-105 active:scale-95'
          : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-slate-50 hover:text-slate-900 shadow-2xs hover:scale-105 active:scale-95'
      }`}
    >
      <ThumbsUp
        className={`${iconSizes} transition-transform ${
          hasUpvoted ? 'fill-[#0D9488] text-[#0D9488] scale-110' : 'text-slate-400 group-hover:text-slate-600'
        }`}
      />
      <span>{count}</span>
      <span className="sr-only">Upvotes</span>
    </button>
  );
}
