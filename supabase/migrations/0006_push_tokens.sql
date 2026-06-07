-- =====================================================================
-- 0006 — Push bildirim cihaz token'ları
-- Her kullanıcının bir veya daha fazla cihazının Expo push token'ını tutar.
-- Bildirim gönderimi Edge Function (service_role) tarafından yapılır.
-- =====================================================================

create table if not exists public.push_tokens (
  token      text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  platform   text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_tokens_user on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

-- Kullanıcı yalnızca kendi token'larını yönetir.
create policy push_tokens_select on public.push_tokens for select to authenticated
  using (user_id = auth.uid());
create policy push_tokens_insert on public.push_tokens for insert to authenticated
  with check (user_id = auth.uid());
create policy push_tokens_update on public.push_tokens for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_tokens_delete on public.push_tokens for delete to authenticated
  using (user_id = auth.uid());
