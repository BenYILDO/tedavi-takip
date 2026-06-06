import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  ScreenContainer,
  SeverityBadge,
  SeverityPicker,
} from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { submitSymptomReport } from '@/features/diary/api';
import { useDiaryDraft } from '@/features/diary/DiaryDraftContext';
import { colors, radius, spacing, typography } from '@/theme';

export default function ChecklistScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { symptoms, severities, medicationLogId, setSeverity, reset } = useDiaryDraft();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (symptoms.length === 0) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.center}>
          <EmptyState
            icon="list-outline"
            title="Semptom bilgisi bulunamadı"
            description="Lütfen önce semptom anketini doldurun."
            actionLabel="Semptom Anketine Git"
            onAction={() => router.replace('/(patient)/diary/symptoms')}
          />
        </View>
      </ScreenContainer>
    );
  }

  const onConfirm = async () => {
    if (!profile) return;
    setSubmitting(true);
    try {
      await submitSymptomReport(profile.id, medicationLogId, severities);
      reset();
      Alert.alert('Teşekkürler', 'Semptom raporunuz araştırmacınıza iletildi.', [
        { text: 'Tamam', onPress: () => router.replace('/(patient)/home') },
      ]);
    } catch {
      Alert.alert('Hata', 'Rapor gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      footer={
        <Button
          label="Onayla ve Gönder"
          icon="checkmark-done"
          onPress={onConfirm}
          loading={submitting}
        />
      }
    >
      <Text style={styles.intro}>
        Bildirdiğiniz semptomlar aşağıdadır. Değiştirmek istediğiniz semptoma dokunarak şiddeti
        güncelleyebilirsiniz.
      </Text>

      <Card style={styles.listCard} flat>
        {symptoms.map((s, index) => {
          const isOpen = expanded === s.id;
          return (
            <View key={s.id} style={[styles.row, index > 0 && styles.rowBorder]}>
              <Pressable
                style={styles.rowHeader}
                onPress={() => setExpanded(isOpen ? null : s.id)}
                accessibilityRole="button"
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{s.name}</Text>
                </View>
                <SeverityBadge value={severities[s.id] ?? 'hic'} />
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textFaint}
                  style={{ marginLeft: spacing.sm }}
                />
              </Pressable>
              {isOpen ? (
                <View style={styles.editor}>
                  <SeverityPicker
                    value={severities[s.id] ?? 'hic'}
                    onChange={(v) => setSeverity(s.id, v)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  listCard: { padding: 0, overflow: 'hidden' },
  row: { paddingHorizontal: spacing.lg },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  name: { ...typography.body, fontWeight: '500' },
  editor: { paddingBottom: spacing.md },
  center: { flex: 1, justifyContent: 'center' },
});
