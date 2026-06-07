import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { alertAsync } from '@/lib/dialog';
import { Button, Card, LoadingState, ScreenContainer } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { getTodayLog, upsertMedicationLog } from '@/features/diary/api';
import { useDiaryDraft } from '@/features/diary/DiaryDraftContext';
import { refreshReminder } from '@/features/notifications/reminders';
import { formatTime, toDbTime } from '@/lib/date';
import { colors, radius, spacing, typography } from '@/theme';

type Answer = 'yes' | 'no' | null;

function parseDbTimeToDate(time: string | null): Date {
  const d = new Date();
  if (time) {
    const [h, m] = time.split(':');
    d.setHours(Number(h), Number(m), 0, 0);
  }
  return d;
}

export default function DiaryIndexScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { setMedicationLogId, reset } = useDiaryDraft();

  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<Answer>(null);
  const [time, setTime] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyToday, setAlreadyToday] = useState(false);

  useEffect(() => {
    if (!profile) return;
    reset();
    getTodayLog(profile.id)
      .then((log) => {
        if (log) {
          setAnswer(log.taken ? 'yes' : 'no');
          setTime(parseDbTimeToDate(log.medication_time));
          setAlreadyToday(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (!profile || loading) return <LoadingState />;

  const onSave = async () => {
    if (answer === null) return;
    setSubmitting(true);
    try {
      const log = await upsertMedicationLog(
        profile.id,
        answer === 'yes',
        answer === 'yes' ? toDbTime(time) : null,
      );
      // Bugün kayıt yapıldı → günün hatırlatıcısını atla / yeniden zamanla.
      refreshReminder(profile.id);
      if (answer === 'yes') {
        setMedicationLogId(log.id);
        router.push('/(patient)/diary/symptoms');
      } else {
        alertAsync('Kaydınız alındı', 'Bugün için tedavi kaydınız kaydedildi.', () =>
          router.replace('/(patient)/home'),
        );
      }
    } catch {
      alertAsync('Hata', 'Kayıt sırasında bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      footer={
        <Button
          label={answer === 'yes' ? 'Devam Et — Semptomlar' : 'Kaydet'}
          onPress={onSave}
          loading={submitting}
          disabled={answer === null}
          icon={answer === 'yes' ? 'arrow-forward' : 'checkmark'}
        />
      }
    >
      {alreadyToday ? (
        <View style={styles.notice}>
          <Ionicons name="information-circle" size={18} color={colors.accent} />
          <Text style={styles.noticeText}>
            Bugün için bir kaydınız mevcut. Dilerseniz güncelleyebilirsiniz.
          </Text>
        </View>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.question}>Bugün antikoagülan tedavinizi aldınız mı?</Text>

        <View style={styles.choices}>
          <Choice
            label="Evet"
            icon="checkmark-circle"
            active={answer === 'yes'}
            activeColor={colors.success}
            onPress={() => setAnswer('yes')}
          />
          <Choice
            label="Hayır"
            icon="close-circle"
            active={answer === 'no'}
            activeColor={colors.danger}
            onPress={() => setAnswer('no')}
          />
        </View>
      </Card>

      {answer === 'yes' ? (
        <Card style={styles.card}>
          <Text style={styles.label}>İlacı aldığınız saat</Text>
          <Text style={styles.hint}>
            Belirlenen saatte almayı unutup gün içinde aldıysanız da “Evet” seçmeniz yeterlidir.
          </Text>

          {Platform.OS === 'web' ? (
            <TextInput
              style={styles.webTime}
              value={formatTime(toDbTime(time))}
              onChangeText={(t) => {
                const [h, m] = t.split(':');
                const d = new Date(time);
                if (!Number.isNaN(Number(h))) d.setHours(Number(h));
                if (!Number.isNaN(Number(m))) d.setMinutes(Number(m));
                setTime(d);
              }}
              placeholder="SS:DD"
            />
          ) : (
            <Pressable style={styles.timeBtn} onPress={() => setShowPicker(true)}>
              <Ionicons name="time-outline" size={22} color={colors.primary} />
              <Text style={styles.timeText}>{formatTime(toDbTime(time))}</Text>
              <Text style={styles.timeChange}>Değiştir</Text>
            </Pressable>
          )}

          {showPicker && Platform.OS !== 'web' ? (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selected) => {
                if (Platform.OS !== 'ios') setShowPicker(false);
                if (event.type === 'set' && selected) setTime(selected);
              }}
            />
          ) : null}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

function Choice({
  label,
  icon,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[styles.choice, active && { borderColor: activeColor, backgroundColor: activeColor + '12' }]}
    >
      <Ionicons name={icon} size={28} color={active ? activeColor : colors.textFaint} />
      <Text style={[styles.choiceLabel, active && { color: activeColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg, gap: spacing.sm },
  question: { ...typography.heading, marginBottom: spacing.sm },
  choices: { flexDirection: 'row', gap: spacing.md },
  choice: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  choiceLabel: { ...typography.bodyStrong, color: colors.textMuted },
  label: { ...typography.bodyStrong },
  hint: { ...typography.caption },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  timeText: { ...typography.title, flex: 1 },
  timeChange: { ...typography.label, color: colors.primary },
  webTime: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    color: colors.text,
    marginTop: spacing.xs,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: { ...typography.caption, color: colors.accent, flex: 1 },
});
