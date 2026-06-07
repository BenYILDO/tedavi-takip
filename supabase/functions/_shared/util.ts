import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

export const PATIENT_EMAIL_DOMAIN =
  Deno.env.get('PATIENT_EMAIL_DOMAIN') ?? 'tedavitakip.local';

export const regNoToEmail = (regNo: string): string =>
  `${regNo.trim().toLowerCase()}@${PATIENT_EMAIL_DOMAIN}`;

/** Geçerli kullanıcı adı / kayıt no deseni (e-posta yerel kısmı olarak güvenli). */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

/** Service role (RLS bypass) istemcisi. */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface CallerProfile {
  id: string;
  role: 'admin' | 'researcher' | 'patient';
}

/**
 * Authorization başlığından çağıranın kimliğini doğrular ve profil rolünü döner.
 * Geçersizse null döner.
 */
export async function getCaller(req: Request): Promise<CallerProfile | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error } = await userClient.auth.getUser();
  if (error || !userData.user) return null;

  const admin = adminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile) return null;
  return profile as CallerProfile;
}

export function randomPassword(): string {
  return crypto.randomUUID() + crypto.randomUUID().slice(0, 8);
}

/**
 * Hastaya iletilecek tek kullanımlık aktivasyon kodu. Karıştırılması kolay
 * karakterler (0/O, 1/I/L) dışlanır; okunup yazılması kolay 8 haneli kod.
 */
export function activationCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
