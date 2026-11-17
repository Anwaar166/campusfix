import React from 'react';
import { IssueStatus } from '@/types/database';
import { Clock, Wrench, CheckCircle2, Archive, XCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Props {
  status: IssueStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const { t } = useTranslation();

  const statusKeyMap: Record<string, string> = {
    'Open': 'statuses.open',
    'Under Review': 'statuses.under_review',
    'In Progress': 'statuses.in_progress',
    'Resolved': 'statuses.resolved',
    'Closed': 'statuses.closed',
    'Rejected': 'statuses.rejected',
  };

  const configs: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    'Open': {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Clock className="w-3.5 h-3.5 mx-1 text-blue-600" />
    },
    'Under Review': {
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      text: 'text-cyan-800 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-800',
      icon: <Clock className="w-3.5 h-3.5 mx-1 text-cyan-600" />
    },
    'In Progress': {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <Wrench className="w-3.5 h-3.5 mx-1 text-amber-600 animate-pulse" />
    },
    'Resolved': {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mx-1 text-emerald-600" />
    },
    'Closed': {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      icon: <Archive className="w-3.5 h-3.5 mx-1 text-slate-500" />
    },
    'Rejected': {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: <XCircle className="w-3.5 h-3.5 mx-1 text-rose-500" />
    }
  };

  const config = configs[status] || configs['Open'];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
    lg: 'text-sm font-semibold px-3 py-1.5'
  }[size];

  const translationKey = statusKeyMap[status] || 'statuses.open';
  const label = t(translationKey, status);

  return (
    <span className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      {config.icon}
      <span>{label}</span>
    </span>
  );
}
