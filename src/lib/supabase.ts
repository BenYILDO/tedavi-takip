import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Geliştirme sırasında erken uyarı; .env dosyasını doldurun.
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. .env dosyasını doldurun.',
  );
}

/** Hasta kayıt numaralarını Supabase auth e-postasına eşlemek için kullanılan alan adı. */
export const PATIENT_EMAIL_DOMAIN =
  process.env.EXPO_PUBLIC_PATIENT_EMAIL_DOMAIN ?? 'tedavitakip.local';

/** Kayıt numarasını dahili auth e-postasına çevirir. */
export const regNoToEmail = (registrationNumber: string): string =>
  `${registrationNumber.trim().toLowerCase()}@${PATIENT_EMAIL_DOMAIN}`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Uygulama ön planda iken token yenilemeyi aktif tut (Supabase RN önerisi).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
