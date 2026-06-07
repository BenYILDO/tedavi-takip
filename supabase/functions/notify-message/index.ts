import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { adminClient, getCaller } from '../_shared/util.ts';

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  phone_hidden: boolean | null;
  role: string;
}

/**
 * Yeni bir mesaj için karşı tarafa push bildirimi gönderir.
 * İstemci, mesajı (RLS ile) ekledikten sonra bu fonksiyonu message_id ile çağırır.
 * Alıcı: gönderen personelse hasta, gönderen hastaysa o personeldir.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Yetkisiz.' }, 401);

    const { message_id } = await req.json();
    if (!message_id) return jsonResponse({ error: 'message_id zorunludur.' }, 400);

    const admin = adminClient();

    const { data: msg } = await admin
      .from('messages')
      .select('id, patient_id, staff_id, sender_role, body')
      .eq('id', message_id)
      .maybeSingle();
    if (!msg) return jsonResponse({ error: 'Mesaj bulunamadı.' }, 404);

    // Yalnızca mesajın göndereni bildirimi tetikleyebilir.
    const senderIsStaff = msg.sender_role === 'staff';
    const senderId = senderIsStaff ? msg.staff_id : msg.patient_id;
    if (caller.id !== senderId) return jsonResponse({ error: 'Yetkisiz.' }, 403);

    const recipientId = senderIsStaff ? msg.patient_id : msg.staff_id;

    const { data: people } = await admin
      .from('profiles')
      .select('id, full_name, phone, phone_hidden, role')
      .in('id', [msg.patient_id, msg.staff_id]);
    const profiles = (people ?? []) as ProfileRow[];
    const staffP = profiles.find((p) => p.id === msg.staff_id);
    const patientP = profiles.find((p) => p.id === msg.patient_id);

    // Personel telefonunu gizlediyse hastaya numara iletme.
    const staffPhoneForPatient = staffP?.phone_hidden ? '' : staffP?.phone ?? '';

    const title = senderIsStaff
      ? staffP?.full_name || 'Yeni mesaj'
      : patientP?.full_name || 'Hasta';
    const body = msg.body.length > 120 ? `${msg.body.slice(0, 117)}…` : msg.body;

    const { data: tokenRows } = await admin
      .from('push_tokens')
      .select('token')
      .eq('user_id', recipientId);
    const tokens = (tokenRows ?? []).map((t) => (t as { token: string }).token);
    if (tokens.length === 0) return jsonResponse({ ok: true, sent: 0 });

    const data = {
      type: 'message',
      patientId: msg.patient_id,
      staffId: msg.staff_id,
      staffName: staffP?.full_name ?? '',
      staffPhone: staffPhoneForPatient,
      patientName: patientP?.full_name ?? '',
    };

    const pushMessages = tokens.map((to) => ({
      to,
      title,
      body,
      sound: 'default',
      channelId: 'default',
      data,
    }));

    const resp = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushMessages),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return jsonResponse({ error: `Push gönderilemedi: ${text}` }, 502);
    }

    return jsonResponse({ ok: true, sent: tokens.length });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Beklenmeyen hata.' }, 500);
  }
});
