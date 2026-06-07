-- =====================================================================
-- 0005 — Profil güncellemelerinde yetki yükseltmesini engelle
-- =====================================================================
-- Önceki durumda profiles_update_self politikası kullanıcının kendi
-- satırındaki HER sütunu değiştirmesine izin veriyordu. Bu da bir hastanın
-- (herkese açık anon anahtarla) kendi role alanını 'admin' yaparak yetki
-- yükseltmesine olanak tanıyordu.
--
-- Çözüm: sütun düzeyinde GRANT ile authenticated rolünün yalnızca güvenli
-- alanları (full_name, phone) güncellemesine izin verilir. role,
-- registration_number, password_set, created_by gibi alanlar yalnızca
-- service_role (Edge Functions) tarafından değiştirilebilir; o rol bu
-- kısıttan ve RLS'ten muaftır.

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- RLS politikası aynı kalır (kullanıcı yalnızca kendi satırını günceller);
-- ek olarak artık yalnızca izin verilen sütunları değiştirebilir.
