import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  TextField,
} from '@/components';
import { createResearcher, listResearchers } from '@/features/admin/api';
import { formatDate } from '@/lib/date';
import { useAsync } from '@/lib/useAsync';
import { colors, radius, spacing, typography } from '@/theme';

export default function ResearchersScreen() {
  const { data, loading, error, refetch } = useAsync(() => listResearchers(), []);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onCreate = async () => {
    setFormError(null);
    if (!username.trim() || !fullName.trim() || password.length < 6) {
      setFormError('Kullanıcı adı, ad soyad ve en az 6 karakterlik şifre zorunludur.');
      return;
    }
    setSubmitting(true);
    try {
      await createResearcher(username, fullName, password, phone);
      Alert.alert('Araştırmacı oluşturuldu', `${fullName} hesabı oluşturuldu.`);
      setUsername('');
      setFullName('');
      setPhone('');
      setPassword('');
      refetch();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Araştırmacı oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>Yeni Araştırmacı</Text>
        <TextField
          label="Kullanıcı Adı *"
          placeholder="Giriş için kullanıcı adı"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField label="Ad Soyad *" placeholder="Araştırmacı adı" value={fullName} onChangeText={setFullName} />
        <TextField
          label="Telefon"
          placeholder="İletişim numarası (opsiyonel)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextField
          label="Geçici Şifre *"
          placeholder="En az 6 karakter"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <Button label="Araştırmacı Oluştur" icon="person-add" onPress={onCreate} loading={submitting} />
      </Card>

      <Text style={styles.sectionLabel}>Mevcut Araştırmacılar</Text>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="person-outline" title="Araştırmacı yok" description="Henüz araştırmacı eklenmemiş." />
      ) : (
        <View style={styles.list}>
          {data.map((r) => (
            <Card key={r.id} style={styles.row}>
              <View style={styles.avatar}>
                <Ionicons name="person-circle" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.full_name || r.registration_number}</Text>
                <Text style={styles.meta}>
                  @{r.registration_number}
                  {r.phone ? ` · ${r.phone}` : ''} · {formatDate(r.created_at.slice(0, 10))}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formCard: { gap: spacing.md, marginBottom: spacing.xl },
  formTitle: { ...typography.heading },
  error: { ...typography.caption, color: colors.danger },
  sectionLabel: { ...typography.label, marginBottom: spacing.md, marginLeft: spacing.xs },
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.bodyStrong },
  meta: { ...typography.caption },
});
