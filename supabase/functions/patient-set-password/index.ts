import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { adminClient } from '../_shared/util.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { registration_number, password, activation_code } = await req.json();
    const regNo = (registration_number ?? '').toString().trim();
    const pass = (password ?? '').toString();
    const code = (activation_code ?? '').toString().trim().toUpperCase();

    if (!regNo || pass.length < 6 || !code) {
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

    // Aktivasyon kodunu doğrula. Kod, hasta oluşturulurken üretilip araştırmacı
    // tarafından hastaya iletilir; böylece kayıt numarasını bilen biri hesabı
    // ele geçiremez.
    const { data: activation } = await admin
      .from('patient_activation')
      .select('code')
      .eq('patient_id', profile.id)
      .maybeSingle();
    if (!activation || activation.code !== code) {
      return jsonResponse({ error: 'Aktivasyon kodu hatalı. Araştırmacınızla iletişime geçin.' }, 403);
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

    // Aktivasyon kodu tek kullanımlıktır: kullanıldıktan sonra sil.
    await admin.from('patient_activation').delete().eq('patient_id', profile.id);

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Beklenmeyen hata.' }, 500);
  }
});
