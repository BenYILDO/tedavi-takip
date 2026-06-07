-- =====================================================================
-- 0009 — Profil alanları: avatar, telefon gizliliği + maskeli personel görünümü
-- Profil/Ayarlar ekranı için: profil fotoğrafı (avatar_url) ve personelin
-- telefonunu hastalardan gizleyebilmesi (phone_hidden).
-- =====================================================================

alter table public.profiles
  add column if not exists avatar_url   text,
  add column if not exists phone_hidden boolean not null default false;

-- Sütun düzeyi update yetkisini genişlet (0005 yalnızca full_name, phone vermişti).
-- registration_number / role / password_set hâlâ yalnızca service_role tarafından
-- değiştirilebilir (yetki yükseltmesini önler).
grant update (full_name, phone, phone_hidden, avatar_url) on public.profiles to authenticated;

-- ---------- Hastaya açık, maskeli personel görünümü ----------
-- Hasta personelin telefonunu yalnızca gizli değilse görür. security_invoker=on
-- olduğundan görünüm sorgulayan kullanıcının profiles RLS'ine (0008) tabidir:
-- hasta yalnızca araştırmacıları + sohbet ettiği personeli görür.
create or replace view public.staff_public
  with (security_invoker = on) as
  select
    id,
    full_name,
    role,
    registration_number,
    avatar_url,
    case when phone_hidden then null else phone end as phone
  from public.profiles
  where role in ('admin', 'researcher');

grant select on public.staff_public to authenticated;
