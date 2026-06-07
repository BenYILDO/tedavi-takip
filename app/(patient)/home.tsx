import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MenuCard, ScreenContainer } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, radius, spacing, typography } from '@/theme';

interface MenuItem {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: Href;
}

const MENU: MenuItem[] = [
  {
    title: 'Antikoagülasyonun Önemi',
    subtitle: 'Tedavinizi neden düzenli almalısınız?',
    icon: 'heart-circle',
    color: '#D64545',
    route: '/(patient)/importance',
  },
  {
    title: 'Antikoagülan İlaç Türleri',
    subtitle: 'Kullanılan ilaçlar ve özellikleri',
    icon: 'medkit',
    color: '#1E6F9F',
    route: '/(patient)/drug-types',
  },
  {
    title: 'Alınması Gereken Önlemler',
    subtitle: 'Süreçte dikkat edilmesi gerekenler',
    icon: 'shield-checkmark',
    color: '#2E9E5B',
    route: '/(patient)/precautions',
  },
  {
    title: 'Eğitim Videosu',
    subtitle: 'Subkutan enjeksiyon uygulaması',
    icon: 'play-circle',
    color: '#0E7C7B',
    route: '/(patient)/video',
  },
  {
    title: 'Olası Komplikasyonlar',
    subtitle: 'Belirtiler ve yönetimi',
    icon: 'warning',
    color: '#E0A91E',
    route: '/(patient)/complications',
  },
  {
    title: 'Kayıt Günlüğü',
    subtitle: 'Bugünkü tedavinizi kaydedin',
    icon: 'create',
    color: '#7A4FBF',
    route: '/(patient)/diary',
  },
  {
    title: 'Mesajlar',
    subtitle: 'Araştırmacılarla iletişime geçin',
    icon: 'chatbubbles',
    color: '#1E9FA8',
    route: '/(patient)/ask',
  },
  {
    title: 'Hatırlatıcılar',
    subtitle: 'Günlük tedavi hatırlatması kurun',
    icon: 'alarm',
    color: '#C2410C',
    route: '/(patient)/reminders',
  },
];

export default function PatientHome() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Hoş geldiniz';

  return (
    <ScreenContainer topInset>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Merhaba,</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(patient)/settings')}
          accessibilityLabel="Profil ve ayarlar"
          hitSlop={8}
          style={styles.avatarBtn}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Ionicons name="person-circle-outline" size={26} color={colors.primary} />
          )}
        </Pressable>
        <Pressable
          onPress={signOut}
          accessibilityLabel="Çıkış yap"
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <Pressable
        style={styles.diaryBanner}
        onPress={() => router.push('/(patient)/diary')}
        accessibilityRole="button"
      >
        <View style={styles.diaryIcon}>
          <Ionicons name="today" size={26} color={colors.textInverse} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.diaryTitle}>Bugünkü Tedavi Kaydı</Text>
          <Text style={styles.diarySub}>İlaç alımınızı ve semptomlarınızı kaydedin</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={28} color={colors.textInverse} />
      </Pressable>

      <Text style={styles.sectionLabel}>Eğitim ve İletişim</Text>
      <View style={styles.menu}>
        {MENU.map((item) => (
          <MenuCard
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            color={item.color}
            onPress={() => router.push(item.route)}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  greeting: { ...typography.caption },
  name: { ...typography.title },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44 },
  diaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  diaryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryTitle: { ...typography.heading, color: colors.textInverse },
  diarySub: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  sectionLabel: { ...typography.label, marginBottom: spacing.md, marginLeft: spacing.xs },
  menu: { gap: spacing.md },
});
