import { SeverityKey } from '@/constants/severity';

export type Role = 'admin' | 'researcher' | 'patient';

export interface Profile {
  id: string;
  role: Role;
  registration_number: string | null;
  full_name: string | null;
  phone: string | null;
  password_set: boolean;
  created_by: string | null;
  created_at: string;
}

/** education_sections.key değerleri (sabit içerik anahtarları). */
export type EducationKey =
  | 'importance'
  | 'drug_types'
  | 'precautions'
  | 'video'
  | 'complications';

export interface EducationSection {
  id: string;
  key: EducationKey;
  title: string;
  body: string | null;
  video_url: string | null;
  sort_order: number;
  updated_at: string;
}

export interface Symptom {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
}

export interface MedicationLog {
  id: string;
  patient_id: string;
  log_date: string; // YYYY-MM-DD
  taken: boolean;
  medication_time: string | null; // HH:MM:SS
  created_at: string;
  updated_at: string;
}

export interface SymptomReport {
  id: string;
  patient_id: string;
  medication_log_id: string | null;
  report_date: string;
  status: string;
  created_at: string;
}

export interface SymptomReportItem {
  id: string;
  report_id: string;
  symptom_id: string;
  severity: SeverityKey;
}

export interface Message {
  id: string;
  patient_id: string;
  sender_role: 'patient' | 'admin';
  body: string;
  created_at: string;
  read_by_admin: boolean;
  read_by_patient: boolean;
}

export interface AppSetting {
  key: string;
  value: string | null;
}
