'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, RotateCcw } from 'lucide-react';
import { Building, Category } from '@/types/database';

interface Props {
  buildings: Building[];
  categories: Category[];
}

export function FeedFilters({ buildings, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentBuilding = searchParams.get('building') || '';
  const currentUrgency = searchParams.get('urgency') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    router.push(pathname);
  };

  const hasActiveFilters =
    Boolean(currentSearch) ||
    Boolean(currentCategory) ||
    Boolean(currentBuilding) ||
    Boolean(currentUrgency) ||
    Boolean(currentStatus) ||
    currentSort !== 'newest';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search campus issues by keywords, room number, or description..."
            value={currentSearch}
            onChange={(e) => updateParam('q', e.target.value)}
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="feed-sort-select" className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Sort by:
          </label>
          <select
            id="feed-sort-select"
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="upvotes">Most Upvoted</option>
            <option value="urgency">Highest Urgency</option>
            <option value="oldest">Oldest First</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-rose-600 px-2.5 py-2 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
        <select
          value={currentCategory}
          onChange={(e) => updateParam('category', e.target.value)}
          aria-label="Filter by category"
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={currentBuilding}
          onChange={(e) => updateParam('building', e.target.value)}
          aria-label="Filter by building"
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name} ({b.code})
            </option>
          ))}
        </select>

        <select
          value={currentUrgency}
          onChange={(e) => updateParam('urgency', e.target.value)}
          aria-label="Filter by urgency"
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Urgencies</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={currentStatus}
          onChange={(e) => updateParam('status', e.target.value)}
          aria-label="Filter by status"
          className="text-xs rounded-lg border border-slate-200 px-2.5 py-2 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
    </div>
  );
}
