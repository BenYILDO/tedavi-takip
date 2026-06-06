-- Eğitim videosu ve görselleri için herkese açık (public) Storage bucket'ı.
-- Yükleme araştırmacı/admin tarafından Supabase panelinden yapılır;
-- okuma herkese açıktır (public read).
insert into storage.buckets (id, name, public)
values ('education-media', 'education-media', true)
on conflict (id) do nothing;
