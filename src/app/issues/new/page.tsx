import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Footer } from '@/components/Footer';
import { NewIssueForm } from '@/components/NewIssueForm';
import { Building, Category } from '@/types/database';
import { PlusCircle, ShieldAlert } from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function NewIssuePage() {
  const { user, profile } = await getCurrentUser();
  if (!user) {
    redirect('/login?redirectTo=/issues/new');
    return null;
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  const supabase = await createClient();

  // Fetch reference data for building and categories
  const [{ data: buildings }, { data: categories }] = await Promise.all([
    supabase.from('buildings').select('*').order('name'),
    supabase.from('categories').select('*').order('name'),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DashboardSidebar profile={profile} unreadCount={unreadCount} />

      <div className="lg:pl-64 flex-1 flex flex-col justify-between">
        <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-[#0D9488] mb-1">
              <PlusCircle className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Campus Maintenance Desk
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Submit a Campus Issue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Provide details below or use the 🎙️ Dictate button to speak your report with Whisper AI.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <NewIssueForm
              buildings={(buildings as Building[]) || []}
              categories={(categories as Category[]) || []}
              currentUserId={user.id}
            />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
