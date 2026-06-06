import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SEVERITY_BY_KEY, SeverityKey } from '@/constants/severity';
import { radius, spacing } from '@/theme';

export function SeverityBadge({ value }: { value: SeverityKey }) {
  const opt = SEVERITY_BY_KEY[value];
  return (
    <View style={[styles.badge, { backgroundColor: opt.color }]}>
      <Text style={styles.text}>{opt.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
