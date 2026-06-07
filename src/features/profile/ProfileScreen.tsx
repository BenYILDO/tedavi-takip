import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, ScreenContainer, TextField } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { changeUsername, deleteOwnAccount, updateOwnProfile, uploadAvatar } from '@/features/profile/api';
import { alertAsync, confirmAsync } from '@/lib/dialog';
import { rememberedRegNo } from '@/lib/storage';
import { colors, radius, spacing, typography } from '@/theme';

interface ProfileScreenProps {
  /** Şifre değiştirme ekranının rotası (role'e göre değişir). */
  changePasswordRoute: Href;
}

/** Hasta ve personelin paylaştığı Profil/Ayarlar ekranı. */
export function ProfileScreen({ changePasswordRoute }: ProfileScreenProps) {
  const router = useRouter();
  const { profile, refreshProfile, signOut } = useAuth();
  const isStaff = profile?.role === 'admin' || profile?.role === 'researcher';

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [username, setUsername] = useState(profile?.registration_number ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [phoneHidden, setPhoneHidden] = useState(profile?.phone_hidden ?? false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);

  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const onPickAvatar = async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alertAsync('İzin gerekli', 'Fotoğraf seçebilmek için galeri erişimine izin verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (result.canceled || !result.assets[0]) return;

    setAvatarBusy(true);
    try {
      const url = await uploadAvatar(profile.id, result.assets[0].uri);
      await updateOwnProfile(profile.id, { avatar_url: url });
      setAvatarUrl(url);
      await refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fotoğraf yüklenemedi.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const onSave = async () => {
    setError(null);
    const name = fullName.trim();
    const nextPhone = phone.trim();
    const nextUsername = username.trim().toLowerCase();
    if (!name) {
      setError('Görünen isim zorunludur.');
      return;
    }
    if (!nextPhone) {
      setError('Telefon numarası zorunludur.');
      return;
    }
    if (!nextUsername) {
      setError('Kullanıcı adı zorunludur.');
      return;
    }
    setSaving(true);
    try {
      // Kullanıcı adı değiştiyse önce auth e-postası + kayıt no güncellenir.
      if (nextUsername !== (profile.registration_number ?? '')) {
        const applied = await changeUsername(nextUsername);
        await rememberedRegNo.set(applied);
      }
      await updateOwnProfile(profile.id, {
        full_name: name,
        phone: nextPhone,
        phone_hidden: phoneHidden,
      });
      await refreshProfile();
      alertAsync('Kaydedildi', 'Profil bilgileriniz güncellendi.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Profil kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const first = await confirmAsync(
      'Hesabı sil',
      'Hesabınız ve tüm verileriniz (kayıtlar, mesajlar) kalıcı olarak silinecek.',
      { confirmLabel: 'Devam', destructive: true },
    );
    if (!first) return;

    const second = await confirmAsync(
      'Emin misiniz?',
      'Bu işlem geri alınamaz. Hesabınızı kalıcı olarak silmek istediğinize emin misiniz?',
      { confirmLabel: 'Hesabı Kalıcı Sil', destructive: true },
    );
    if (!second) return;

    try {
      await deleteOwnAccount();
      await signOut();
    } catch (e) {
      alertAsync('Silinemedi', e instanceof Error ? e.message : 'Hesap silinemedi.');
    }
  };

  return (
    <ScreenContainer footer={<Button label="Kaydet" icon="checkmark" onPress={onSave} loading={saving} />}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Pressable onPress={onPickAvatar} disabled={avatarBusy} style={styles.avatarPress}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={44} color={colors.primary} />
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name={avatarBusy ? 'hourglass' : 'camera'} size={16} color={colors.textInverse} />
          </View>
        </Pressable>
        <Text style={styles.avatarHint}>Fotoğrafı değiştirmek için dokunun</Text>
      </View>

      <Card style={styles.card}>
        <TextField label="Görünen İsim" value={fullName} onChangeText={setFullName} placeholder="Ad Soyad" />
        <TextField
          label="Kullanıcı Adı"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          hint="Giriş için kullanılır. Değiştirirseniz yeni kullanıcı adıyla giriş yaparsınız."
        />
        <TextField
          label="Telefon"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="İletişim numarası"
        />
        {isStaff ? (
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Telefonumu hastalardan gizle</Text>
              <Text style={styles.switchHint}>
                Açıkken hastalar numaranızı göremez ve arayamaz; yalnızca mesajla iletişim kurar.
              </Text>
            </View>
            <Switch
              value={phoneHidden}
              onValueChange={setPhoneHidden}
              trackColor={{ true: colors.primaryLight, false: colors.border }}
              thumbColor={phoneHidden ? colors.primary : colors.surface}
            />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>

      <Pressable style={styles.linkRow} onPress={() => router.push(changePasswordRoute)}>
        <Ionicons name="key-outline" size={20} color={colors.primary} />
        <Text style={styles.linkText}>Şifre Değiştir</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>

      <Pressable style={styles.linkRow} onPress={signOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.primary} />
        <Text style={styles.linkText}>Çıkış Yap</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>

      <Pressable style={[styles.linkRow, styles.dangerRow]} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
        <Text style={[styles.linkText, { color: colors.danger }]}>Hesabı Sil</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.danger} />
      </Pressable>
    </ScreenContainer>
  );
}

const AVATAR_SIZE = 104;

const styles = StyleSheet.create({
  avatarWrap: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  avatarPress: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarHint: { ...typography.caption },
  card: { gap: spacing.md, marginBottom: spacing.lg },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchLabel: { ...typography.bodyStrong },
  switchHint: { ...typography.caption, marginTop: 2 },
  error: { ...typography.caption, color: colors.danger },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  dangerRow: { borderColor: colors.dangerSoft, backgroundColor: colors.dangerSoft },
  linkText: { ...typography.bodyStrong, flex: 1 },
});
