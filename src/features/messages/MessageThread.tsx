import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EmptyState } from '@/components';
import { formatDateTime } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/theme';
import { Message } from '@/types/db';
import { notifyNewMessage } from '@/features/notifications/api';
import { clearActiveThread, setActiveThread } from './activeThread';
import { listMessages, markMessagesRead, sendMessage } from './api';

interface MessageThreadProps {
  patientId: string;
  /** Sohbetin personel tarafı. Sohbet (patientId, staffId) çiftine özeldir. */
  staffId: string;
  senderRole: 'patient' | 'staff';
}

/** Hasta ↔ belirli bir personel arasındaki gizli mesaj akışı (her iki taraf da kullanır). */
export function MessageThread({ patientId, staffId, senderRole }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    try {
      const data = await listMessages(patientId, staffId);
      setMessages(data);
      await markMessagesRead(patientId, staffId, senderRole);
    } catch (e) {
      console.warn('[messages] load error', e);
    } finally {
      setLoading(false);
    }
  }, [patientId, staffId, senderRole]);

  // Bu sohbet açıkken uygulama‑içi banner'ı bastır (mesaj zaten listede görünür).
  useEffect(() => {
    setActiveThread(patientId, staffId);
    return () => clearActiveThread(patientId, staffId);
  }, [patientId, staffId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`messages:${patientId}:${staffId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `patient_id=eq.${patientId}` },
        (payload) => {
          const incoming = payload.new as Message;
          // Yalnızca bu sohbete (aynı personel) ait mesajları kabul et.
          if (incoming.staff_id !== staffId) return;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
          );
          // Ekran açıkken karşı taraftan gelen mesajı okundu işaretle.
          if (incoming.sender_role !== senderRole) {
            markMessagesRead(patientId, staffId, senderRole).catch(() => {});
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, patientId, staffId, senderRole]);

  const onSend = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await sendMessage(patientId, staffId, body, senderRole);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      // Karşı tarafa push bildirimi (best-effort; başarısızlık mesajı etkilemez).
      notifyNewMessage(msg.id);
    } catch (e) {
      setText(body); // hata olursa metni geri koy
      console.warn('[messages] send error', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Henüz mesaj yok"
              description={
                senderRole === 'patient'
                  ? 'Sorunuzu yazarak araştırmacınıza iletebilirsiniz.'
                  : 'Bu hasta ile henüz mesajlaşma başlamadı.'
              }
            />
          }
          renderItem={({ item }) => {
            const mine = item.sender_role === senderRole;
            return (
              <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                  <Text style={[styles.time, mine && styles.timeMine]}>
                    {formatDateTime(item.created_at)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Mesajınızı yazın…"
          placeholderTextColor={colors.textFaint}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim() || sending}
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
          accessibilityLabel="Gönder"
        >
          <Ionicons name="send" size={20} color={colors.textInverse} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { ...typography.body, color: colors.text },
  bubbleTextMine: { color: colors.textInverse },
  time: { fontSize: 11, color: colors.textFaint },
  timeMine: { color: 'rgba(255,255,255,0.75)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});
