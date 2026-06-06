import { Stack } from 'expo-router';
import { colors, typography } from '@/theme';

export default function AdminLayout() {
  return (
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
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="patients" options={{ title: 'Hastalar' }} />
      <Stack.Screen name="create-patient" options={{ title: 'Yeni Hasta', presentation: 'modal' }} />
      <Stack.Screen name="patient-detail" options={{ title: 'Hasta Detayı' }} />
      <Stack.Screen name="reports" options={{ title: 'Raporlar' }} />
      <Stack.Screen name="messages" options={{ title: 'Mesajlar' }} />
      <Stack.Screen name="thread" options={{ title: 'Mesajlaşma' }} />
      <Stack.Screen name="researchers" options={{ title: 'Araştırmacılar' }} />
      <Stack.Screen name="content" options={{ title: 'İçerik Yönetimi' }} />
    </Stack>
  );
}
