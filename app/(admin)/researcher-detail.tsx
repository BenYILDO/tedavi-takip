import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { alertAsync } from '@/lib/dialog';
import { Button, Card, ScreenContainer, TextField } from '@/components';
import { updateResearcher } from '@/features/admin/api';
import { colors, spacing, typography } from '@/theme';

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export default function ResearcherDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    username: string;
    phone: string;
    phoneHidden: string;
  }>();

  const [fullName, setFullName] = useState(params.name ?? '');
  const [username, setUsername] = useState(params.username ?? '');
  const [phone, setPhone] = useState(params.phone ?? '');
  const [phoneHidden, setPhoneHidden] = useState(params.phoneHidden === '1');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    const name = fullName.trim();
    const nextUsername = username.trim().toLowerCase();
    const nextPhone = phone.trim();
    if (!name) return setError('Ad soyad zorunludur.');
    if (!nextPhone) return setError('Telefon numarası zorunludur.');
    if (!nextUsername || !USERNAME_PATTERN.test(nextUsername)) {
      return setError(
        'Kullanıcı adı harf veya rakamla başlamalı; yalnızca küçük harf, rakam, _ ve - içermelidir.',
      );
    }
    if (password && password.length < 6) {
      return setError('Yeni şifre en az 6 karakter olmalıdır.');
    }
    setSubmitting(true);
    try {
      await updateResearcher(String(params.id), {
        fullName: name,
        phone: nextPhone,
        phoneHidden,
        username: nextUsername !== (params.username ?? '') ? nextUsername : undefined,
        password: password || undefined,
      });
      alertAsync('Kaydedildi', 'Araştırmacı bilgileri güncellendi.', () => router.back());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer footer={<Button label="Kaydet" icon="checkmark" onPress={onSave} loading={submitting} />}>
      <Card style={styles.card}>
        <TextField label="Ad Soyad *" value={fullName} onChangeText={setFullName} />
        <TextField
          label="Kullanıcı Adı *"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          hint="Değiştirirseniz araştırmacı yeni kullanıcı adıyla giriş yapar."
        />
        <TextField label="Telefon *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Telefonu hastalardan gizle</Text>
            <Text style={styles.switchHint}>Açıkken hastalar bu numarayı göremez.</Text>
          </View>
          <Switch
            value={phoneHidden}
            onValueChange={setPhoneHidden}
            trackColor={{ true: colors.primaryLight, false: colors.border }}
            thumbColor={phoneHidden ? colors.primary : colors.surface}
          />
        </View>
        <TextField
          label="Yeni Şifre (opsiyonel)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Boş bırakılırsa değişmez"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchLabel: { ...typography.bodyStrong },
  switchHint: { ...typography.caption, marginTop: 2 },
  error: { ...typography.caption, color: colors.danger },
});
