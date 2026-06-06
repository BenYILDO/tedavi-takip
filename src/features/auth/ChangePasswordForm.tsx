import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button, Card, ScreenContainer, TextField } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, spacing, typography } from '@/theme';

const MIN_LENGTH = 6;

/** Giriş yapmış kullanıcı (hasta/personel) için şifre değiştirme formu. */
export function ChangePasswordForm() {
  const router = useRouter();
  const { changePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`Şifre en az ${MIN_LENGTH} karakter olmalıdır.`);
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(password);
      Alert.alert('Şifre güncellendi', 'Şifreniz başarıyla değiştirildi.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şifre değiştirilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      footer={<Button label="Şifreyi Güncelle" icon="checkmark" onPress={onSubmit} loading={submitting} />}
    >
      <Text style={styles.intro}>Yeni şifrenizi belirleyin. Bir sonraki girişte bu şifreyi kullanacaksınız.</Text>
      <Card style={styles.card}>
        <TextField
          label="Yeni Şifre"
          placeholder={`En az ${MIN_LENGTH} karakter`}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <TextField
          label="Yeni Şifre (Tekrar)"
          placeholder="Şifrenizi tekrar girin"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={onSubmit}
          returnKeyType="go"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  card: { gap: spacing.md },
  error: { ...typography.caption, color: colors.danger },
});
