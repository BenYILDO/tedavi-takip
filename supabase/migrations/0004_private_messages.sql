-- =====================================================================
-- 0004 — Özel (gizli) mesaj sohbetleri
-- Her sohbet (patient_id, staff_id) çiftine aittir ve yalnızca bu iki
-- tarafa görünür. Önceki model tüm personele ortak bir hasta sohbeti
-- gösteriyordu; bu da bir personelin mesajının başkasınca görülmesine
-- yol açıyordu. Bu migrasyon mesajları kişiye özel hale getirir.
-- =====================================================================

-- ---------- messages: muhatap personel + alanlar ----------
alter table public.messages
  add column if not exists staff_id uuid references public.profiles (id) on delete cascade;

-- Eski mesajlar tek ortak sohbet modeline aitti ve belirli bir personele
-- eşlenemez; yeni gizli modele taşınamayacağı için temizlenir.
delete from public.messages where staff_id is null;

alter table public.messages alter column staff_id set not null;

-- sender_role artık 'patient' | 'staff' (eski 'admin' → 'staff').
alter table public.messages drop constraint if exists messages_sender_role_check;
update public.messages set sender_role = 'staff' where sender_role = 'admin';
alter table public.messages
  add constraint messages_sender_role_check check (sender_role in ('patient', 'staff'));

-- Okundu bayrağı: admin → staff.
alter table public.messages rename column read_by_admin to read_by_staff;

create index if not exists idx_messages_thread
  on public.messages (patient_id, staff_id, created_at);

-- ---------- RLS: sohbet yalnızca iki tarafına görünür ----------
drop policy if exists messages_select on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_update on public.messages;

create policy messages_select on public.messages for select to authenticated
  using (patient_id = auth.uid() or staff_id = auth.uid());

create policy messages_insert on public.messages for insert to authenticated
  with check (
    -- Hasta, bir personelle olan kendi sohbetine yazıyor.
    (
      patient_id = auth.uid()
      and sender_role = 'patient'
      and exists (
        select 1 from public.profiles s
        where s.id = staff_id and s.role in ('admin', 'researcher')
      )
    )
    -- Personel, kendi hastasıyla olan sohbetine yazıyor.
    or (
      staff_id = auth.uid()
      and sender_role = 'staff'
      and public.is_staff()
      and exists (
        select 1 from public.profiles p
        where p.id = patient_id and p.role = 'patient'
      )
    )
  );

create policy messages_update on public.messages for update to authenticated
  using (patient_id = auth.uid() or staff_id = auth.uid())
  with check (patient_id = auth.uid() or staff_id = auth.uid());

-- ---------- profiles: personel profilleri herkese görünür ----------
-- Hasta, inbox'ta konuştuğu personelin adını/telefonunu; "Yeni mesaj"da
-- araştırmacı listesini görebilmeli.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.is_staff() and role = 'patient')
    or role in ('admin', 'researcher')
  );
