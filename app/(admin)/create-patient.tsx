import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { alertAsync } from '@/lib/dialog';
import { Button, Card, ScreenContainer, TextField } from '@/components';
import { createPatient } from '@/features/admin/api';
import { colors, radius, spacing, typography } from '@/theme';

export default function CreatePatientScreen() {
  const router = useRouter();
  const [regNo, setRegNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!regNo.trim()) {
      setError('Kayıt numarası zorunludur.');
      return;
    }
    setSubmitting(true);
    try {
      const { activationCode } = await createPatient(regNo, fullName);
      alertAsync(
        'Hasta oluşturuldu',
        `Kayıt No: ${regNo.trim()}\n\nAktivasyon Kodu: ${activationCode}\n\n` +
          'Bu kodu hastaya iletin. Hasta ilk girişte kayıt numarası ve bu kod ile ' +
          'kendi şifresini belirleyecektir. Kod tek kullanımlıktır.',
        () => router.back(),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hasta oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      footer={<Button label="Hastayı Oluştur" icon="person-add" onPress={onSubmit} loading={submitting} />}
    >
      <View style={styles.info}>
        <Ionicons name="information-circle" size={18} color={colors.accent} />
        <Text style={styles.infoText}>
          Hasta oluşturunca bir aktivasyon kodu üretilir. Hasta, kayıt numarası ve bu kod ile ilk
          girişte kendi şifresini oluşturur. Kodu hastaya iletmeyi unutmayın.
        </Text>
      </View>

      <Card style={styles.card}>
        <TextField
          label="Kayıt Numarası *"
          placeholder="Örn. 10234"
          value={regNo}
          onChangeText={setRegNo}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Ad Soyad"
          placeholder="Hastanın adı soyadı (opsiyonel)"
          value={fullName}
          onChangeText={setFullName}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
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
  error: { ...typography.caption, color: colors.danger },
});
