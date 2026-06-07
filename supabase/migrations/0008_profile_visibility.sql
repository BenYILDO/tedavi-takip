-- =====================================================================
-- 0008 — Profil görünürlüğünü daralt
-- 0004'teki profiles_select politikası, her authenticated kullanıcıya
-- role in ('admin','researcher') olan TÜM personel profillerini (ad, telefon)
-- açıyordu. Bu, bir hastanın hiç iletişime geçmediği yöneticinin telefonunu da
-- görmesine yol açıyordu.
--
-- Yeni model:
--   * Herkes kendi profilini görür.
--   * Admin tüm profilleri görür.
--   * Personel (admin/araştırmacı) tüm hasta profillerini görür.
--   * Hasta, yeni sohbet başlatabilmek için araştırmacıları görür.
--   * Hasta, ayrıca yalnızca kendisiyle sohbeti olan personeli görür
--     (örn. kendisine yazan bir yönetici) — telefon/ad inbox'ta görünsün diye.
-- =====================================================================

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.is_staff() and role = 'patient')
    or role = 'researcher'
    or exists (
      select 1 from public.messages m
      where m.staff_id = profiles.id and m.patient_id = auth.uid()
    )
  );
