/**
 * O an açık olan sohbeti (patientId:staffId) izler. Uygulama‑içi mesaj banner'ı,
 * kullanıcı zaten o sohbeti görüntülüyorsa bildirim göstermemek için buna bakar.
 */
let activeKey: string | null = null;

export const threadKey = (patientId: string, staffId: string): string => `${patientId}:${staffId}`;

export function setActiveThread(patientId: string, staffId: string): void {
  activeKey = threadKey(patientId, staffId);
}

export function clearActiveThread(patientId: string, staffId: string): void {
  // Yalnızca hâlâ bu sohbet aktifse temizle (yarış durumlarını önler).
  if (activeKey === threadKey(patientId, staffId)) activeKey = null;
}

export function isThreadActive(patientId: string, staffId: string): boolean {
  return activeKey === threadKey(patientId, staffId);
}
