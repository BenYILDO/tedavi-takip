/**
 * supabase.functions.invoke FunctionsHttpError'da hata gövdesi context.json()
 * ile okunabilir. Edge Function'ın döndürdüğü { error } mesajını çıkarır;
 * okunamazsa fallback döner.
 */
export async function readFunctionError(error: unknown, fallback: string): Promise<string> {
  try {
    const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    if (ctx?.json) {
      const body = await ctx.json();
      if (body?.error) return body.error;
    }
  } catch {
    /* yoksay */
  }
  return error instanceof Error ? error.message : fallback;
}
