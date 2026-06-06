import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_SEVERITY, SeverityKey } from '@/constants/severity';
import { Symptom } from '@/types/db';

interface DiaryDraft {
  medicationLogId: string | null;
  symptoms: Symptom[];
  severities: Record<string, SeverityKey>;
  setMedicationLogId: (id: string | null) => void;
  /** Semptom listesini ayarlar ve henüz değeri olmayanları varsayılana çeker. */
  initSymptoms: (symptoms: Symptom[], existing?: Record<string, SeverityKey>) => void;
  setSeverity: (symptomId: string, severity: SeverityKey) => void;
  reset: () => void;
}

const DiaryDraftContext = createContext<DiaryDraft | undefined>(undefined);

export function DiaryDraftProvider({ children }: { children: React.ReactNode }) {
  const [medicationLogId, setMedicationLogId] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [severities, setSeverities] = useState<Record<string, SeverityKey>>({});

  const initSymptoms = useCallback(
    (list: Symptom[], existing?: Record<string, SeverityKey>) => {
      setSymptoms(list);
      setSeverities((prev) => {
        const next: Record<string, SeverityKey> = {};
        for (const s of list) {
          next[s.id] = existing?.[s.id] ?? prev[s.id] ?? DEFAULT_SEVERITY;
        }
        return next;
      });
    },
    [],
  );

  const setSeverity = useCallback((symptomId: string, severity: SeverityKey) => {
    setSeverities((prev) => ({ ...prev, [symptomId]: severity }));
  }, []);

  const reset = useCallback(() => {
    setMedicationLogId(null);
    setSymptoms([]);
    setSeverities({});
  }, []);

  const value = useMemo<DiaryDraft>(
    () => ({
      medicationLogId,
      symptoms,
      severities,
      setMedicationLogId,
      initSymptoms,
      setSeverity,
      reset,
    }),
    [medicationLogId, symptoms, severities, initSymptoms, setSeverity, reset],
  );

  return <DiaryDraftContext.Provider value={value}>{children}</DiaryDraftContext.Provider>;
}

export function useDiaryDraft(): DiaryDraft {
  const ctx = useContext(DiaryDraftContext);
  if (!ctx) throw new Error('useDiaryDraft must be used within DiaryDraftProvider');
  return ctx;
}
