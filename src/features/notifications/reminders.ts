import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getTodayLog } from '@/features/diary/api';
import { reminderSettings } from '@/lib/storage';
import { ensureAndroidChannel } from './push';

/** Kaç gün önceden hatırlatıcı zamanlanacağı. Uygulama açılmasa da bu kadar gün
 *  boyunca hatırlatıcı çalışmaya devam eder; her açılışta yeniden zincirlenir. */
const SCHEDULE_DAYS = 14;

/**
 * Önümüzdeki günler için hatırlatıcı zamanlarını üretir. Bugün için, kayıt zaten
 * girildiyse ya da saat geçtiyse atlanır; gelecek günler koşulsuz eklenir
 * (o günlerde kayıt yapılıp yapılmadığı önceden bilinemez — uygulama yeniden
 * açıldığında liste sıfırlanıp güncellenir).
 */
function upcomingReminderDates(hour: number, minute: number, loggedToday: boolean): Date[] {
  const now = new Date();
  const dates: Date[] = [];
  for (let offset = 0; offset < SCHEDULE_DAYS; offset += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute, 0, 0);
    if (offset === 0 && (loggedToday || d.getTime() <= now.getTime())) continue;
    dates.push(d);
  }
  return dates;
}

/** Tüm zamanlanmış hatırlatıcıları iptal eder. */
export async function cancelReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('[reminder] iptal edilemedi', e);
  }
}

/**
 * Hatırlatıcıyı ayara göre yeniden zamanlar. Önümüzdeki birkaç gün için bildirim
 * kurar; böylece uygulama uzun süre açılmasa da hatırlatıcı çalışmaya devam eder.
 * Uygulama her ön plana geldiğinde / kayıt yapıldığında tekrar çağrılarak liste
 * sıfırlanıp güncellenir. Hasta bugünkü kaydını girdiyse bugün atlanır.
 */
export async function refreshReminder(patientId: string | null): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelReminders();

  const settings = await reminderSettings.get();
  if (!settings.enabled) return;

  await ensureAndroidChannel();

  let loggedToday = false;
  if (patientId) {
    try {
      const log = await getTodayLog(patientId);
      loggedToday = !!log;
    } catch {
      // Ağ hatasında güvenli tarafta kal: hatırlat.
      loggedToday = false;
    }
  }

  const dates = upcomingReminderDates(settings.hour, settings.minute, loggedToday);
  try {
    for (const date of dates) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Tedavi hatırlatıcısı',
          body: 'Bugünkü antikoagülan tedavinizi kaydetmeyi unutmayın.',
          data: { type: 'reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
    }
  } catch (e) {
    console.warn('[reminder] zamanlanamadı', e);
  }
}
