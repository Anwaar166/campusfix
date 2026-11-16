'use client';

import React from 'react';
import { IssueWithCounts } from '@/types/database';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  issues: IssueWithCounts[];
}

export function AnalyticsCharts({ issues }: Props) {
  // 1. KPI Calculations
  const total = issues.length;
  const openCount = issues.filter((i) => i.status === 'Open').length;
  const inProgressCount = issues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'Resolved').length;
  const closedCount = issues.filter((i) => i.status === 'Closed').length;
  const rejectedCount = issues.filter((i) => i.status === 'Rejected').length;

  // Resolution times in hours
  const completedIssues = issues.filter(
    (i) => i.resolved_at && (i.status === 'Resolved' || i.status === 'Closed')
  );

  const resolutionHours = completedIssues.map((i) => {
    const start = new Date(i.created_at).getTime();
    const end = new Date(i.resolved_at!).getTime();
    return Math.max(0.5, (end - start) / (1000 * 60 * 60));
  });

  const avgHours =
    resolutionHours.length > 0
      ? (
          resolutionHours.reduce((acc, h) => acc + h, 0) /
          resolutionHours.length
        ).toFixed(1)
      : 'N/A';

  const sortedHours = [...resolutionHours].sort((a, b) => a - b);
  const medianHours =
    sortedHours.length > 0
      ? sortedHours[Math.floor(sortedHours.length / 2)].toFixed(1)
      : 'N/A';

  // 2. Breakdown by Category
  const categoryMap: Record<string, number> = {};
  issues.forEach((i) => {
    categoryMap[i.category] = (categoryMap[i.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  // 3. Breakdown by Building
  const buildingMap: Record<string, number> = {};
  issues.forEach((i) => {
    buildingMap[i.building] = (buildingMap[i.building] || 0) + 1;
  });
  const buildingData = Object.entries(buildingMap).sort((a, b) => b[1] - a[1]);

  // 4. Breakdown by Urgency
  const urgencyCounts = {
    Critical: issues.filter((i) => i.urgency === 'Critical').length,
    High: issues.filter((i) => i.urgency === 'High').length,
    Medium: issues.filter((i) => i.urgency === 'Medium').length,
    Low: issues.filter((i) => i.urgency === 'Low').length,
  };

  // 5. Top Upvoted issues
  const topUpvoted = [...issues]
    .sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0))
    .slice(0, 5);

  // CSV Export handler
  const exportToCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Category',
      'Building',
      'Location',
      'Urgency',
      'Status',
      'Upvotes',
      'Reporter',
      'Assigned Team',
      'Created At',
      'Resolved At',
    ];

    const rows = issues.map((i) => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      i.category,
      `"${i.building.replace(/"/g, '""')}"`,
      `"${i.room_location.replace(/"/g, '""')}"`,
      i.urgency,
      i.status,
      i.upvotes_count || 0,
      `"${(i.reporter_name || '').replace(/"/g, '""')}"`,
      `"${(i.assigned_team_name || '').replace(/"/g, '""')}"`,
      i.created_at,
      i.resolved_at || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campusfix_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
            <span>Total Reports</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{total}</div>
          <div className="text-[11px] text-slate-600 mt-1">Campus wide</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="text-blue-700 text-xs font-semibold flex items-center justify-between">
            <span>Open (New)</span>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-2">{openCount}</div>
          <div className="text-[11px] text-blue-600 mt-1">Awaiting review</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="text-amber-800 text-xs font-semibold flex items-center justify-between">
            <span>In Progress</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{inProgressCount}</div>
          <div className="text-[11px] text-amber-700 mt-1">Work underway</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="text-emerald-700 text-xs font-semibold flex items-center justify-between">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">{resolvedCount + closedCount}</div>
          <div className="text-[11px] text-emerald-700 mt-1">{resolvedCount} active • {closedCount} closed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-600 text-xs font-semibold flex items-center justify-between">
            <span>Avg Resolution</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {avgHours !== 'N/A' ? `${avgHours}h` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">First created to fix</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-600 text-xs font-semibold flex items-center justify-between">
            <span>Median Fix</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {medianHours !== 'N/A' ? `${medianHours}h` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">Median completed</div>
        </div>
      </div>

      {/* Export Button Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Institutional Facilities Analytics</h3>
          <p className="text-xs text-slate-500">
            Real-time aggregate reporting for campus operations, resource planning, and SLA tracking.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors shadow-2xs"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* Two Column Grid for Visual Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Issues by Category
            </h4>
            <span className="text-xs text-slate-600 font-medium">{categoryData.length} active categories</span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryData.map(([name, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{name}</span>
                    <span className="text-slate-500">{count} issues ({pct}%)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgency Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              Urgency Severity Distribution
            </h4>
            <span className="text-xs text-slate-600 font-medium">Triage Priority</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-xs font-bold text-rose-800">Critical Severity</div>
              <div className="text-xl font-black text-rose-900 mt-1">{urgencyCounts.Critical}</div>
              <div className="text-[11px] text-rose-600 mt-0.5">
                {total > 0 ? Math.round((urgencyCounts.Critical / total) * 100) : 0}% of all issues
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xs font-bold text-amber-900">High Urgency</div>
              <div className="text-xl font-black text-amber-900 mt-1">{urgencyCounts.High}</div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                {total > 0 ? Math.round((urgencyCounts.High / total) * 100) : 0}% of all issues
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
              <div className="text-xs font-bold text-sky-800">Medium Urgency</div>
              <div className="text-xl font-black text-sky-900 mt-1">{urgencyCounts.Medium}</div>
              <div className="text-[11px] text-sky-600 mt-0.5">
                {total > 0 ? Math.round((urgencyCounts.Medium / total) * 100) : 0}% of all issues
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200">
              <div className="text-xs font-bold text-slate-700">Low Urgency</div>
              <div className="text-xl font-black text-slate-800 mt-1">{urgencyCounts.Low}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                {total > 0 ? Math.round((urgencyCounts.Low / total) * 100) : 0}% of all issues
              </div>
            </div>
          </div>
        </div>

        {/* Building Hotspots */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Campus Building Hotspots
            </h4>
            <span className="text-xs text-slate-600 font-medium">By report volume</span>
          </div>

          <div className="space-y-3 pt-2">
            {buildingData.slice(0, 5).map(([bldName, count]) => {
              const maxCount = buildingData[0]?.[1] || 1;
              const barWidth = Math.round((count / maxCount) * 100);
              return (
                <div key={bldName} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span className="truncate pr-2">{bldName}</span>
                    <span className="text-slate-500 font-mono shrink-0">{count} reports</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Community Supported (Most Upvoted) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-indigo-600" />
              Highest Community Priority (Top Upvoted)
            </h4>
            <span className="text-xs text-slate-600 font-medium">Community impact</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topUpvoted.map((issue) => (
              <div key={issue.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/issues/${issue.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                  >
                    {issue.title}
                  </Link>
                  <p className="text-[11px] text-slate-500 truncate">
                    {issue.building} • {issue.status}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md shrink-0">
                  <ThumbsUp className="w-3 h-3 text-indigo-600" />
                  <span>{issue.upvotes_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
