-- Semptom raporunu tek transaction'da (atomik) kaydeder.
-- Aynı gün için varsa siler, yeni rapor + kalemleri ekler. Böylece delete+insert
-- arasındaki olası tutarsızlık/veri kaybı önlenir.
-- SECURITY DEFINER olmasına rağmen yalnızca auth.uid() (çağıran hastanın) verisine yazar.
create or replace function public.submit_symptom_report(
  p_log_id uuid,
  p_report_date date,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient uuid := auth.uid();
  v_report_id uuid;
begin
  if v_patient is null then
    raise exception 'Yetkisiz';
  end if;

  delete from public.symptom_reports
   where patient_id = v_patient and report_date = p_report_date;

  insert into public.symptom_reports (patient_id, medication_log_id, report_date, status)
  values (v_patient, p_log_id, p_report_date, 'submitted')
  returning id into v_report_id;

  insert into public.symptom_report_items (report_id, symptom_id, severity)
  select v_report_id, (e ->> 'symptom_id')::uuid, e ->> 'severity'
  from jsonb_array_elements(p_items) e;

  return v_report_id;
end;
$$;

grant execute on function public.submit_symptom_report(uuid, date, jsonb) to authenticated;
