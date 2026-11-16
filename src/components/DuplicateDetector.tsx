'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { IssueWithCounts } from '@/types/database';
import { AlertTriangle, ThumbsUp, ArrowRight, ExternalLink } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';

interface Props {
  building: string;
  category: string;
  title: string;
}

export function DuplicateDetector({ building, category, title }: Props) {
  const [matches, setMatches] = useState<IssueWithCounts[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Only search if building is selected or title has at least 3 characters
    if (!building && title.length < 3) {
      setMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('issues_with_counts')
          .select('*')
          .in('status', ['Open', 'In Progress'])
          .limit(4);

        if (building) {
          query = query.eq('building', building);
        }
        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        // If title query provided, filter on client or rank
        if (data && title.length >= 3) {
          const lowerTitle = title.toLowerCase();
          const words = lowerTitle.split(' ').filter((w) => w.length > 2);
          const ranked = data.filter((item) => {
            const itemText = (item.title + ' ' + item.description).toLowerCase();
            return words.some((w) => itemText.includes(w));
          });
          setMatches(ranked.length > 0 ? ranked : data.slice(0, 3));
        } else {
          setMatches(data || []);
        }
      } catch (err) {
        console.error('Error checking duplicate issues:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [building, category, title, supabase]);

  if (matches.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 space-y-3">
      <div className="flex items-start gap-2.5 text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold">
            Similar Open Issues Detected in {building || 'this category'}
          </h4>
          <p className="text-xs text-amber-800">
            Someone may have already reported this! Review below and upvote an existing report instead of creating a duplicate.
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {matches.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg p-3 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-amber-400 transition-colors"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} size="sm" />
                <UrgencyBadge urgency={item.urgency} size="sm" />
                <span className="text-xs text-slate-500 font-medium">
                  {item.room_location}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {item.title}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                <ThumbsUp className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                {item.upvotes_count} upvotes
              </span>
              <Link
                href={`/issues/${item.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-md border border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <span>View & Upvote</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
