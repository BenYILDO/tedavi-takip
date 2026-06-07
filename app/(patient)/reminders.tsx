import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { alertAsync } from '@/lib/dialog';
import { Button, Card, LoadingState, ScreenContainer } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { ensureNotificationPermission } from '@/features/notifications/push';
import { refreshReminder } from '@/features/notifications/reminders';
import { formatTime, toDbTime } from '@/lib/date';
import { reminderSettings } from '@/lib/storage';
import { colors, radius, spacing, typography } from '@/theme';

export default function RemindersScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    reminderSettings.get().then((s) => {
      setEnabled(s.enabled);
      const d = new Date();
      d.setHours(s.hour, s.minute, 0, 0);
      setTime(d);
      setLoading(false);
    });
  }, []);

  const onToggle = async (value: boolean) => {
    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        alertAsync(
          'Bildirim izni gerekli',
          'Hatırlatıcı alabilmek için cihaz ayarlarından bu uygulamaya bildirim izni verin.',
        );
        return;
      }
    }
    setEnabled(value);
  };

  const onSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const settings = {
        enabled,
        hour: time.getHours(),
        minute: time.getMinutes(),
      };
      await reminderSettings.set(settings);
      await refreshReminder(profile.id);
      alertAsync(
        'Kaydedildi',
        enabled
          ? `Her gün ${formatTime(toDbTime(time))} için hatırlatıcı kuruldu. O gün kaydınızı girdiyseniz hatırlatıcı gelmez.`
          : 'Hatırlatıcı kapatıldı.',
      );
    } catch {
      alertAsync('Hata', 'Ayar kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile || loading) return <LoadingState />;

  return (
    <ScreenContainer footer={<Button label="Kaydet" icon="checkmark" onPress={onSave} loading={saving} />}>
      <View style={styles.info}>
        <Ionicons name="information-circle" size={18} color={colors.accent} />
        <Text style={styles.infoText}>
          Günlük tedavi kaydınızı unutmamanız için seçtiğiniz saatte hatırlatma gönderebiliriz.
          O gün kaydınızı zaten girdiyseniz hatırlatıcı gönderilmez.
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Günlük hatırlatıcı</Text>
            <Text style={styles.rowSub}>{enabled ? 'Açık' : 'Kapalı'}</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {enabled ? (
          <View style={styles.timeBlock}>
            <Text style={styles.label}>Hatırlatma saati</Text>
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
          </View>
        ) : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  info: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: { ...typography.caption, color: colors.accent, flex: 1 },
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowTitle: { ...typography.bodyStrong },
  rowSub: { ...typography.caption },
  timeBlock: { gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  label: { ...typography.bodyStrong },
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
});
