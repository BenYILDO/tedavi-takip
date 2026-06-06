import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, ErrorState, RichText, ScreenContainer } from '@/components';
import { LoadingState } from '@/components';
import { useAsync } from '@/lib/useAsync';
import { colors, spacing, typography } from '@/theme';
import { EducationKey } from '@/types/db';
import { getEducationSection } from './api';

/** İçerik anahtarına göre eğitim bölümünü Supabase'den çekip gösterir. */
export function EducationContent({ sectionKey }: { sectionKey: EducationKey }) {
  const { data, loading, error, refetch } = useAsync(
    () => getEducationSection(sectionKey),
    [sectionKey],
  );

  if (loading) return <LoadingState />;
  if (error) return <ScreenContainerCentered><ErrorState message={error} onRetry={refetch} /></ScreenContainerCentered>;

  if (!data) {
    return (
      <ScreenContainerCentered>
        <EmptyState
          icon="document-text-outline"
          title="İçerik henüz eklenmemiş"
          description="Bu bölüm araştırmacı tarafından yakında güncellenecek."
          actionLabel="Yenile"
          onAction={refetch}
        />
      </ScreenContainerCentered>
    );
  }

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>{data.title}</Text>
      <Card style={styles.card}>
        {data.body ? (
          <RichText content={data.body} />
        ) : (
          <Text style={styles.empty}>İçerik metni henüz girilmemiş.</Text>
        )}
      </Card>
    </ScreenContainer>
  );
}

function ScreenContainerCentered({ children }: { children: React.ReactNode }) {
  return (
    <ScreenContainer scroll={false}>
      <View style={styles.center}>{children}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.md },
  card: { marginBottom: spacing.lg },
  empty: { ...typography.body, color: colors.textMuted },
  center: { flex: 1, justifyContent: 'center' },
});
