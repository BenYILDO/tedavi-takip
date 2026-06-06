/** Bugünün tarihini YYYY-MM-DD (yerel) olarak döndürür. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Date nesnesini HH:MM:SS (DB time) biçimine çevirir. */
export function toDbTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}:00`;
}

/** HH:MM:SS → HH:MM (gösterim). */
export function formatTime(time: string | null): string {
  if (!time) return '—';
  return time.slice(0, 5);
}

/** ISO tarih/saat → "06.06.2026 14:30" (tr-TR). */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** YYYY-MM-DD → "06.06.2026" (tr-TR). */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}
