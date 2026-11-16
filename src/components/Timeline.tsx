import React from 'react';
import { IssueUpdate } from '@/types/database';
import {
  Clock,
  MessageSquare,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CopyCheck,
  RotateCcw,
  UserCheck,
  Shield,
} from 'lucide-react';

interface Props {
  updates: IssueUpdate[];
}

export function Timeline({ updates }: Props) {
  if (!updates || updates.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No updates recorded yet.
      </div>
    );
  }

  const getUpdateConfig = (type: string) => {
    switch (type) {
      case 'created':
        return {
          icon: <Clock className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-100 border-blue-200',
          title: 'Issue Created',
        };
      case 'status_change':
        return {
          icon: <Wrench className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-100 border-amber-200',
          title: 'Status Updated',
        };
      case 'assignment':
        return {
          icon: <UserCheck className="w-4 h-4 text-indigo-600" />,
          bg: 'bg-indigo-100 border-indigo-200',
          title: 'Maintenance Assigned',
        };
      case 'resolution':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-100 border-emerald-200',
          title: 'Work Completed & Resolved',
        };
      case 'rejection':
        return {
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-100 border-rose-200',
          title: 'Issue Rejected',
        };
      case 'priority_change':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          bg: 'bg-orange-100 border-orange-200',
          title: 'Urgency Priority Adjusted',
        };
      case 'duplicate_linked':
        return {
          icon: <CopyCheck className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-100 border-purple-200',
          title: 'Linked as Duplicate',
        };
      case 'reopened':
        return {
          icon: <RotateCcw className="w-4 h-4 text-sky-600" />,
          bg: 'bg-sky-100 border-sky-200',
          title: 'Issue Reopened',
        };
      case 'comment':
      default:
        return {
          icon: <MessageSquare className="w-4 h-4 text-slate-600" />,
          bg: 'bg-slate-100 border-slate-200',
          title: 'Official Note / Comment',
        };
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
      {updates.map((update) => {
        const config = getUpdateConfig(update.update_type);
        const dateStr = new Date(update.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={update.id} className="relative group">
            {/* Dot Icon */}
            <div
              className={`absolute -left-6 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${config.bg} shadow-2xs`}
            >
              {config.icon}
            </div>

            {/* Content card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 group-hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">
                    {config.title}
                  </span>
                  {update.author && (
                    <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      <Shield className="w-3 h-3 mr-1 text-indigo-500" />
                      {update.author.full_name} ({update.author.role})
                    </span>
                  )}
                </div>
                <time className="text-[11px] text-slate-600">{dateStr}</time>
              </div>

              {/* Message text */}
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {update.message}
              </p>

              {/* Transition badges if old_value / new_value present */}
              {(update.old_value || update.new_value) && (
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  {update.old_value && (
                    <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 line-through">
                      {update.old_value}
                    </span>
                  )}
                  {update.old_value && update.new_value && (
                    <span className="text-slate-600">→</span>
                  )}
                  {update.new_value && (
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                      {update.new_value}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
