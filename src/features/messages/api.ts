import { supabase } from '@/lib/supabase';
import { Message } from '@/types/db';

export async function listMessages(patientId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

export async function sendMessage(
  patientId: string,
  body: string,
  senderRole: 'patient' | 'admin',
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ patient_id: patientId, body: body.trim(), sender_role: senderRole })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Message;
}

/** Karşı tarafın mesajlarını okundu işaretler. */
export async function markMessagesRead(
  patientId: string,
  reader: 'patient' | 'admin',
): Promise<void> {
  const column = reader === 'patient' ? 'read_by_patient' : 'read_by_admin';
  const otherRole = reader === 'patient' ? 'admin' : 'patient';
  await supabase
    .from('messages')
    .update({ [column]: true })
    .eq('patient_id', patientId)
    .eq('sender_role', otherRole)
    .eq(column, false);
}
