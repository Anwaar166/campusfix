'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Wrench,
  BarChart3,
  Settings,
  AlertTriangle,
} from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Admin Overview', icon: ShieldAlert },
    { href: '/admin/issues', label: 'Triage Issues', icon: Wrench },
    { href: '/admin/analytics', label: 'Operational Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Campus Configuration', icon: Settings },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 flex flex-wrap gap-1">
      {links.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-[#102A43] to-[#0D9488] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
