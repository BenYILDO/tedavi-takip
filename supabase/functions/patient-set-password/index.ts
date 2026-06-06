import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { adminClient } from '../_shared/util.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { registration_number, password } = await req.json();
    const regNo = (registration_number ?? '').toString().trim();
    const pass = (password ?? '').toString();

    if (!regNo || pass.length < 6) {
      return jsonResponse({ error: 'Geçersiz istek.' }, 400);
    }

    const admin = adminClient();

    const { data: profile } = await admin
      .from('profiles')
      .select('id, password_set, role')
      .eq('registration_number', regNo)
      .maybeSingle();

    if (!profile) {
      return jsonResponse({ error: 'Hesap bulunamadı.' }, 404);
    }
    // Yalnızca ilk kurulum: zaten şifre belirlenmişse reddet (başkasının şifresini
    // sıfırlamayı önler).
    if (profile.password_set || profile.role !== 'patient') {
      return jsonResponse({ error: 'Şifre zaten belirlenmiş. Lütfen giriş yapın.' }, 409);
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(profile.id, {
      password: pass,
    });
    if (updErr) {
      return jsonResponse({ error: updErr.message }, 400);
    }

    const { error: profErr } = await admin
      .from('profiles')
      .update({ password_set: true })
      .eq('id', profile.id);
    if (profErr) {
      return jsonResponse({ error: profErr.message }, 400);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Beklenmeyen hata.' }, 500);
  }
});
