import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { lastPushToken } from '@/lib/storage';
import { deletePushToken, savePushToken } from './api';

// Uygulama ÖN PLANDA iken OS bildirimini gösterme: uygulama‑içi banner
// (InAppMessageProvider) devreye girer. Uygulama arka plandayken bu handler
// çalışmaz; OS bildirimi normal şekilde gelir.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const foreground = AppState.currentState === 'active';
    return {
      shouldShowBanner: !foreground,
      shouldShowList: !foreground,
      shouldPlaySound: !foreground,
      shouldSetBadge: false,
    };
  },
});

let cachedToken: string | null = null;

/** Android'de bildirimlerin görünmesi için kanal gerekir. */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Genel',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Bildirim iznini kontrol eder, gerekiyorsa ister. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  );
}

/** İzin alır, Expo push token'ı edinir ve sunucuya kaydeder. */
export async function registerForPush(userId: string): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('[push] EAS projectId yok; push token alınamadı. `eas init` çalıştırın.');
    return;
  }
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    cachedToken = token;
    await lastPushToken.set(token);
    await savePushToken(userId, token, Platform.OS);
  } catch (e) {
    console.warn('[push] token alınamadı', e);
  }
}

/**
 * Bu cihazın token'ını sunucudan siler (çıkışta). Uygulama yeniden başlatıldıysa
 * bellekteki cachedToken boş olabilir; bu durumda kalıcı kayıttan okunur.
 */
export async function unregisterCurrentPush(): Promise<void> {
  const token = cachedToken ?? (await lastPushToken.get());
  if (!token) return;
  await deletePushToken(token);
  await lastPushToken.clear();
  cachedToken = null;
}
