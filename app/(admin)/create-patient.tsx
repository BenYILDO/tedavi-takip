import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
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
      await createPatient(regNo, fullName);
      Alert.alert(
        'Hasta oluşturuldu',
        `Kayıt No: ${regNo.trim()}\n\nHasta ilk girişte kendi şifresini belirleyecektir.`,
        [{ text: 'Tamam', onPress: () => router.back() }],
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
          Hasta, belirlediğiniz kayıt numarası ile giriş yapacak ve ilk girişte kendi şifresini
          oluşturacaktır.
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
