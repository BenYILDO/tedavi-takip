import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SEVERITY_OPTIONS, SeverityKey } from '@/constants/severity';
import { colors, radius, spacing } from '@/theme';

interface SeverityPickerProps {
  value: SeverityKey;
  onChange: (value: SeverityKey) => void;
}

/** 5 seviyeli yatay şiddet seçici (Hiç → Çok şiddetli). */
export function SeverityPicker({ value, onChange }: SeverityPickerProps) {
  return (
    <View style={styles.row}>
      {SEVERITY_OPTIONS.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            style={[
              styles.chip,
              { borderColor: opt.color },
              selected && { backgroundColor: opt.color },
            ]}
          >
            <Text
              numberOfLines={2}
              style={[
                styles.chipText,
                { color: selected ? colors.textInverse : opt.color },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  chipText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
