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
  Sparkles,
  ArrowRight,
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-[#102A43] flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:bg-[#0D9488] transition-all duration-200">
                <Wrench className="w-5 h-5 text-teal-300 group-hover:rotate-12 transition-transform duration-200" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-[#102A43] group-hover:text-[#0D9488] transition-colors">
                  Campus<span className="text-[#0D9488]">Fix</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 -mt-1">
                  Smart Maintenance
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg transition-colors ${
                pathname === '/'
                  ? 'text-[#102A43] font-bold bg-slate-100'
                  : 'hover:text-[#102A43] hover:bg-slate-50'
              }`}
            >
              Home
            </Link>
            <Link
              href="/issues"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname.startsWith('/issues') && pathname !== '/issues/new'
                  ? 'text-[#0D9488] font-bold bg-teal-50'
                  : 'hover:text-[#102A43] hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4 text-slate-400" />
              Campus Feed
            </Link>
            <Link
              href="/#how-it-works"
              className="px-3 py-2 rounded-lg hover:text-[#102A43] hover:bg-slate-50 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#features"
              className="px-3 py-2 rounded-lg hover:text-[#102A43] hover:bg-slate-50 transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#about"
              className="px-3 py-2 rounded-lg hover:text-[#102A43] hover:bg-slate-50 transition-colors"
            >
              About
            </Link>

            {initialProfile && (
              <>
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    pathname === '/dashboard'
                      ? 'text-[#102A43] font-bold bg-slate-100'
                      : 'hover:text-[#102A43] hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  Dashboard
                </Link>
              </>
            )}

            {isAdminOrStaff && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/admin')
                    ? 'bg-[#102A43] text-white font-bold'
                    : 'text-[#102A43] hover:bg-slate-100 font-semibold'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Admin Center
              </Link>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {initialProfile ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/issues/new"
                  className="inline-flex items-center gap-1.5 bg-[#0D9488] hover:bg-[#0f766e] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-xs hover:shadow-md hover:shadow-teal-500/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  Report Issue
                </Link>

                {/* Notifications Bell */}
                <Link
                  href="/notifications"
                  aria-label="View notifications"
                  className="relative p-2 rounded-xl text-slate-500 hover:text-[#102A43] hover:bg-slate-100 transition-colors"
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
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#102A43] text-teal-300 font-bold text-xs flex items-center justify-center">
                      {initialProfile.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left hidden lg:block pr-1">
                      <div className="text-xs font-bold text-[#102A43] leading-tight">
                        {initialProfile.full_name?.split(' ')[0] || 'User'}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-[#0D9488]">
                        {initialProfile.role}
                      </div>
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{initialProfile.full_name}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{initialProfile.department || 'Campus Member'}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </Link>
                      <Link
                        href="/my-issues"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-slate-400" />
                        My Reported Issues
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        Profile Settings
                      </Link>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-[#102A43] hover:text-[#0D9488] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/issues/new"
                  className="inline-flex items-center gap-1.5 bg-[#0D9488] hover:bg-[#0f766e] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-xs hover:shadow-md hover:shadow-teal-500/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            {initialProfile && (
              <Link
                href="/notifications"
                className="relative p-2 text-slate-600 hover:text-slate-900"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            href="/issues"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Campus Feed
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            How It Works
          </Link>
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Features
          </Link>
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            About
          </Link>

          {initialProfile ? (
            <div className="pt-3 border-t border-slate-100 space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                href="/my-issues"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                My Reported Issues
              </Link>
              {isAdminOrStaff && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-600 bg-amber-50"
                >
                  Admin Facilities Center
                </Link>
              )}
              <Link
                href="/issues/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center mt-3 bg-[#0D9488] text-white py-2.5 rounded-xl font-bold text-sm"
              >
                Report an Issue
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full text-left px-3 py-2 text-sm text-rose-600 font-semibold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 text-sm font-semibold text-[#102A43] border border-slate-200 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                href="/issues/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center bg-[#0D9488] text-white py-2.5 rounded-xl font-bold text-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
