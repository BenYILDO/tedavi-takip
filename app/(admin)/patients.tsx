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
import { listPatients } from '@/features/admin/api';
import { formatDate } from '@/lib/date';
import { useAsync } from '@/lib/useAsync';
import { useFocusRefetch } from '@/lib/useFocusRefetch';
import { colors, radius, spacing, typography } from '@/theme';

export default function PatientsScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useAsync(() => listPatients(), []);
  useFocusRefetch(refetch);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (p) =>
        p.registration_number?.toLowerCase().includes(q) ||
        p.full_name?.toLowerCase().includes(q),
    );
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
        placeholder="Kayıt no veya ad ile ara…"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        style={styles.search}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Hasta bulunamadı"
          description="Henüz kayıtlı hasta yok ya da aramanızla eşleşen yok."
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((p) => (
            <Pressable
              key={p.id}
              onPress={() =>
                router.push({
                  pathname: '/(admin)/patient-detail',
                  params: { id: p.id, name: p.full_name ?? '', reg: p.registration_number ?? '' },
                })
              }
            >
              <Card style={styles.row}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.full_name || 'İsimsiz hasta'}</Text>
                  <Text style={styles.meta}>
                    Kayıt No: {p.registration_number} · {formatDate(p.created_at.slice(0, 10))}
                  </Text>
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
