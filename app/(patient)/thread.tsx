import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { alertAsync } from '@/lib/dialog';
import { LoadingState } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { MessageThread } from '@/features/messages/MessageThread';
import { colors, radius, spacing, typography } from '@/theme';

export default function PatientThreadScreen() {
  const { profile } = useAuth();
  const { staffId, name, phone } = useLocalSearchParams<{
    staffId: string;
    name: string;
    phone: string;
  }>();

  const onCall = async () => {
    if (!phone) {
      alertAsync('Telefon numarası yok', 'Bu araştırmacı için iletişim numarası tanımlanmamış.');
      return;
    }
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      alertAsync('Arama yapılamıyor', 'Bu cihazda telefon araması desteklenmiyor.');
    }
  };

  if (!profile) return <LoadingState />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
    >
      <Stack.Screen options={{ title: name || 'Mesajlaşma' }} />

      <Pressable style={styles.callCard} onPress={onCall} accessibilityRole="button">
        <View style={styles.callIcon}>
          <Ionicons name="call" size={22} color={colors.textInverse} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.callTitle}>{name || 'Araştırmacı'}</Text>
          <Text style={styles.callSub}>{phone ? phone : 'Numara tanımlı değil'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>

      <View style={styles.flex}>
        <MessageThread patientId={profile.id} staffId={String(staffId)} senderRole="patient" />
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
});
