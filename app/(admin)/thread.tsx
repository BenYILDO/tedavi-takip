import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { LoadingState } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { MessageThread } from '@/features/messages/MessageThread';
import { colors } from '@/theme';

export default function AdminThreadScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { profile } = useAuth();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
    >
      <Stack.Screen options={{ title: name || 'Mesajlaşma' }} />
      {profile ? (
        <MessageThread patientId={String(id)} staffId={profile.id} senderRole="staff" />
      ) : (
        <LoadingState />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
});
