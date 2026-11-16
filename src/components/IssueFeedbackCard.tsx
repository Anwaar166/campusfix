'use client';

import React, { useState } from 'react';
import { Star, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { IssueFeedback } from '@/types/database';
import { useRouter } from 'next/navigation';

interface Props {
  issueId: string;
  userId: string;
  initialFeedback?: IssueFeedback | null;
}

export function IssueFeedbackCard({ issueId, userId, initialFeedback }: Props) {
  const [feedback, setFeedback] = useState<IssueFeedback | null>(initialFeedback || null);
  const [rating, setRating] = useState(initialFeedback?.rating || 5);
  const [isFixed, setIsFixed] = useState(initialFeedback ? initialFeedback.is_fixed : true);
  const [comment, setComment] = useState(initialFeedback?.comment || '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(initialFeedback));
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('issue_feedback')
        .insert({
          issue_id: issueId,
          user_id: userId,
          rating,
          is_fixed: isFixed,
          comment: comment.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setFeedback(data);
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to save feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && feedback) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-900 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <h4 className="font-bold text-sm">Resolution Feedback Submitted</h4>
        </div>
        <p className="text-xs text-emerald-800">
          Thank you for verifying! Your rating: {feedback.rating}/5 stars • Confirmed Fixed:{' '}
          {feedback.is_fixed ? 'Yes' : 'No'}
        </p>
        {feedback.comment && (
          <p className="text-xs italic bg-white/70 p-2.5 rounded-lg border border-emerald-200">
            &ldquo;{feedback.comment}&rdquo;
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4 shadow-xs"
    >
      <div className="flex items-center gap-2 text-indigo-900">
        <Star className="w-5 h-5 text-indigo-600 fill-indigo-600" />
        <h4 className="font-bold text-sm sm:text-base">Reporter Resolution Feedback</h4>
      </div>
      <p className="text-xs text-slate-600">
        This issue was marked resolved. As the reporter, please verify whether the maintenance team completed the repair to satisfaction.
      </p>

      {/* Is it actually fixed? */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700">
          Is the issue completely fixed?
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
            <input
              type="radio"
              name="is_fixed"
              checked={isFixed === true}
              onChange={() => setIsFixed(true)}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            Yes, it is resolved
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
            <input
              type="radio"
              name="is_fixed"
              checked={isFixed === false}
              onChange={() => setIsFixed(false)}
              className="text-rose-600 focus:ring-rose-500"
            />
            No, still broken / incomplete
          </label>
        </div>
      </div>

      {/* Star rating */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700">
          Maintenance Experience Rating:
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
          <span className="text-xs font-bold text-slate-700 ml-2">
            {rating} of 5 Stars
          </span>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">
          Comments / Note (Optional):
        </label>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="e.g. Technician arrived quickly, work was clean and functional."
          className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
      >
        {loading ? 'Submitting...' : 'Submit Resolution Feedback'}
      </button>
    </form>
  );
}
