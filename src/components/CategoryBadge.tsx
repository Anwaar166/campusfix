import React from 'react';
import { Wifi, Zap, Droplets, FlaskConical, Armchair, HelpCircle } from 'lucide-react';

interface Props {
  category: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'md' }: Props) {
  const getIcon = () => {
    switch (category) {
      case 'IT & Wi-Fi':
        return <Wifi className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />;
      case 'Electrical':
        return <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />;
      case 'Plumbing':
        return <Droplets className="w-3.5 h-3.5 mr-1.5 text-cyan-500" />;
      case 'Lab Equipment':
        return <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />;
      case 'Furniture':
        return <Armchair className="w-3.5 h-3.5 mr-1.5 text-purple-500" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-slate-500" />;
    }
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs font-medium px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-md bg-slate-100 text-slate-800 border border-slate-200 ${sizeClasses}`}>
      {getIcon()}
      <span>{category}</span>
    </span>
  );
}
