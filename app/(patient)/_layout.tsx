import { Stack } from 'expo-router';
import { DiaryDraftProvider } from '@/features/diary/DiaryDraftContext';
import { colors, typography } from '@/theme';

export default function PatientLayout() {
  return (
    <DiaryDraftProvider>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { ...typography.heading },
        headerShadowVisible: false,
        headerBackTitle: 'Geri',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="importance" options={{ title: 'Antikoagülasyonun Önemi' }} />
      <Stack.Screen name="drug-types" options={{ title: 'Antikoagülan İlaç Türleri' }} />
      <Stack.Screen name="precautions" options={{ title: 'Alınması Gereken Önlemler' }} />
      <Stack.Screen name="video" options={{ title: 'Eğitim Videosu' }} />
      <Stack.Screen name="complications" options={{ title: 'Olası Komplikasyonlar' }} />
      <Stack.Screen name="ask" options={{ title: 'Soru Sor' }} />
      <Stack.Screen name="diary/index" options={{ title: 'Kayıt Günlüğü' }} />
      <Stack.Screen name="diary/symptoms" options={{ title: 'Semptom Anketi' }} />
      <Stack.Screen name="diary/checklist" options={{ title: 'Semptom Kontrol Listesi' }} />
      <Stack.Screen name="change-password" options={{ title: 'Şifre Değiştir' }} />
    </Stack>
    </DiaryDraftProvider>
  );
}
