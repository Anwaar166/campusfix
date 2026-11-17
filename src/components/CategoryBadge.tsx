import React from 'react';
import { Wifi, Zap, Droplets, FlaskConical, Armchair, HelpCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface Props {
  category: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'md' }: Props) {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (category) {
      case 'IT & Wi-Fi':
        return <Wifi className="w-3.5 h-3.5 mx-1 text-indigo-500" />;
      case 'Electrical':
      case 'Electrical & Lighting':
        return <Zap className="w-3.5 h-3.5 mx-1 text-amber-500" />;
      case 'Plumbing':
      case 'Plumbing & Water':
        return <Droplets className="w-3.5 h-3.5 mx-1 text-cyan-500" />;
      case 'HVAC':
      case 'HVAC & Temperature':
        return <FlaskConical className="w-3.5 h-3.5 mx-1 text-teal-500" />;
      case 'Furniture':
      case 'Carpentry & Furniture':
        return <Armchair className="w-3.5 h-3.5 mx-1 text-purple-500" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 mx-1 text-slate-500" />;
    }
  };

  const getTranslatedCategory = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('plumb') || c.includes('water')) return t('categories.plumbing', cat);
    if (c.includes('electr') || c.includes('light')) return t('categories.electrical', cat);
    if (c.includes('hvac') || c.includes('temp') || c.includes('ac')) return t('categories.hvac', cat);
    if (c.includes('it') || c.includes('wi-fi') || c.includes('wifi')) return t('categories.it', cat);
    if (c.includes('carpent') || c.includes('furnit')) return t('categories.carpentry', cat);
    if (c.includes('custod') || c.includes('clean')) return t('categories.custodial', cat);
    if (c.includes('safe') || c.includes('access')) return t('categories.safety', cat);
    return cat;
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs font-medium px-2.5 py-1';

  return (
    <span className={`inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 ${sizeClasses}`}>
      {getIcon()}
      <span>{getTranslatedCategory(category)}</span>
    </span>
  );
}
