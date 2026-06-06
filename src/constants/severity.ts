import { colors } from '@/theme';

/** Semptom şiddeti seviyeleri (DB değeri + Türkçe etiket + renk). */
export type SeverityKey = 'hic' | 'hafif' | 'orta' | 'siddetli' | 'cok_siddetli';

export interface SeverityOption {
  key: SeverityKey;
  label: string;
  color: string;
  /** 0 (hiç) → 4 (çok şiddetli); raporlamada sıralama için. */
  weight: number;
}

export const SEVERITY_OPTIONS: SeverityOption[] = [
  { key: 'hic', label: 'Hiç', color: colors.severity.hic, weight: 0 },
  { key: 'hafif', label: 'Hafif şiddetli', color: colors.severity.hafif, weight: 1 },
  { key: 'orta', label: 'Orta şiddetli', color: colors.severity.orta, weight: 2 },
  { key: 'siddetli', label: 'Şiddetli', color: colors.severity.siddetli, weight: 3 },
  { key: 'cok_siddetli', label: 'Çok şiddetli', color: colors.severity.cok_siddetli, weight: 4 },
];

export const SEVERITY_BY_KEY: Record<SeverityKey, SeverityOption> = SEVERITY_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.key]: opt }),
  {} as Record<SeverityKey, SeverityOption>,
);

export const DEFAULT_SEVERITY: SeverityKey = 'hic';
