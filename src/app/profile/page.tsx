import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProfileForm } from '@/components/ProfileForm';
import { User } from 'lucide-react';

export const revalidate = 0; // dynamic

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUser();
  if (!user || !profile) {
    redirect('/login?redirectTo=/profile');
    return null;
  }

  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <User className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Account Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Campus Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your display name, campus department, and student/staff identification credentials.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <ProfileForm profile={profile} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
