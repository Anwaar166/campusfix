'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  FileText,
  Activity,
  Bell,
  BarChart3,
  Bot,
  Eye,
  User,
  Settings,
  LogOut,
  Wrench,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  profile: Profile | null;
  unreadCount?: number;
}

export function DashboardSidebar({ profile, unreadCount = 0 }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Campus Feed', href: '/issues', icon: Compass },
    { label: 'Report an Issue', href: '/issues/new', icon: PlusCircle },
    { label: 'My Complaints', href: '/my-issues', icon: FileText },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'My Profile', href: '/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Admin Overview', href: '/admin', icon: ShieldAlert },
    { label: 'Triage Issues', href: '/admin/issues', icon: Wrench },
    { label: 'Campus Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  const isAdmin = profile?.role === 'admin' || profile?.role === 'maintenance';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#102A43] text-white">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-9 h-9 rounded-xl bg-[#0D9488] flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-white">
              Campus<span className="text-[#0D9488]">Fix</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 -mt-1">
              Portal Workspace
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Card */}
      <div className="p-4 mx-3 my-3 bg-slate-900/80 rounded-2xl border border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-[#102A43] flex items-center justify-center text-white font-black text-sm uppercase shrink-0 border border-teal-400/30">
          {profile?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">
            {profile?.full_name || 'Campus Member'}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 mt-0.5">
            {profile?.role || 'student'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-3 py-1">
          Menu
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-teal-400'}`} />
                <span>{item.label}</span>
              </div>

              {Boolean(item.badge && item.badge > 0) && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin Navigation Section if authorized */}
        {isAdmin && (
          <>
            <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400 px-3 pt-4 pb-1">
              Admin Center
            </div>
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-900 shadow-md font-bold'
                      : 'text-amber-200/80 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/30 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header with Hamburger */}
      <div className="lg:hidden bg-[#102A43] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0D9488] flex items-center justify-center text-white">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-lg text-white">
            Campus<span className="text-[#0D9488]">Fix</span>
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open Navigation Menu"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#102A43] transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30 shadow-xl border-r border-slate-800">
        {sidebarContent}
      </aside>
    </>
  );
}
