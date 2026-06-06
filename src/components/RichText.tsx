import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

/**
 * Hafif metin biçimlendirici (markdown kütüphanesi yok → hızlı).
 * Desteklenen: boş satırla paragraflar, "## başlık", "- madde".
 */
export function RichText({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, '\n').split('\n');

  return (
    <View style={styles.wrap}>
      {blocks.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} style={styles.spacer} />;
        if (trimmed.startsWith('## ')) {
          return (
            <Text key={i} style={styles.heading}>
              {trimmed.slice(3)}
            </Text>
          );
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{trimmed.slice(2)}</Text>
            </View>
          );
        }
        return (
          <Text key={i} style={styles.paragraph}>
            {trimmed}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  spacer: { height: spacing.sm },
  heading: { ...typography.heading, color: colors.primaryDark, marginTop: spacing.sm },
  paragraph: { ...typography.body },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.md },
  bullet: { ...typography.body, color: colors.primary, fontWeight: '700' },
  bulletText: { ...typography.body, flex: 1 },
});
