-- =====================================================================
-- 0010 — Profil fotoğrafları için Storage bucket'ı
-- Her kullanıcı yalnızca kendi klasörüne (<user_id>/...) yazabilir; okuma public.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Okuma herkese açık (public URL ile gösterim).
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects for select to public
  using (bucket_id = 'avatars');

-- Yazma/güncelleme/silme yalnızca kendi klasörüne (ilk yol parçası = auth.uid()).
drop policy if exists avatars_insert on storage.objects;
create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update on storage.objects;
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete on storage.objects;
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
