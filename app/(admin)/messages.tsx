import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, ErrorState, LoadingState, ScreenContainer } from '@/components';
import { listMessageThreads } from '@/features/admin/api';
import { formatDateTime } from '@/lib/date';
import { useAsync } from '@/lib/useAsync';
import { colors, spacing, typography } from '@/theme';

export default function MessagesScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useAsync(() => listMessageThreads(), []);

  if (loading) return <LoadingState />;
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
      {!data || data.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Mesaj yok"
          description="Henüz hiçbir hasta mesaj göndermedi."
        />
      ) : (
        <View style={styles.list}>
          {data.map((t) => (
            <Pressable
              key={t.patient.id}
              onPress={() =>
                router.push({
                  pathname: '/(admin)/thread',
                  params: { id: t.patient.id, name: t.patient.full_name ?? '' },
                })
              }
            >
              <Card style={styles.row}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                  {t.unread > 0 ? <View style={styles.dot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name} numberOfLines={1}>
                      {t.patient.full_name || t.patient.registration_number}
                    </Text>
                    <Text style={styles.time}>{formatDateTime(t.lastMessage.created_at)}</Text>
                  </View>
                  <Text
                    style={[styles.preview, t.unread > 0 && styles.unreadPreview]}
                    numberOfLines={1}
                  >
                    {t.lastMessage.sender_role === 'admin' ? 'Siz: ' : ''}
                    {t.lastMessage.body}
                  </Text>
                </View>
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
