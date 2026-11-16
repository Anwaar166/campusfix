import React from 'react';
import { IssueStatus } from '@/types/database';
import { Clock, Wrench, CheckCircle2, Archive, XCircle } from 'lucide-react';

interface Props {
  status: IssueStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const configs: Record<IssueStatus, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    'Open': {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
    },
    'In Progress': {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <Wrench className="w-3.5 h-3.5 mr-1 text-amber-600 animate-pulse" />
    },
    'Resolved': {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
    },
    'Closed': {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: <Archive className="w-3.5 h-3.5 mr-1 text-slate-500" />
    },
    'Rejected': {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
    }
  };

  const config = configs[status] || configs['Open'];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
    lg: 'text-sm font-semibold px-3 py-1.5'
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      {config.icon}
      <span>{status}</span>
    </span>
  );
}
