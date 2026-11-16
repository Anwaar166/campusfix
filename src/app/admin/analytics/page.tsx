import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AdminNav } from '@/components/AdminNav';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { IssueWithCounts } from '@/types/database';
import { BarChart3 } from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function AdminAnalyticsPage() {
  const { user, profile } = await getCurrentUser();
  if (!user || (profile?.role !== 'admin' && profile?.role !== 'maintenance')) {
    redirect('/dashboard');
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  const supabase = await createClient();

  const { data: issues } = await supabase
    .from('issues_with_counts')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Facilities Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Campus Operational Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Service-level metrics, resolution benchmarks, building maintenance hotspots, and community trends.
          </p>
        </div>

        <AdminNav />

        <AnalyticsCharts issues={(issues as IssueWithCounts[]) || []} />
      </main>

      <Footer />
    </div>
  );
}
