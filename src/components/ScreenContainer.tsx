import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControlProps,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  /** Alt sabit alan (ör. onay butonu) için içerik. */
  footer?: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: ViewStyle;
  /** Üst güvenli alanı uygula (header'sız ekranlar için). */
  topInset?: boolean;
}

/**
 * Tüm ekranların ortak kabuğu: güvenli alan, arka plan, klavye kaçınma,
 * masaüstü web'de içeriği ortalayıp genişliği sınırlama.
 */
export function ScreenContainer({
  children,
  scroll = true,
  footer,
  refreshControl,
  contentStyle,
  topInset = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const inner = (
    <View style={styles.centerWrap}>
      <View style={[styles.constrained, contentStyle]}>{children}</View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.flex,
          { paddingTop: topInset ? insets.top : 0 },
        ]}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: spacing.xxl + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
          >
            {inner}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.scrollContent]}>{inner}</View>
        )}

        {footer ? (
          <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
            <View style={styles.centerWrap}>
              <View style={styles.constrained}>{footer}</View>
            </View>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  centerWrap: { width: '100%', alignItems: 'center' },
  constrained: { width: '100%', maxWidth: layout.maxContentWidth },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
