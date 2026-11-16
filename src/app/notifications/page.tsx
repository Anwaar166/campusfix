import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getUnreadNotificationCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { NotificationsList } from '@/components/NotificationsList';
import { NotificationItem } from '@/types/database';

export const revalidate = 0; // dynamic

export default async function NotificationsPage() {
  const { user, profile } = await getCurrentUser();
  if (!user) {
    redirect('/login?redirectTo=/notifications');
    return null;
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar initialProfile={profile} unreadCount={unreadCount} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <NotificationsList
          initialNotifications={(notifications as NotificationItem[]) || []}
          userId={user.id}
        />
      </main>

      <Footer />
    </div>
  );
}
