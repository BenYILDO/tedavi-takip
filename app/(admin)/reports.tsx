import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  SeverityBadge,
} from '@/components';
import { getReportsForDate } from '@/features/admin/api';
import { formatDate, formatTime, todayISO } from '@/lib/date';
import { useAsync } from '@/lib/useAsync';
import { useFocusRefetch } from '@/lib/useFocusRefetch';
import { colors, radius, spacing, typography } from '@/theme';

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ReportsScreen() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const { data, loading, error, refetch } = useAsync(() => getReportsForDate(date), [date]);
  useFocusRefetch(refetch);

  const isToday = date === todayISO();

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <Card style={styles.dateBar} flat>
        <Pressable onPress={() => setDate(shiftDate(date, -1))} hitSlop={8} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.dateCenter}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
          {isToday ? <Text style={styles.todayTag}>Bugün</Text> : null}
        </View>
        <Pressable
          onPress={() => !isToday && setDate(shiftDate(date, 1))}
          hitSlop={8}
          style={[styles.navBtn, isToday && styles.navDisabled]}
          disabled={isToday}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </Card>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="Kayıt yok"
          description="Bu tarihte ilaç kaydı veya rapor bulunmuyor."
        />
      ) : (
        <View style={styles.list}>
          {data.map((item) => {
            const flagged = (item.report?.items ?? []).filter((it) => it.severity !== 'hic');
            return (
              <Pressable
                key={item.log.id}
                onPress={() =>
                  router.push({
                    pathname: '/(admin)/patient-detail',
                    params: {
                      id: item.patient.id,
                      name: item.patient.full_name ?? '',
                      reg: item.patient.registration_number ?? '',
                    },
                  })
                }
              >
                <Card style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientName}>
                        {item.patient.full_name || 'İsimsiz hasta'}
                      </Text>
                      <Text style={styles.patientMeta}>Kayıt No: {item.patient.registration_number}</Text>
                    </View>
                    {item.log.taken ? (
                      <View style={[styles.pill, { backgroundColor: colors.successSoft }]}>
                        <Text style={[styles.pillText, { color: colors.success }]}>
                          Alındı · {formatTime(item.log.medication_time)}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.pill, { backgroundColor: colors.dangerSoft }]}>
                        <Text style={[styles.pillText, { color: colors.danger }]}>Alınmadı</Text>
                      </View>
                    )}
                  </View>

                  {item.report ? (
                    flagged.length > 0 ? (
                      <View style={styles.symptoms}>
                        {flagged.map((it) => (
                          <View key={it.id} style={styles.symptomChip}>
                            <Text style={styles.symptomName} numberOfLines={1}>
                              {it.symptom.name}
                            </Text>
                            <SeverityBadge value={it.severity} />
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noSymptom}>Semptom raporu: belirti yok</Text>
                    )
                  ) : item.log.taken ? (
                    <Text style={styles.pending}>Semptom raporu bekleniyor</Text>
                  ) : null}
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: { opacity: 0.3 },
  dateCenter: { alignItems: 'center' },
  dateText: { ...typography.heading },
  todayTag: { ...typography.caption, color: colors.primary },
  list: { gap: spacing.md },
  itemCard: { gap: spacing.sm },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  patientName: { ...typography.bodyStrong },
  patientMeta: { ...typography.caption },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  symptoms: { gap: spacing.xs, marginTop: spacing.xs },
  symptomChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  symptomName: { ...typography.body, flex: 1 },
  noSymptom: { ...typography.caption, color: colors.success, marginTop: spacing.xs },
  pending: { ...typography.caption, color: colors.warning, marginTop: spacing.xs },
});
