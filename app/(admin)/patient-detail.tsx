import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  SeverityBadge,
} from '@/components';
import { getPatientHistory } from '@/features/admin/api';
import { formatDate, formatTime } from '@/lib/date';
import { useAsync } from '@/lib/useAsync';
import { useFocusRefetch } from '@/lib/useFocusRefetch';
import { colors, radius, spacing, typography } from '@/theme';

export default function PatientDetailScreen() {
  const router = useRouter();
  const { id, name, reg } = useLocalSearchParams<{ id: string; name: string; reg: string }>();
  const { data, loading, error, refetch } = useAsync(() => getPatientHistory(String(id)), [id]);
  useFocusRefetch(refetch);

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
      <Card style={styles.headerCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name || 'İsimsiz hasta'}</Text>
          <Text style={styles.meta}>Kayıt No: {reg}</Text>
        </View>
      </Card>

      <Button
        label="Mesaj Gönder"
        icon="chatbubbles"
        variant="secondary"
        onPress={() =>
          router.push({ pathname: '/(admin)/thread', params: { id: String(id), name: String(name) } })
        }
        style={styles.msgBtn}
      />

      <Text style={styles.sectionLabel}>İlaç Kayıtları</Text>
      {data && data.logs.length > 0 ? (
        <Card style={styles.listCard} flat>
          {data.logs.map((log, i) => (
            <View key={log.id} style={[styles.logRow, i > 0 && styles.border]}>
              <Text style={styles.logDate}>{formatDate(log.log_date)}</Text>
              <View style={styles.logRight}>
                {log.taken ? (
                  <>
                    <View style={[styles.pill, { backgroundColor: colors.successSoft }]}>
                      <Text style={[styles.pillText, { color: colors.success }]}>Alındı</Text>
                    </View>
                    <Text style={styles.logTime}>{formatTime(log.medication_time)}</Text>
                  </>
                ) : (
                  <View style={[styles.pill, { backgroundColor: colors.dangerSoft }]}>
                    <Text style={[styles.pillText, { color: colors.danger }]}>Alınmadı</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </Card>
      ) : (
        <Card flat>
          <Text style={styles.empty}>Henüz ilaç kaydı yok.</Text>
        </Card>
      )}

      <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Semptom Raporları</Text>
      {data && data.reports.length > 0 ? (
        data.reports.map((report) => {
          const flagged = report.items
            .filter((it) => it.severity !== 'hic')
            .sort((a, b) => a.symptom.sort_order - b.symptom.sort_order);
          return (
            <Card key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Ionicons name="clipboard-outline" size={16} color={colors.primary} />
                <Text style={styles.reportDate}>{formatDate(report.report_date)}</Text>
              </View>
              {flagged.length === 0 ? (
                <Text style={styles.noSymptom}>Belirti bildirilmedi (tümü “Hiç”).</Text>
              ) : (
                <View style={styles.symptomList}>
                  {flagged.map((it) => (
                    <View key={it.id} style={styles.symptomRow}>
                      <Text style={styles.symptomName}>{it.symptom.name}</Text>
                      <SeverityBadge value={it.severity} />
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        })
      ) : (
        <Card flat>
          <Text style={styles.empty}>Henüz semptom raporu yok.</Text>
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.heading },
  meta: { ...typography.caption },
  msgBtn: { marginTop: spacing.md, marginBottom: spacing.xl },
  sectionLabel: { ...typography.label, marginBottom: spacing.md, marginLeft: spacing.xs },
  listCard: { padding: 0, overflow: 'hidden' },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  logDate: { ...typography.body },
  logRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logTime: { ...typography.caption, color: colors.textMuted },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '700' },
  reportCard: { marginBottom: spacing.md, gap: spacing.sm },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reportDate: { ...typography.bodyStrong },
  noSymptom: { ...typography.caption, color: colors.success },
  symptomList: { gap: spacing.sm },
  symptomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  symptomName: { ...typography.body, flex: 1, marginRight: spacing.sm },
  empty: { ...typography.body, color: colors.textMuted },
  center: { flex: 1, justifyContent: 'center' },
});
