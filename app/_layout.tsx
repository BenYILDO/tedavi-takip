import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, LoadingState } from '@/components';
import { ErrorState } from '@/components/States';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { colors, spacing } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { initializing, session, profile, profileError, refreshProfile, signOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const signedIn = !!session && !!profile;

  useEffect(() => {
    if (initializing) return;
    SplashScreen.hideAsync().catch(() => {});

    const group = segments[0]; // '(auth)' | '(patient)' | '(admin)'

    // Oturum var ama profil yüklenemediyse yönlendirme yapma (kurtarma ekranı gösterilir).
    if (session && !profile) return;

    if (!signedIn) {
      if (group !== '(auth)') router.replace('/(auth)/login');
      return;
    }

    const isStaff = profile!.role === 'admin' || profile!.role === 'researcher';
    if (isStaff && group !== '(admin)') {
      router.replace('/(admin)/dashboard');
    } else if (!isStaff && group !== '(patient)') {
      router.replace('/(patient)/home');
    }
  }, [initializing, signedIn, session, profile, segments, router]);

  if (initializing) {
    return <LoadingState label="Hazırlanıyor…" />;
  }

  // Oturum var ama profil yüklenemedi: ağ hatası veya eksik profil kaydı.
  if (session && !profile) {
    if (profileError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background }}>
          <ErrorState
            message="Profiliniz yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin."
            onRetry={refreshProfile}
          />
          <Button label="Çıkış Yap" variant="secondary" icon="log-out-outline" onPress={signOut} />
        </View>
      );
    }
    return <LoadingState label="Profil yükleniyor…" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(patient)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
