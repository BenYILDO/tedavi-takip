-- =====================================================================
-- 0007 — Hasta hesabı aktivasyon kodu (hesap ele geçirmeyi önler)
-- Önceki durumda patient-set-password yalnızca kayıt numarası + password_set=false
-- kontrolü yapıyordu. Kayıt numaraları tahmin edilebilir olduğundan ve
-- account_status anon erişiminde 'needs_password' döndürdüğünden, bir saldırgan
-- henüz aktive edilmemiş bir hasta hesabına önce şifre belirleyerek hesabı
-- ele geçirebiliyordu.
--
-- Çözüm: hasta oluşturulurken araştırmacının hastaya ileteceği tek kullanımlık
-- bir aktivasyon kodu üretilir. İlk şifre belirlemede bu kod doğrulanır ve
-- kullanıldıktan sonra silinir. Kod ayrı bir tabloda tutulur; RLS ile hiçbir
-- istemci (anon/authenticated) erişemez, yalnızca service_role (Edge Functions)
-- okuyup yazar.
-- =====================================================================

create table if not exists public.patient_activation (
  patient_id uuid primary key references public.profiles (id) on delete cascade,
  code       text not null,
  created_at timestamptz not null default now()
);

alter table public.patient_activation enable row level security;
-- Bilinçli olarak hiçbir politika tanımlanmaz: authenticated/anon erişemez.
-- service_role RLS'ten muaf olduğu için Edge Functions okuyup yazabilir.
