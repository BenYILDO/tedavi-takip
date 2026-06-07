import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { alertAsync } from '@/lib/dialog';
import { Button, Card, EmptyState, ErrorState, LoadingState, ScreenContainer } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { listPatientThreads, PatientThreadSummary } from '@/features/messages/api';
import { formatDateTime } from '@/lib/date';
import { useAsync } from '@/lib/useAsync';
import { useFocusRefetch } from '@/lib/useFocusRefetch';
import { colors, radius, spacing, typography } from '@/theme';

export default function MessagesInboxScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data, loading, error, refetch } = useAsync(
    () => (profile ? listPatientThreads(profile.id) : Promise.resolve([])),
    [profile?.id],
  );
  useFocusRefetch(refetch);

  const openThread = (t: PatientThreadSummary) =>
    router.push({
      pathname: '/(patient)/thread',
      params: {
        staffId: t.staff.id,
        name: t.staff.full_name ?? 'Araştırmacı',
        phone: t.staff.phone ?? '',
      },
    });

  const onCall = async (phone: string | null) => {
    if (!phone) {
      alertAsync('Telefon numarası yok', 'Bu araştırmacı için iletişim numarası tanımlanmamış.');
      return;
    }
    const url = `tel:${phone}`;
    if (await Linking.canOpenURL(url)) Linking.openURL(url);
    else alertAsync('Arama yapılamıyor', 'Bu cihazda telefon araması desteklenmiyor.');
  };

  if (!profile || loading) return <LoadingState />;
  if (error) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.center}>
          <ErrorState message={error} onRetry={refetch} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <Button
        label="Yeni Mesaj"
        icon="create-outline"
        variant="secondary"
        onPress={() => router.push('/(patient)/new-message')}
        style={styles.newBtn}
      />

      {!data || data.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Henüz mesajınız yok"
          description="“Yeni Mesaj” ile bir araştırmacı seçip sorunuzu iletebilirsiniz."
        />
      ) : (
        <View style={styles.list}>
          {data.map((t) => (
            <Pressable key={t.staff.id} onPress={() => openThread(t)}>
              <Card style={styles.row}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                  {t.unread > 0 ? <View style={styles.dot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name} numberOfLines={1}>
                      {t.staff.full_name || 'Araştırmacı'}
                    </Text>
                    <Text style={styles.time}>{formatDateTime(t.lastMessage.created_at)}</Text>
                  </View>
                  <Text
                    style={[styles.preview, t.unread > 0 && styles.unreadPreview]}
                    numberOfLines={1}
                  >
                    {t.lastMessage.sender_role === 'patient' ? 'Siz: ' : ''}
                    {t.lastMessage.body}
                  </Text>
                </View>
                {t.staff.phone ? (
                  <Pressable
                    onPress={() => onCall(t.staff.phone)}
                    hitSlop={8}
                    style={styles.callBtn}
                    accessibilityLabel={`${t.staff.full_name ?? 'Araştırmacı'} ara`}
                  >
                    <Ionicons name="call" size={18} color={colors.success} />
                  </Pressable>
                ) : null}
                {t.unread > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t.unread}</Text>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  newBtn: { marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  name: { ...typography.bodyStrong, flex: 1 },
  time: { ...typography.caption, fontSize: 11 },
  preview: { ...typography.caption },
  unreadPreview: { color: colors.text, fontWeight: '600' },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center' },
});
