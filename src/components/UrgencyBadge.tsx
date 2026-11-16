import React from 'react';
import { IssueUrgency } from '@/types/database';
import { AlertCircle, AlertTriangle, Flame, Info } from 'lucide-react';

interface Props {
  urgency: IssueUrgency;
  size?: 'sm' | 'md' | 'lg';
}

export function UrgencyBadge({ urgency, size = 'md' }: Props) {
  const configs: Record<IssueUrgency, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    'Low': {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: <Info className="w-3.5 h-3.5 mr-1 text-slate-500" />
    },
    'Medium': {
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      icon: <AlertCircle className="w-3.5 h-3.5 mr-1 text-sky-600" />
    },
    'High': {
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-300',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-700" />
    },
    'Critical': {
      bg: 'bg-rose-100',
      text: 'text-rose-900',
      border: 'border-rose-300',
      icon: <Flame className="w-3.5 h-3.5 mr-1 text-rose-600 animate-bounce" />
    }
  };

  const config = configs[urgency] || configs['Low'];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
    lg: 'text-sm font-bold px-3 py-1.5'
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      {config.icon}
      <span>{urgency}</span>
    </span>
  );
}
