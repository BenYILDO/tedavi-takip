import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button, Card, MenuCard, ScreenContainer } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getReportsForDate,
  listMessageThreads,
  listPatients,
} from '@/features/admin/api';
import { todayISO } from '@/lib/date';
import { useAsync } from '@/lib/useAsync';
import { useFocusRefetch } from '@/lib/useFocusRefetch';
import { colors, radius, spacing, typography } from '@/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const { data, refetch } = useAsync(async () => {
    const [patients, reports, threads] = await Promise.all([
      listPatients(),
      getReportsForDate(todayISO()),
      listMessageThreads(),
    ]);
    return {
      patientCount: patients.length,
      takenToday: reports.filter((r) => r.log.taken).length,
      reportedToday: reports.filter((r) => r.report).length,
      unread: threads.reduce((sum, t) => sum + t.unread, 0),
    };
  }, [profile?.id]);
  useFocusRefetch(refetch);

  return (
    <ScreenContainer
      topInset
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.role}>{isAdmin ? 'Yönetici' : 'Araştırmacı'}</Text>
          <Text style={styles.name}>{profile?.full_name ?? 'Panel'}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(admin)/settings')}
          hitSlop={8}
          style={styles.avatarBtn}
          accessibilityLabel="Profil ve ayarlar"
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <Ionicons name="person-circle-outline" size={26} color={colors.primary} />
          )}
        </Pressable>
        <Pressable onPress={signOut} hitSlop={8} style={styles.logoutBtn} accessibilityLabel="Çıkış">
          <Ionicons name="log-out-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="people" label="Hasta" value={data?.patientCount ?? '—'} color={colors.accent} />
        <StatCard
          icon="checkmark-done"
          label="Bugün İlaç"
          value={data?.takenToday ?? '—'}
          color={colors.success}
        />
        <StatCard
          icon="clipboard"
          label="Bugün Rapor"
          value={data?.reportedToday ?? '—'}
          color={colors.primary}
        />
      </View>

      <Button
        label="Yeni Hasta Kaydı"
        icon="person-add"
        onPress={() => router.push('/(admin)/create-patient')}
        style={styles.newBtn}
      />

      <Text style={styles.sectionLabel}>Yönetim</Text>
      <View style={styles.menu}>
        <MenuCard
          title="Hastalar"
          subtitle="Hasta listesi ve geçmişi"
          icon="people"
          color={colors.accent}
          onPress={() => router.push('/(admin)/patients')}
        />
        <MenuCard
          title="Raporlar"
          subtitle="Günlük ilaç ve semptom raporları"
          icon="bar-chart"
          color={colors.primary}
          onPress={() => router.push('/(admin)/reports')}
        />
        <MenuCard
          title="Mesajlar"
          subtitle={data?.unread ? `${data.unread} okunmamış mesaj` : 'Hasta mesajları'}
          icon="chatbubbles"
          color="#1E9FA8"
          onPress={() => router.push('/(admin)/messages')}
        />
        {isAdmin ? (
          <>
            <MenuCard
              title="Araştırmacılar"
              subtitle="Araştırmacı hesaplarını yönetin"
              icon="person-circle"
              color="#7A4FBF"
              onPress={() => router.push('/(admin)/researchers')}
            />
            <MenuCard
              title="İçerik Yönetimi"
              subtitle="Eğitim metinleri, video ve ayarlar"
              icon="create"
              color={colors.warning}
              onPress={() => router.push('/(admin)/content')}
            />
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card style={styles.stat} flat>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.lg },
  role: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  name: { ...typography.title },
  logoutBtn: {
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
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md },
  statValue: { ...typography.title },
  statLabel: { ...typography.caption },
  newBtn: { marginBottom: spacing.xl },
  sectionLabel: { ...typography.label, marginBottom: spacing.md, marginLeft: spacing.xs },
  menu: { gap: spacing.md },
});
