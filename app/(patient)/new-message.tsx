import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  TextField,
} from '@/components';
import { listResearchersForPatient } from '@/features/messages/api';
import { useAsync } from '@/lib/useAsync';
import { colors, spacing, typography } from '@/theme';

export default function NewMessageScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useAsync(() => listResearchersForPatient(), []);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((r) => r.full_name?.toLowerCase().includes(q));
  }, [data, query]);

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
      <TextField
        placeholder="Araştırmacı ara…"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        style={styles.search}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Araştırmacı bulunamadı"
          description="Henüz kayıtlı araştırmacı yok ya da aramanızla eşleşen yok."
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((r) => (
            <Pressable
              key={r.id}
              onPress={() =>
                router.replace({
                  pathname: '/(patient)/thread',
                  params: {
                    staffId: r.id,
                    name: r.full_name ?? 'Araştırmacı',
                    phone: r.phone ?? '',
                  },
                })
              }
            >
              <Card style={styles.row}>
                <View style={styles.avatar}>
                  <Ionicons name="person-circle" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.full_name || 'Araştırmacı'}</Text>
                  {r.phone ? <Text style={styles.meta}>{r.phone}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.bodyStrong },
  meta: { ...typography.caption },
  center: { flex: 1, justifyContent: 'center' },
});
