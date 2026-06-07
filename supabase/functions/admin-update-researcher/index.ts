import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { adminClient, getCaller, regNoToEmail, USERNAME_PATTERN } from '../_shared/util.ts';

/**
 * Yönetici, bir araştırmacının bilgilerini günceller: ad soyad, telefon,
 * telefon gizliliği, kullanıcı adı (auth e-postası ile senkron) ve isteğe bağlı
 * yeni şifre.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const caller = await getCaller(req);
    if (!caller || caller.role !== 'admin') {
      return jsonResponse({ error: 'Bu işlem yalnızca yöneticiler içindir.' }, 403);
    }

    const { researcher_id, full_name, phone, phone_hidden, username, password } = await req.json();
    const targetId = (researcher_id ?? '').toString();
    if (!targetId) return jsonResponse({ error: 'researcher_id zorunludur.' }, 400);

    const admin = adminClient();

    const { data: target } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', targetId)
      .maybeSingle();
    if (!target || target.role !== 'researcher') {
      return jsonResponse({ error: 'Araştırmacı bulunamadı.' }, 404);
    }

    const name = (full_name ?? '').toString().trim();
    if (!name) return jsonResponse({ error: 'Ad soyad zorunludur.' }, 400);
    const phoneVal = (phone ?? '').toString().trim();
    if (!phoneVal) return jsonResponse({ error: 'Telefon numarası zorunludur.' }, 400);

    // Kullanıcı adı değişiyorsa doğrula + benzersizlik + auth e-postasını güncelle.
    const nextUsername = (username ?? '').toString().trim().toLowerCase();
    if (nextUsername) {
      if (!USERNAME_PATTERN.test(nextUsername)) {
        return jsonResponse(
          {
            error:
              'Kullanıcı adı harf veya rakamla başlamalı; yalnızca İngilizce küçük harf, rakam, _ ve - içermelidir.',
          },
          400,
        );
      }
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('registration_number', nextUsername)
        .maybeSingle();
      if (existing && existing.id !== targetId) {
        return jsonResponse({ error: 'Bu kullanıcı adı zaten kullanılıyor.' }, 409);
      }
      const { error: emailErr } = await admin.auth.admin.updateUserById(targetId, {
        email: regNoToEmail(nextUsername),
      });
      if (emailErr) return jsonResponse({ error: emailErr.message }, 400);
    }

    // İsteğe bağlı şifre sıfırlama.
    const pass = (password ?? '').toString();
    if (pass) {
      if (pass.length < 6) {
        return jsonResponse({ error: 'Şifre en az 6 karakter olmalıdır.' }, 400);
      }
      const { error: passErr } = await admin.auth.admin.updateUserById(targetId, {
        password: pass,
      });
      if (passErr) return jsonResponse({ error: passErr.message }, 400);
    }

    const patch: Record<string, unknown> = {
      full_name: name,
      phone: phoneVal,
      phone_hidden: !!phone_hidden,
    };
    if (nextUsername) patch.registration_number = nextUsername;

    const { error: profErr } = await admin.from('profiles').update(patch).eq('id', targetId);
    if (profErr) return jsonResponse({ error: profErr.message }, 400);

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Beklenmeyen hata.' }, 500);
  }
});
