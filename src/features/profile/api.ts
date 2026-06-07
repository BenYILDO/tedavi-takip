import { readFunctionError } from '@/lib/functionError';
import { supabase } from '@/lib/supabase';

/** Kendi profilinin güvenli alanlarını günceller (RLS: yalnızca kendi satırı). */
export async function updateOwnProfile(
  userId: string,
  patch: { full_name?: string; phone?: string; phone_hidden?: boolean; avatar_url?: string | null },
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(error.message);
}

/** Kullanıcı adını (kayıt no) değiştirir; auth e-postası da güncellenir. */
export async function changeUsername(username: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('set-username', {
    body: { username: username.trim().toLowerCase() },
  });
  if (error) throw new Error(await readFunctionError(error, 'Kullanıcı adı değiştirilemedi.'));
  return (data as { username?: string })?.username ?? username.trim().toLowerCase();
}

/** Hesabı ve tüm verileri kalıcı olarak siler. */
export async function deleteOwnAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw new Error(await readFunctionError(error, 'Hesap silinemedi.'));
}

/**
 * Seçilen görseli avatars bucket'ına yükler ve public URL döndürür.
 * Yol: <userId>/avatar-<zaman>.<uzantı> (storage RLS yalnızca kendi klasörüne izin verir).
 */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const resp = await fetch(uri);
  const arrayBuffer = await resp.arrayBuffer();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType, upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
