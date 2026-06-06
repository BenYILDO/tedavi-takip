import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LoadingState } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { getSetting } from '@/features/content/api';
import { MessageThread } from '@/features/messages/MessageThread';
import { useAsync } from '@/lib/useAsync';
import { colors, radius, spacing, typography } from '@/theme';

export default function AskScreen() {
  const { profile } = useAuth();
  const { data: phone, loading } = useAsync(() => getSetting('researcher_phone'), []);

  const onCall = async () => {
    if (!phone) {
      Alert.alert('Telefon numarası bulunamadı', 'Araştırmacı iletişim numarası henüz tanımlanmamış.');
      return;
    }
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Arama yapılamıyor', 'Bu cihazda telefon araması desteklenmiyor.');
    }
  };

  if (!profile) return <LoadingState />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
    >
      <Pressable style={styles.callCard} onPress={onCall} accessibilityRole="button">
        <View style={styles.callIcon}>
          <Ionicons name="call" size={22} color={colors.textInverse} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callTitle}>Araştırmacıyı Ara</Text>
          <Text style={styles.callSub}>
            {loading ? 'Yükleniyor…' : phone ? phone : 'Numara tanımlı değil'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>

      <View style={styles.threadLabel}>
        <Ionicons name="chatbubbles-outline" size={16} color={colors.textMuted} />
        <Text style={styles.threadLabelText}>Mesajlaşma</Text>
      </View>

      <View style={styles.flex}>
        <MessageThread patientId={profile.id} senderRole="patient" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  callIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callTitle: { ...typography.bodyStrong },
  callSub: { ...typography.caption },
  threadLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  threadLabelText: { ...typography.label },
});
