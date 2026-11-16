'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send } from 'lucide-react';

interface Props {
  issueId: string;
  currentUserId: string;
}

export function AddCommentBox({ issueId, currentUserId }: Props) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('issue_updates').insert({
        issue_id: issueId,
        author_id: currentUserId,
        update_type: 'comment',
        message: comment.trim(),
        is_internal: false,
      });

      if (error) throw error;
      setComment('');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        <span>Add a public comment or update</span>
      </div>
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add helpful details, updates, or report changes in condition..."
        className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !comment.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
}
