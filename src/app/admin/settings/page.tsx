import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AdminNav } from '@/components/AdminNav';
import { AdminSettingsManager } from '@/components/AdminSettingsManager';
import { Building, Category, MaintenanceTeam } from '@/types/database';
import { Settings } from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function AdminSettingsPage() {
  const { user, profile } = await getCurrentUser();
  if (!user || (profile?.role !== 'admin' && profile?.role !== 'maintenance')) {
    redirect('/dashboard');
    return null;
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  const supabase = await createClient();

  const [{ data: buildings }, { data: categories }, { data: teams }] = await Promise.all([
    supabase.from('buildings').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
    supabase.from('maintenance_teams').select('*').order('name'),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Settings className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Administration Config
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Campus Infrastructure Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure approved campus facilities, issue categories, and maintenance dispatch teams.
          </p>
        </div>

        <AdminNav />

        <AdminSettingsManager
          initialBuildings={(buildings as Building[]) || []}
          initialCategories={(categories as Category[]) || []}
          initialTeams={(teams as MaintenanceTeam[]) || []}
        />
      </main>

      <Footer />
    </div>
  );
}
