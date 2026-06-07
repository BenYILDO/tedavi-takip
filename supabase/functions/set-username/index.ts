import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { adminClient, getCaller, regNoToEmail, USERNAME_PATTERN } from '../_shared/util.ts';

/**
 * Çağıranın kendi kullanıcı adını (kayıt no) değiştirir. Hem profiles.registration_number
 * hem de auth kullanıcısının e-postası (regno@domain) güncellenir; ikisi senkron kalır.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Yetkisiz.' }, 401);

    const { username } = await req.json();
    const next = (username ?? '').toString().trim().toLowerCase();

    if (!next || !USERNAME_PATTERN.test(next)) {
      return jsonResponse(
        {
          error:
            'Kullanıcı adı harf veya rakamla başlamalı; yalnızca İngilizce küçük harf, rakam, _ ve - içermelidir.',
        },
        400,
      );
    }

    const admin = adminClient();

    // Aynı kullanıcı adı başka birinde var mı?
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('registration_number', next)
      .maybeSingle();
    if (existing && existing.id !== caller.id) {
      return jsonResponse({ error: 'Bu kullanıcı adı zaten kullanılıyor.' }, 409);
    }

    // Önce auth e-postası, sonra profil. E-posta güncellenemezse profil de değişmez.
    const { error: authErr } = await admin.auth.admin.updateUserById(caller.id, {
      email: regNoToEmail(next),
    });
    if (authErr) return jsonResponse({ error: authErr.message }, 400);

    const { error: profErr } = await admin
      .from('profiles')
      .update({ registration_number: next })
      .eq('id', caller.id);
    if (profErr) return jsonResponse({ error: profErr.message }, 400);

    return jsonResponse({ ok: true, username: next });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Beklenmeyen hata.' }, 500);
  }
});
