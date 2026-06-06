import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { adminClient, getCaller, randomPassword, regNoToEmail } from '../_shared/util.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const caller = await getCaller(req);
    if (!caller || (caller.role !== 'admin' && caller.role !== 'researcher')) {
      return jsonResponse({ error: 'Yetkisiz işlem.' }, 403);
    }

    const { registration_number, full_name } = await req.json();
    const regNo = (registration_number ?? '').toString().trim();
    if (!regNo) {
      return jsonResponse({ error: 'Kayıt numarası zorunludur.' }, 400);
    }

    const admin = adminClient();

    // Kayıt numarası daha önce kullanılmış mı?
    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('registration_number', regNo)
      .maybeSingle();
    if (existing) {
      return jsonResponse({ error: 'Bu kayıt numarası zaten kullanılıyor.' }, 409);
    }

    // Auth kullanıcısı oluştur (geçici şifre; hasta ilk girişte değiştirir).
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: regNoToEmail(regNo),
      password: randomPassword(),
      email_confirm: true,
    });
    if (createErr || !created.user) {
      return jsonResponse({ error: createErr?.message ?? 'Kullanıcı oluşturulamadı.' }, 400);
    }

    const { error: profileErr } = await admin.from('profiles').insert({
      id: created.user.id,
      role: 'patient',
      registration_number: regNo,
      full_name: (full_name ?? '').toString().trim() || null,
      password_set: false,
      created_by: caller.id,
    });
    if (profileErr) {
      // Profil eklenemezse auth kullanıcısını geri al.
      await admin.auth.admin.deleteUser(created.user.id);
      return jsonResponse({ error: profileErr.message }, 400);
    }

    return jsonResponse({ ok: true, patient_id: created.user.id });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Beklenmeyen hata.' }, 500);
  }
});
