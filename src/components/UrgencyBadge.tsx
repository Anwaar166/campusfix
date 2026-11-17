import React from 'react';
import { IssueUrgency } from '@/types/database';
import { AlertCircle, AlertTriangle, Flame, Info } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Props {
  urgency: IssueUrgency;
  size?: 'sm' | 'md' | 'lg';
}

export function UrgencyBadge({ urgency, size = 'md' }: Props) {
  const { t } = useTranslation();

  const configs: Record<IssueUrgency, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    'Low': {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      icon: <Info className="w-3.5 h-3.5 mx-1 text-slate-500" />
    },
    'Medium': {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-800 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
      icon: <AlertCircle className="w-3.5 h-3.5 mx-1 text-sky-600" />
    },
    'High': {
      bg: 'bg-amber-100 dark:bg-amber-950/40',
      text: 'text-amber-900 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
      icon: <AlertTriangle className="w-3.5 h-3.5 mx-1 text-amber-700" />
    },
    'Critical': {
      bg: 'bg-rose-100 dark:bg-rose-950/40',
      text: 'text-rose-900 dark:text-rose-300',
      border: 'border-rose-300 dark:border-rose-800',
      icon: <Flame className="w-3.5 h-3.5 mx-1 text-rose-600 animate-bounce" />
    }
  };

  const urgencyKeyMap: Record<IssueUrgency, string> = {
    'Low': 'urgency.low',
    'Medium': 'urgency.medium',
    'High': 'urgency.high',
    'Critical': 'urgency.critical'
  };

  const config = configs[urgency] || configs['Low'];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-bold px-3 py-1.5'
  }[size];

  const label = t(urgencyKeyMap[urgency] || 'urgency.low', urgency);

  return (
    <span className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      {config.icon}
      <span>{label}</span>
    </span>
  );
}
