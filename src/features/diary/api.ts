import { SeverityKey } from '@/constants/severity';
import { todayISO } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import { MedicationLog, Symptom, SymptomReport, SymptomReportItem } from '@/types/db';

export async function getTodayLog(patientId: string): Promise<MedicationLog | null> {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('patient_id', patientId)
    .eq('log_date', todayISO())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as MedicationLog | null;
}

export async function upsertMedicationLog(
  patientId: string,
  taken: boolean,
  medicationTime: string | null,
): Promise<MedicationLog> {
  const { data, error } = await supabase
    .from('medication_logs')
    .upsert(
      {
        patient_id: patientId,
        log_date: todayISO(),
        taken,
        medication_time: medicationTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id,log_date' },
    )
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as MedicationLog;
}

export async function listSymptoms(): Promise<Symptom[]> {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Symptom[];
}

export interface TodayReport {
  report: SymptomReport;
  items: SymptomReportItem[];
}

export async function getTodayReport(patientId: string): Promise<TodayReport | null> {
  const { data: report, error } = await supabase
    .from('symptom_reports')
    .select('*')
    .eq('patient_id', patientId)
    .eq('report_date', todayISO())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!report) return null;

  const { data: items, error: itemsError } = await supabase
    .from('symptom_report_items')
    .select('*')
    .eq('report_id', (report as SymptomReport).id);
  if (itemsError) throw new Error(itemsError.message);

  return { report: report as SymptomReport, items: (items ?? []) as SymptomReportItem[] };
}

/**
 * Bugünün semptom raporunu kaydeder. Sunucudaki atomik RPC (tek transaction) ile
 * aynı gün için varsa siler ve yeni rapor + kalemleri ekler. Böylece delete+insert
 * arasındaki tutarsızlık/veri kaybı riski olmaz ve rapor güncellenebilir kalır.
 */
export async function submitSymptomReport(
  _patientId: string,
  medicationLogId: string | null,
  severities: Record<string, SeverityKey>,
): Promise<void> {
  const items = Object.entries(severities).map(([symptom_id, severity]) => ({
    symptom_id,
    severity,
  }));

  const { error } = await supabase.rpc('submit_symptom_report', {
    p_log_id: medicationLogId,
    p_report_date: todayISO(),
    p_items: items,
  });
  if (error) throw new Error(error.message);
}
