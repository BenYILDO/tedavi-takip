import React, { useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  ScreenContainer,
  TextField,
} from '@/components';
import { getSetting } from '@/features/content/api';
import { listEducationSections, setSetting, updateEducationSection } from '@/features/admin/api';
import { useAsync } from '@/lib/useAsync';
import { colors, radius, spacing, typography } from '@/theme';
import { EducationSection } from '@/types/db';

export default function ContentScreen() {
  const { data, loading, error, refetch } = useAsync(async () => {
    const [sections, phone] = await Promise.all([listEducationSections(), getSetting('researcher_phone')]);
    return { sections, phone: phone ?? '' };
  }, []);

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.center}>
          <ErrorState message={error} onRetry={refetch} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <PhoneEditor initial={data?.phone ?? ''} />

      <Text style={styles.sectionLabel}>Eğitim İçerikleri</Text>
      {data?.sections.map((section) => (
        <SectionEditor key={section.id} section={section} />
      ))}
    </ScreenContainer>
  );
}

function PhoneEditor({ initial }: { initial: string }) {
  const [phone, setPhone] = useState(initial);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await setSetting('researcher_phone', phone.trim());
      Alert.alert('Kaydedildi', 'İletişim numarası güncellendi.');
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>İletişim Ayarları</Text>
      <TextField
        label="Araştırmacı Telefon Numarası"
        placeholder="Örn. +90 555 000 00 00"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        hint="“Soru Sor” ekranındaki arama butonunda kullanılır."
      />
      <Button label="Kaydet" onPress={onSave} loading={saving} />
    </Card>
  );
}

function SectionEditor({ section }: { section: EducationSection }) {
  const [title, setTitle] = useState(section.title);
  const [body, setBody] = useState(section.body ?? '');
  const [videoUrl, setVideoUrl] = useState(section.video_url ?? '');
  const [saving, setSaving] = useState(false);

  const isVideo = section.key === 'video';

  const onSave = async () => {
    setSaving(true);
    try {
      await updateEducationSection(section.id, {
        title: title.trim(),
        body,
        ...(isVideo ? { video_url: videoUrl.trim() || null } : {}),
      });
      Alert.alert('Kaydedildi', `“${title}” güncellendi.`);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.keyTag}>
        <Text style={styles.keyTagText}>{section.key}</Text>
      </View>
      <TextField label="Başlık" value={title} onChangeText={setTitle} />
      {isVideo ? (
        <TextField
          label="Video Bağlantısı (URL)"
          value={videoUrl}
          onChangeText={setVideoUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://… (Supabase Storage genel URL)"
          hint="Supabase Storage'a yüklediğiniz videonun genel (public) bağlantısı."
        />
      ) : null}
      <TextField
        label={isVideo ? 'Açıklama Metni' : 'İçerik Metni'}
        value={body}
        onChangeText={setBody}
        multiline
        style={styles.bodyInput}
        hint="Biçimlendirme: boş satır = paragraf, “## ” = başlık, “- ” = madde."
      />
      <Button label="Kaydet" onPress={onSave} loading={saving} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, marginBottom: spacing.lg },
  cardTitle: { ...typography.heading },
  sectionLabel: { ...typography.label, marginBottom: spacing.md, marginLeft: spacing.xs, marginTop: spacing.sm },
  keyTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  keyTagText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  bodyInput: { minHeight: 160, textAlignVertical: 'top', paddingTop: spacing.md },
  center: { flex: 1, justifyContent: 'center' },
});
