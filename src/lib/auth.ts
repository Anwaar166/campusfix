import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/types/database';

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { user: null, profile: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile: profile as Profile | null };
  } catch (err) {
    console.error('Error fetching current user:', err);
    return { user: null, profile: null };
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}
