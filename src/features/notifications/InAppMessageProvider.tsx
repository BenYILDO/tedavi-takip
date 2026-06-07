import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { isThreadActive } from '@/features/messages/activeThread';
import { supabase } from '@/lib/supabase';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import { Message } from '@/types/db';

interface BannerData {
  title: string;
  body: string;
  onPress: () => void;
}

const AUTO_HIDE_MS = 4500;

/**
 * Oturum açıkken mesajları gerçek zamanlı dinler ve uygulama açıkken yeni mesaj
 * gelince üstten animasyonlu bir banner gösterir (OS bildirimi önplanda bastırılır).
 * Kullanıcı zaten o sohbeti görüntülüyorsa banner gösterilmez.
 */
export function InAppMessageBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const userId = profile?.id ?? null;
  const role = profile?.role ?? null;

  const [banner, setBanner] = useState<BannerData | null>(null);
  const translateY = useRef(new Animated.Value(-200)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(translateY, {
      toValue: -200,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setBanner(null));
  }, [translateY]);

  const show = useCallback(
    (data: BannerData) => {
      setBanner(data);
      translateY.setValue(-200);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(hide, AUTO_HIDE_MS);
    },
    [translateY, hide],
  );

  useEffect(() => {
    if (!userId || !role) return;
    const isPatient = role === 'patient';
    const filter = isPatient ? `patient_id=eq.${userId}` : `staff_id=eq.${userId}`;

    const channel = supabase
      .channel(`inapp-messages:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter },
        async (payload) => {
          const msg = payload.new as Message;
          const myRole = isPatient ? 'patient' : 'staff';
          // Kendi gönderdiğim mesaj değilse ve o sohbet açık değilse bildir.
          if (msg.sender_role === myRole) return;
          if (isThreadActive(msg.patient_id, msg.staff_id)) return;

          const preview = msg.body.length > 90 ? `${msg.body.slice(0, 87)}…` : msg.body;

          if (isPatient) {
            // Gönderen personel: maskeli iletişim bilgisi staff_public'ten.
            const { data: staff } = await supabase
              .from('staff_public')
              .select('full_name, phone')
              .eq('id', msg.staff_id)
              .maybeSingle();
            const name = (staff as { full_name?: string } | null)?.full_name || 'Araştırmacı';
            const phone = (staff as { phone?: string | null } | null)?.phone ?? '';
            show({
              title: name,
              body: preview,
              onPress: () => {
                hide();
                router.push({
                  pathname: '/(patient)/thread',
                  params: { staffId: msg.staff_id, name, phone },
                });
              },
            });
          } else {
            // Gönderen hasta.
            const { data: patient } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', msg.patient_id)
              .maybeSingle();
            const name = (patient as { full_name?: string } | null)?.full_name || 'Hasta';
            show({
              title: name,
              body: preview,
              onPress: () => {
                hide();
                router.push({
                  pathname: '/(admin)/thread',
                  params: { id: msg.patient_id, name },
                });
              },
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role, show, hide, router]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!banner) return null;

  return (
    <Animated.View
      style={[styles.wrap, { top: insets.top + spacing.sm, transform: [{ translateY }] }]}
      pointerEvents="box-none"
    >
      <Pressable style={styles.banner} onPress={banner.onPress} accessibilityRole="button">
        <View style={styles.icon}>
          <Ionicons name="chatbubble-ellipses" size={20} color={colors.textInverse} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {banner.body}
          </Text>
        </View>
        <Pressable onPress={hide} hitSlop={10} accessibilityLabel="Kapat">
          <Ionicons name="close" size={18} color={colors.textFaint} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...(shadow.card as object),
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.bodyStrong },
  body: { ...typography.caption },
});
