import { Stack } from 'expo-router';
import { colors, typography } from '@/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontSize: typography.heading.fontSize,
          fontWeight: typography.heading.fontWeight,
          color: colors.text,
        },
        headerShadowVisible: false,
        headerBackTitle: 'Geri',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="patients" options={{ title: 'Hastalar' }} />
      <Stack.Screen name="create-patient" options={{ title: 'Yeni Hasta', presentation: 'modal' }} />
      <Stack.Screen name="patient-detail" options={{ title: 'Hasta Detayı' }} />
      <Stack.Screen name="reports" options={{ title: 'Raporlar' }} />
      <Stack.Screen name="messages" options={{ title: 'Mesajlar' }} />
      <Stack.Screen name="thread" options={{ title: 'Mesajlaşma' }} />
      <Stack.Screen name="researchers" options={{ title: 'Araştırmacılar' }} />
      <Stack.Screen name="researcher-detail" options={{ title: 'Araştırmacıyı Düzenle' }} />
      <Stack.Screen name="content" options={{ title: 'İçerik Yönetimi' }} />
      <Stack.Screen name="settings" options={{ title: 'Profil ve Ayarlar' }} />
      <Stack.Screen name="change-password" options={{ title: 'Şifre Değiştir' }} />
    </Stack>
  );
}
