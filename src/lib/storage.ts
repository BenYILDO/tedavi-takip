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
