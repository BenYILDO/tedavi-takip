import { supabase } from '@/lib/supabase';

/** Cihazın Expo push token'ını kullanıcıya bağlı olarak kaydeder/günceller. */
export async function savePushToken(
  userId: string,
  token: string,
  platform: string,
): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { token, user_id: userId, platform, updated_at: new Date().toISOString() },
      { onConflict: 'token' },
    );
  if (error) console.warn('[push] token kaydedilemedi', error.message);
}

/** Cihaz token'ını siler (çıkışta çağrılır → bildirim almayı durdurur). */
export async function deletePushToken(token: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);
  if (error) console.warn('[push] token silinemedi', error.message);
}

/** Yeni mesaj için karşı tarafa push bildirimi tetikler (best-effort). */
export async function notifyNewMessage(messageId: string): Promise<void> {
  try {
    await supabase.functions.invoke('notify-message', { body: { message_id: messageId } });
  } catch (e) {
    console.warn('[push] mesaj bildirimi gönderilemedi', e);
  }
}
