import { Platform, TextStyle } from 'react-native';
import { colors } from './colors';

export { colors } from './colors';
export type { AppColors } from './colors';

/** Tutarlı boşluk ölçeği (4 katları). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Köşe yarıçapları. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Tipografi ölçeği. */
export const typography: Record<string, TextStyle> = {
  display: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  heading: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, fontWeight: '400', color: colors.text, lineHeight: 24 },
  bodyStrong: { fontSize: 16, fontWeight: '600', color: colors.text },
  label: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  caption: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
};

/** Hafif yükselti gölgesi (iOS + Android + web). */
export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 3 },
    default: {
      boxShadow: '0 4px 12px rgba(10, 42, 46, 0.08)',
    },
  }),
} as const;

/** İçeriğin masaüstü web'de aşırı genişlememesi için maksimum genişlik. */
export const layout = {
  maxContentWidth: 640,
} as const;
