import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { adminClient, getCaller, regNoToEmail } from '../_shared/util.ts';

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const caller = await getCaller(req);
    if (!caller || caller.role !== 'admin') {
      return jsonResponse({ error: 'Bu işlem yalnızca yöneticiler içindir.' }, 403);
    }

    const { registration_number, full_name, password, phone } = await req.json();
    const username = (registration_number ?? '').toString().trim().toLowerCase();
    const name = (full_name ?? '').toString().trim();
    const pass = (password ?? '').toString();
    const phoneVal = (phone ?? '').toString().trim();

    if (!username || !name || pass.length < 6) {
      return jsonResponse(
        { error: 'Kullanıcı adı, ad soyad ve en az 6 karakterlik şifre zorunludur.' },
        400,
      );
    }
    if (!phoneVal) {
      return jsonResponse({ error: 'Telefon numarası zorunludur.' }, 400);
    }
    if (!USERNAME_PATTERN.test(username)) {
      return jsonResponse(
        {
          error:
            'Kullanıcı adı harf veya rakamla başlamalı; yalnızca İngilizce küçük harf, rakam, _ ve - içermelidir.',
        },
        400,
      );
    }

    const admin = adminClient();

    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('registration_number', username)
      .maybeSingle();
    if (existing) {
      return jsonResponse({ error: 'Bu kullanıcı adı zaten kullanılıyor.' }, 409);
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: regNoToEmail(username),
      password: pass,
      email_confirm: true,
    });
    if (createErr || !created.user) {
      return jsonResponse({ error: createErr?.message ?? 'Kullanıcı oluşturulamadı.' }, 400);
    }

    const { error: profileErr } = await admin.from('profiles').insert({
      id: created.user.id,
      role: 'researcher',
      registration_number: username,
      full_name: name,
      phone: phoneVal,
      password_set: true,
      created_by: caller.id,
    });
    if (profileErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return jsonResponse({ error: profileErr.message }, 400);
    }

    return jsonResponse({ ok: true, researcher_id: created.user.id });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Beklenmeyen hata.' }, 500);
  }
});
