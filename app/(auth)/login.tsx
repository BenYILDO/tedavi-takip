import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, ScreenContainer, TextField } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { rememberedRegNo } from '@/lib/storage';
import { colors, radius, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { checkAccount, signIn } = useAuth();

  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [remembered, setRemembered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    rememberedRegNo.get().then((value) => {
      if (value) {
        setRegNo(value);
        setRemembered(true);
      }
    });
  }, []);

  const onForgetUser = async () => {
    await rememberedRegNo.clear();
    setRegNo('');
    setPassword('');
    setRemembered(false);
  };

  const onSubmit = async () => {
    setError(null);
    const reg = regNo.trim();
    if (!reg) {
      setError('Lütfen kayıt numaranızı girin.');
      return;
    }
    if (!password) {
      setError('Lütfen şifrenizi girin.');
      return;
    }
    setSubmitting(true);
    try {
      const status = await checkAccount(reg);
      if (status === 'not_found') {
        setError('Bu kayıt numarasına ait hesap bulunamadı. Araştırmacınızla iletişime geçin.');
        return;
      }
      if (status === 'needs_password') {
        router.push({ pathname: '/(auth)/set-password', params: { regNo: reg } });
        return;
      }
      await signIn(reg, password);
      // Başarılı giriş → RootNavigator role'e göre yönlendirir.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş yapılamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer topInset>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="water" size={34} color={colors.textInverse} />
        </View>
        <Text style={styles.appName}>Antikoagülasyon Takip</Text>
        <Text style={styles.tagline}>Tedavi eğitimi ve günlük takip</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Giriş Yap</Text>

        {remembered ? (
          <View style={styles.userChip}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userLabel}>Kayıt Numarası</Text>
              <Text style={styles.userValue}>{regNo}</Text>
            </View>
            <Pressable onPress={onForgetUser} hitSlop={8}>
              <Text style={styles.changeUser}>Değiştir</Text>
            </Pressable>
          </View>
        ) : (
          <TextField
            label="Kayıt Numarası"
            placeholder="Örn. 10234"
            value={regNo}
            onChangeText={setRegNo}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        )}

        <TextField
          ref={passwordRef}
          label="Şifre"
          placeholder="Şifreniz"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Giriş Yap" onPress={onSubmit} loading={submitting} style={styles.submit} />
      </Card>

      <Text style={styles.footnote}>
        Hesabınız araştırmacınız tarafından oluşturulur. İlk girişte şifrenizi belirlersiniz.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl, gap: spacing.sm },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { ...typography.title, marginTop: spacing.sm },
  tagline: { ...typography.caption },
  card: { gap: spacing.md },
  cardTitle: { ...typography.heading },
  submit: { marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.danger },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLabel: { ...typography.caption, color: colors.primaryDark },
  userValue: { ...typography.bodyStrong, color: colors.primaryDark },
  changeUser: { ...typography.label, color: colors.primary },
  footnote: { ...typography.caption, textAlign: 'center', marginTop: spacing.xl },
});
