/**
 * Uygulama renk paleti — sakin, güven veren tıbbi tema.
 * Primary teal/mavi, yumuşak nötrler, semptom şiddeti için yeşil→kırmızı skala.
 */
export const colors = {
  primary: '#0E7C7B',
  primaryDark: '#0A5D5C',
  primaryLight: '#3FA9A8',
  primarySoft: '#E6F4F4',

  accent: '#1E6F9F',
  accentSoft: '#E7F0F7',

  background: '#F5F8F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3F4',
  border: '#DCE4E6',

  text: '#10242B',
  textMuted: '#5B6F76',
  textFaint: '#90A2A8',
  textInverse: '#FFFFFF',

  success: '#2E9E5B',
  successSoft: '#E4F4EA',
  warning: '#E0A91E',
  warningSoft: '#FBF1DC',
  danger: '#D64545',
  dangerSoft: '#FaE7E7',

  /** Semptom şiddeti renkleri (severity key → renk). */
  severity: {
    hic: '#2E9E5B',
    hafif: '#8DBF3F',
    orta: '#E0A91E',
    siddetli: '#E0701E',
    cok_siddetli: '#D64545',
  },

  overlay: 'rgba(16, 36, 43, 0.45)',
  shadow: '#0A2A2E',
} as const;

export type AppColors = typeof colors;
