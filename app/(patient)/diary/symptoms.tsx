import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, ErrorState, LoadingState, ScreenContainer, SeverityPicker } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { getTodayReport, listSymptoms } from '@/features/diary/api';
import { useDiaryDraft } from '@/features/diary/DiaryDraftContext';
import { SeverityKey } from '@/constants/severity';
import { useAsync } from '@/lib/useAsync';
import { colors, spacing, typography } from '@/theme';

export default function SymptomsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { symptoms, severities, initSymptoms, setSeverity } = useDiaryDraft();

  const { loading, error, refetch } = useAsync(async () => {
    if (!profile) return null;
    const [list, existing] = await Promise.all([listSymptoms(), getTodayReport(profile.id)]);
    const existingMap: Record<string, SeverityKey> = {};
    existing?.items.forEach((it) => {
      existingMap[it.symptom_id] = it.severity;
    });
    initSymptoms(list, existingMap);
    return list;
  }, [profile?.id]);

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
      footer={
        <Button
          label="Devam Et — Kontrol Listesi"
          icon="arrow-forward"
          onPress={() => router.push('/(patient)/diary/checklist')}
        />
      }
    >
      <Text style={styles.intro}>
        Aşağıdaki belirtilerden her biri için son durumunuza uygun şiddeti seçin.
      </Text>

      {symptoms.map((s, index) => (
        <Card key={s.id} style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{s.name}</Text>
              {s.description ? <Text style={styles.desc}>{s.description}</Text> : null}
            </View>
          </View>
          <SeverityPicker
            value={severities[s.id] ?? 'hic'}
            onChange={(v) => setSeverity(s.id, v)}
          />
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  card: { marginBottom: spacing.md, gap: spacing.md },
  headerRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { ...typography.label, color: colors.primary },
  name: { ...typography.bodyStrong },
  desc: { ...typography.caption, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center' },
});
