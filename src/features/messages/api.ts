import { supabase } from '@/lib/supabase';
import { Message, Profile } from '@/types/db';

/** Sohbet listelerinde gösterilen personel özeti (maskeli telefon dahil). */
export type StaffSummary = Pick<
  Profile,
  'id' | 'full_name' | 'phone' | 'role' | 'registration_number' | 'avatar_url'
>;

/** staff_public görünümünden seçilecek alanlar (telefon RLS'te maskelenir). */
const STAFF_PUBLIC_COLS = 'id, full_name, phone, role, registration_number, avatar_url';

/** Belirli bir (hasta, personel) sohbetinin mesajları. */
export async function listMessages(patientId: string, staffId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('patient_id', patientId)
    .eq('staff_id', staffId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

export async function sendMessage(
  patientId: string,
  staffId: string,
  body: string,
  senderRole: 'patient' | 'staff',
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ patient_id: patientId, staff_id: staffId, body: body.trim(), sender_role: senderRole })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Message;
}

/** Bu sohbette karşı tarafın mesajlarını okundu işaretler. */
export async function markMessagesRead(
  patientId: string,
  staffId: string,
  reader: 'patient' | 'staff',
): Promise<void> {
  const column = reader === 'patient' ? 'read_by_patient' : 'read_by_staff';
  const otherRole = reader === 'patient' ? 'staff' : 'patient';
  await supabase
    .from('messages')
    .update({ [column]: true })
    .eq('patient_id', patientId)
    .eq('staff_id', staffId)
    .eq('sender_role', otherRole)
    .eq(column, false);
}

// ---- Hasta tarafı: inbox ----

/** Hastanın konuştuğu her personel için bir sohbet özeti. */
export interface PatientThreadSummary {
  staff: StaffSummary;
  lastMessage: Message;
  unread: number;
}

export async function listPatientThreads(patientId: string): Promise<PatientThreadSummary[]> {
  // Mesajları çek (personel telefonu için profiles join'i yapılmaz; maskeli
  // telefon staff_public görünümünden ayrıca alınır).
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const messages = (data ?? []) as Message[];
  const staffIds = Array.from(new Set(messages.map((m) => m.staff_id)));
  if (staffIds.length === 0) return [];

  // Personel bilgileri (telefon gizliyse null gelir).
  const { data: staffRows, error: sErr } = await supabase
    .from('staff_public')
    .select(STAFF_PUBLIC_COLS)
    .in('id', staffIds);
  if (sErr) throw new Error(sErr.message);
  const staffById = new Map<string, StaffSummary>();
  (staffRows ?? []).forEach((s) => staffById.set((s as StaffSummary).id, s as StaffSummary));

  const byStaff = new Map<string, PatientThreadSummary>();
  messages.forEach((msg) => {
    const staff = staffById.get(msg.staff_id);
    if (!staff) return;
    const existing = byStaff.get(msg.staff_id);
    if (!existing) {
      byStaff.set(msg.staff_id, {
        staff,
        lastMessage: msg,
        unread: msg.sender_role === 'staff' && !msg.read_by_patient ? 1 : 0,
      });
    } else if (msg.sender_role === 'staff' && !msg.read_by_patient) {
      existing.unread += 1;
    }
  });
  return Array.from(byStaff.values());
}

/** Hastanın yeni sohbet başlatabileceği araştırmacılar (maskeli telefon). */
export async function listResearchersForPatient(): Promise<StaffSummary[]> {
  const { data, error } = await supabase
    .from('staff_public')
    .select(STAFF_PUBLIC_COLS)
    .eq('role', 'researcher')
    .order('full_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffSummary[];
}
