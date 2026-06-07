import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { adminClient, getCaller } from '../_shared/util.ts';

/**
 * Çağıranın kendi hesabını ve tüm verilerini siler.
 * Auth kullanıcısı silinince public.profiles ve ona bağlı tüm tablolar
 * (medication_logs, symptom_reports, messages, push_tokens, patient_activation)
 * `on delete cascade` ile temizlenir.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Yetkisiz.' }, 401);

    const admin = adminClient();

    // Son admin'in kendini silmesini engelle (sistem kilitlenmesin).
    if (caller.role === 'admin') {
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');
      if ((count ?? 0) <= 1) {
        return jsonResponse(
          { error: 'Tek yönetici hesabı silinemez. Önce başka bir yönetici atayın.' },
          409,
        );
      }
    }

    const { error } = await admin.auth.admin.deleteUser(caller.id);
    if (error) return jsonResponse({ error: error.message }, 400);

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Beklenmeyen hata.' }, 500);
  }
});
