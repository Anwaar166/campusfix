'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wrench,
  PlusCircle,
  Bell,
  LayoutDashboard,
  ShieldAlert,
  User,
  LogOut,
  Menu,
  X,
  Compass,
  Building2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

interface Props {
  initialProfile: Profile | null;
  unreadCount?: number;
}

export function Navbar({ initialProfile, unreadCount = 0 }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isAdminOrStaff = initialProfile?.role === 'admin' || initialProfile?.role === 'maintenance';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Campus<span className="text-indigo-600">Fix</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600 -mt-1">
                  Smart Campus Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/issues"
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/issues') && pathname !== '/issues/new'
                    ? 'bg-slate-100 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Compass className="w-4 h-4 text-slate-400" />
                Campus Feed
              </Link>

              {initialProfile && (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      pathname === '/dashboard'
                        ? 'bg-slate-100 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    Dashboard
                  </Link>
                  <Link
                    href="/my-issues"
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      pathname === '/my-issues'
                        ? 'bg-slate-100 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-slate-400" />
                    My Reports
                  </Link>
                </>
              )}

              {isAdminOrStaff && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/admin')
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-indigo-600 hover:bg-indigo-50/70'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  Admin Center
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/issues/new"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </Link>

            {initialProfile ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {/* Notification Bell */}
                <Link
                  href="/notifications"
                  aria-label="View notifications"
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User menu dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    aria-label="Toggle user menu"
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {initialProfile.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-xs font-semibold text-slate-800 leading-tight">
                        {initialProfile.full_name}
                      </div>
                      <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                        {initialProfile.role}
                      </div>
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">{initialProfile.full_name}</p>
                        <p className="text-xs text-slate-600 truncate">{initialProfile.email}</p>
                        <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {initialProfile.role} role
                        </span>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                      {isAdminOrStaff && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                        >
                          <ShieldAlert className="w-4 h-4 text-indigo-500" />
                          Admin Portal
                        </Link>
                      )}
                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/issues/new"
              className="p-2 rounded-lg bg-indigo-600 text-white"
              aria-label="Report Issue"
            >
              <PlusCircle className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <Link
            href="/issues"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-800 font-medium hover:bg-slate-100"
          >
            <Compass className="w-5 h-5 text-indigo-500" />
            Campus Feed
          </Link>
          {initialProfile && (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-800 font-medium hover:bg-slate-100"
              >
                <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                Dashboard
              </Link>
              <Link
                href="/my-issues"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-800 font-medium hover:bg-slate-100"
              >
                <Building2 className="w-5 h-5 text-indigo-500" />
                My Reports
              </Link>
              <Link
                href="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-800 font-medium hover:bg-slate-100"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-500" />
                  Notifications
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-800 font-medium hover:bg-slate-100"
              >
                <User className="w-5 h-5 text-indigo-500" />
                Profile ({initialProfile.full_name})
              </Link>
            </>
          )}

          {isAdminOrStaff && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-indigo-600 font-semibold bg-indigo-50"
            >
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Admin Center
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100">
            {initialProfile ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-rose-600 font-medium hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
