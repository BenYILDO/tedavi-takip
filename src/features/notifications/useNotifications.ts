import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { registerForPush } from './push';
import { cancelReminders, refreshReminder } from './reminders';

type NotificationData = {
  type?: 'message' | 'reminder';
  patientId?: string;
  staffId?: string;
  staffName?: string;
  staffPhone?: string;
  patientName?: string;
};

/**
 * Bildirim altyapısını kurar: push token kaydı, günlük hatırlatıcı zamanlaması
 * ve bildirime dokununca ilgili ekrana yönlendirme. RootNavigator içinde çağrılır.
 */
export function useNotifications(): void {
  const { profile } = useAuth();
  const router = useRouter();
  const userId = profile?.id ?? null;
  const role = profile?.role ?? null;

  // Bildirime dokunulduğunda yönlendir (ön plan + soğuk başlangıç).
  // Web'de bildirim yanıtı API'leri yoktur; bu etki yalnızca native'de çalışır.
  useEffect(() => {
    if (!role || Platform.OS === 'web') return;

    function handle(response: Notifications.NotificationResponse | null) {
      if (!response) return;
      const data = (response.notification.request.content.data ?? {}) as NotificationData;
      if (data.type === 'reminder') {
        if (role === 'patient') router.push('/(patient)/diary');
        return;
      }
      if (data.type === 'message') {
        if (role === 'patient' && data.staffId) {
          router.push({
            pathname: '/(patient)/thread',
            params: {
              staffId: data.staffId,
              name: data.staffName ?? 'Araştırmacı',
              phone: data.staffPhone ?? '',
            },
          });
        } else if ((role === 'admin' || role === 'researcher') && data.patientId) {
          router.push({
            pathname: '/(admin)/thread',
            params: { id: data.patientId, name: data.patientName ?? '' },
          });
        }
      }
    }

    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    Notifications.getLastNotificationResponseAsync().then(handle);
    return () => sub.remove();
  }, [role, router]);

  // Push kaydı + hatırlatıcı zamanlaması (profil hazır olduğunda).
  useEffect(() => {
    if (!userId || !role) return;
    registerForPush(userId);

    const isPatient = role === 'patient';
    if (isPatient) {
      refreshReminder(userId);
    } else {
      // Personel cihazında tedavi hatırlatıcısı olmamalı.
      cancelReminders();
    }

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isPatient) refreshReminder(userId);
    });
    return () => sub.remove();
  }, [userId, role]);
}
