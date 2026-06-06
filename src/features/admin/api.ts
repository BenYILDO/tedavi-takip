import { SeverityKey } from '@/constants/severity';
import { supabase } from '@/lib/supabase';
import {
  EducationSection,
  MedicationLog,
  Message,
  Profile,
  Symptom,
  SymptomReport,
  SymptomReportItem,
} from '@/types/db';

/** Tüm hastalar — her personel (admin/araştırmacı) tüm hastaları görür. */
export async function listPatients(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'patient')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function listResearchers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'researcher')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function createPatient(registrationNumber: string, fullName: string): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-create-patient', {
    body: { registration_number: registrationNumber.trim(), full_name: fullName.trim() },
  });
  if (error) throw new Error(await readFunctionError(error, 'Hasta oluşturulamadı.'));
}

export async function createResearcher(
  username: string,
  fullName: string,
  password: string,
  phone: string,
): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-create-researcher', {
    body: {
      registration_number: username.trim(),
      full_name: fullName.trim(),
      password,
      phone: phone.trim(),
    },
  });
  if (error) throw new Error(await readFunctionError(error, 'Araştırmacı oluşturulamadı.'));
}

/** Kalemleri ve semptom adıyla birlikte gömülü semptom raporu. */
export type ReportWithItems = SymptomReport & {
  items: (SymptomReportItem & { symptom: Symptom })[];
};

export interface PatientReportFeedItem {
  log: MedicationLog;
  patient: Pick<Profile, 'id' | 'full_name' | 'registration_number'>;
  report: ReportWithItems | null;
}

/** Belirli bir gün için tüm hastaların ilaç kayıtları + semptom raporları. */
export async function getReportsForDate(date: string): Promise<PatientReportFeedItem[]> {
  const { data: logs, error } = await supabase
    .from('medication_logs')
    .select('*, patient:profiles!medication_logs_patient_id_fkey(id, full_name, registration_number)')
    .eq('log_date', date)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);

  const { data: reports, error: rErr } = await supabase
    .from('symptom_reports')
    .select('*, items:symptom_report_items(*, symptom:symptoms(*))')
    .eq('report_date', date);
  if (rErr) throw new Error(rErr.message);

  const reportByPatient = new Map<string, ReportWithItems>();
  ((reports ?? []) as ReportWithItems[]).forEach((r) => {
    reportByPatient.set(r.patient_id, r);
  });

  return (logs ?? []).map((l) => {
    const log = l as MedicationLog & {
      patient: Pick<Profile, 'id' | 'full_name' | 'registration_number'>;
    };
    return {
      log,
      patient: log.patient,
      report: reportByPatient.get(log.patient_id) ?? null,
    };
  });
}

export interface PatientHistory {
  logs: MedicationLog[];
  reports: ReportWithItems[];
}

export async function getPatientHistory(patientId: string): Promise<PatientHistory> {
  const { data: logs, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('patient_id', patientId)
    .order('log_date', { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);

  const { data: reports, error: rErr } = await supabase
    .from('symptom_reports')
    .select('*, items:symptom_report_items(*, symptom:symptoms(*))')
    .eq('patient_id', patientId)
    .order('report_date', { ascending: false })
    .limit(60);
  if (rErr) throw new Error(rErr.message);

  return { logs: (logs ?? []) as MedicationLog[], reports: (reports ?? []) as ReportWithItems[] };
}

/** Mesajı olan hastalar + okunmamış (admin tarafı) sayıları. */
export interface MessageThreadSummary {
  patient: Pick<Profile, 'id' | 'full_name' | 'registration_number'>;
  lastMessage: Message;
  unread: number;
}

export async function listMessageThreads(): Promise<MessageThreadSummary[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, patient:profiles!messages_patient_id_fkey(id, full_name, registration_number)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const byPatient = new Map<string, MessageThreadSummary>();
  (data ?? []).forEach((row) => {
    const msg = row as Message & {
      patient: Pick<Profile, 'id' | 'full_name' | 'registration_number'>;
    };
    const existing = byPatient.get(msg.patient_id);
    if (!existing) {
      byPatient.set(msg.patient_id, {
        patient: msg.patient,
        lastMessage: msg,
        unread: msg.sender_role === 'patient' && !msg.read_by_admin ? 1 : 0,
      });
    } else if (msg.sender_role === 'patient' && !msg.read_by_admin) {
      existing.unread += 1;
    }
  });
  return Array.from(byPatient.values());
}

// ---- İçerik yönetimi (yalnızca admin) ----

export async function listEducationSections(): Promise<EducationSection[]> {
  const { data, error } = await supabase
    .from('education_sections')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EducationSection[];
}

export async function updateEducationSection(
  id: string,
  patch: Partial<Pick<EducationSection, 'title' | 'body' | 'video_url'>>,
): Promise<void> {
  const { error } = await supabase
    .from('education_sections')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase.from('app_settings').upsert({ key, value });
  if (error) throw new Error(error.message);
}

async function readFunctionError(error: unknown, fallback: string): Promise<string> {
  // supabase functions invoke FunctionsHttpError'da context.json() ile gövde okunabilir.
  try {
    const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    if (ctx?.json) {
      const body = await ctx.json();
      if (body?.error) return body.error;
    }
  } catch {
    /* yoksay */
  }
  return error instanceof Error ? error.message : fallback;
}

export type { SeverityKey };
