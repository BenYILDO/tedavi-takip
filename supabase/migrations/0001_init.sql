-- =====================================================================
-- Antikoagülasyon Takip — Başlangıç şeması
-- Tablolar, yardımcı fonksiyonlar ve RLS politikaları
-- =====================================================================

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  role                text not null default 'patient' check (role in ('admin', 'researcher', 'patient')),
  registration_number text unique,
  full_name           text,
  phone               text,
  password_set        boolean not null default false,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now()
);

-- ---------- EĞİTİM İÇERİKLERİ ----------
create table if not exists public.education_sections (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null check (key in ('importance', 'drug_types', 'precautions', 'video', 'complications')),
  title       text not null,
  body        text,
  video_url   text,
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);

-- ---------- SEMPTOM KATALOĞU ----------
create table if not exists public.symptoms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  sort_order  int not null default 0,
  active      boolean not null default true
);

-- ---------- İLAÇ KAYITLARI ----------
create table if not exists public.medication_logs (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.profiles (id) on delete cascade,
  log_date        date not null,
  taken           boolean not null,
  medication_time time,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (patient_id, log_date)
);

-- ---------- SEMPTOM RAPORLARI ----------
create table if not exists public.symptom_reports (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references public.profiles (id) on delete cascade,
  medication_log_id uuid references public.medication_logs (id) on delete set null,
  report_date       date not null,
  status            text not null default 'submitted',
  created_at        timestamptz not null default now()
);

create table if not exists public.symptom_report_items (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.symptom_reports (id) on delete cascade,
  symptom_id uuid not null references public.symptoms (id) on delete cascade,
  severity   text not null check (severity in ('hic', 'hafif', 'orta', 'siddetli', 'cok_siddetli'))
);

-- ---------- MESAJLAR ----------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.profiles (id) on delete cascade,
  sender_role     text not null check (sender_role in ('patient', 'admin')),
  body            text not null,
  created_at      timestamptz not null default now(),
  read_by_admin   boolean not null default false,
  read_by_patient boolean not null default false
);

-- ---------- AYARLAR ----------
create table if not exists public.app_settings (
  key   text primary key,
  value text
);

-- İndeksler
create index if not exists idx_medlogs_date on public.medication_logs (log_date);
create index if not exists idx_reports_date on public.symptom_reports (report_date);
create index if not exists idx_messages_patient on public.messages (patient_id, created_at);
create index if not exists idx_profiles_created_by on public.profiles (created_by);

-- =====================================================================
-- YARDIMCI FONKSİYONLAR (SECURITY DEFINER → RLS özyinelemesini önler)
-- =====================================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'researcher'));
$$;

-- Verilen hasta, çağıran araştırmacının sahipliğinde mi (ya da çağıran admin mi)?
create or replace function public.owns_patient(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = p_id
      and role = 'patient'
      and (created_by = auth.uid() or public.is_admin())
  );
$$;

-- Giriş ekranı için hesap durumu (anon erişebilir).
create or replace function public.account_status(p_reg text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when not exists (select 1 from public.profiles where registration_number = p_reg) then 'not_found'
    when exists (select 1 from public.profiles where registration_number = p_reg and password_set = false) then 'needs_password'
    else 'ready'
  end;
$$;
grant execute on function public.account_status(text) to anon, authenticated;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles            enable row level security;
alter table public.education_sections  enable row level security;
alter table public.symptoms            enable row level security;
alter table public.medication_logs     enable row level security;
alter table public.symptom_reports     enable row level security;
alter table public.symptom_report_items enable row level security;
alter table public.messages            enable row level security;
alter table public.app_settings        enable row level security;

-- ----- profiles -----
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin() or created_by = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ----- education_sections -----
create policy edu_select on public.education_sections for select to authenticated using (true);
create policy edu_admin_all on public.education_sections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- symptoms -----
create policy symptoms_select on public.symptoms for select to authenticated using (true);
create policy symptoms_admin_all on public.symptoms for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- app_settings -----
create policy settings_select on public.app_settings for select to authenticated using (true);
create policy settings_admin_all on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- medication_logs -----
create policy medlogs_select on public.medication_logs for select to authenticated
  using (patient_id = auth.uid() or public.owns_patient(patient_id));
create policy medlogs_insert on public.medication_logs for insert to authenticated
  with check (patient_id = auth.uid());
create policy medlogs_update on public.medication_logs for update to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- ----- symptom_reports -----
create policy reports_select on public.symptom_reports for select to authenticated
  using (patient_id = auth.uid() or public.owns_patient(patient_id));
create policy reports_insert on public.symptom_reports for insert to authenticated
  with check (patient_id = auth.uid());
create policy reports_delete on public.symptom_reports for delete to authenticated
  using (patient_id = auth.uid());

-- ----- symptom_report_items -----
create policy items_select on public.symptom_report_items for select to authenticated
  using (exists (
    select 1 from public.symptom_reports r
    where r.id = report_id and (r.patient_id = auth.uid() or public.owns_patient(r.patient_id))
  ));
create policy items_insert on public.symptom_report_items for insert to authenticated
  with check (exists (
    select 1 from public.symptom_reports r
    where r.id = report_id and r.patient_id = auth.uid()
  ));

-- ----- messages -----
create policy messages_select on public.messages for select to authenticated
  using (patient_id = auth.uid() or public.owns_patient(patient_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (
    (patient_id = auth.uid() and sender_role = 'patient')
    or (public.owns_patient(patient_id) and sender_role = 'admin')
  );
create policy messages_update on public.messages for update to authenticated
  using (patient_id = auth.uid() or public.owns_patient(patient_id))
  with check (patient_id = auth.uid() or public.owns_patient(patient_id));

-- Realtime: mesaj akışı için
alter publication supabase_realtime add table public.messages;
