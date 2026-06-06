import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, ScreenContainer, TextField } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, radius, spacing, typography } from '@/theme';

const MIN_LENGTH = 6;

export default function SetPasswordScreen() {
  const { regNo } = useLocalSearchParams<{ regNo: string }>();
  const { setPasswordAndSignIn } = useAuth();

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
      await setPasswordAndSignIn(String(regNo), password);
      // Başarılı → otomatik giriş, RootNavigator yönlendirir.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Şifre belirlenemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer topInset>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="lock-closed" size={30} color={colors.textInverse} />
        </View>
        <Text style={styles.title}>Şifrenizi Belirleyin</Text>
        <Text style={styles.subtitle}>
          Hoş geldiniz! İlk girişiniz için güvenli bir şifre oluşturun.
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.regChip}>
          <Ionicons name="person" size={16} color={colors.primary} />
          <Text style={styles.regText}>Kayıt No: {regNo}</Text>
        </View>

        <TextField
          label="Yeni Şifre"
          placeholder={`En az ${MIN_LENGTH} karakter`}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <TextField
          label="Şifre (Tekrar)"
          placeholder="Şifrenizi tekrar girin"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={onSubmit}
          returnKeyType="go"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Şifreyi Kaydet ve Giriş Yap"
          onPress={onSubmit}
          loading={submitting}
          style={styles.submit}
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl, gap: spacing.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, marginTop: spacing.sm },
  subtitle: { ...typography.caption, textAlign: 'center', paddingHorizontal: spacing.lg },
  card: { gap: spacing.md },
  regChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  regText: { ...typography.label, color: colors.primaryDark },
  submit: { marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.danger },
});
