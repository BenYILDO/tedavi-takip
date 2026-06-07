import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMEMBERED_REG_NO = 'remembered_registration_number';

// expo-secure-store web'de çalışmaz; web'de AsyncStorage (localStorage) kullanılır.
async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

/** Cihazda son giriş yapan hastanın kayıt numarasını hatırlar (otomatik doldurma için). */
export const rememberedRegNo = {
  get: () => getItem(REMEMBERED_REG_NO),
  set: (value: string) => setItem(REMEMBERED_REG_NO, value),
  clear: () => deleteItem(REMEMBERED_REG_NO),
};

const LAST_PUSH_TOKEN = 'last_push_token';

/**
 * Bu cihaza ait Expo push token'ını kalıcı saklar. Uygulama yeniden başlatılsa
 * bile çıkışta token'ı sunucudan silebilmek için gereklidir.
 */
export const lastPushToken = {
  get: () => getItem(LAST_PUSH_TOKEN),
  set: (value: string) => setItem(LAST_PUSH_TOKEN, value),
  clear: () => deleteItem(LAST_PUSH_TOKEN),
};

// ---- Günlük tedavi hatırlatıcısı ayarları (cihaza özel) ----

const REMINDER_SETTINGS = 'reminder_settings_v1';

export interface ReminderSettings {
  enabled: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
}

export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, hour: 20, minute: 0 };

export const reminderSettings = {
  async get(): Promise<ReminderSettings> {
    try {
      const raw = await AsyncStorage.getItem(REMINDER_SETTINGS);
      if (!raw) return DEFAULT_REMINDER;
      return { ...DEFAULT_REMINDER, ...(JSON.parse(raw) as Partial<ReminderSettings>) };
    } catch {
      return DEFAULT_REMINDER;
    }
  },
  set: (value: ReminderSettings) =>
    AsyncStorage.setItem(REMINDER_SETTINGS, JSON.stringify(value)),
};
