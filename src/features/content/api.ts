import { supabase } from '@/lib/supabase';
import { EducationKey, EducationSection } from '@/types/db';

export async function getEducationSection(key: EducationKey): Promise<EducationSection | null> {
  const { data, error } = await supabase
    .from('education_sections')
    .select('*')
    .eq('key', key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as EducationSection | null;
}

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.value as string | undefined) ?? null;
}
