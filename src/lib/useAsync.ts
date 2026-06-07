import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: (updater: (prev: T | null) => T | null) => void;
}

/**
 * Basit veri-yükleme hook'u: ilk yüklemede çalışır, refetch + iyimser güncelleme sağlar.
 * deps değiştiğinde yeniden çalışır.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasData = useRef(false);

  const run = useCallback(async () => {
    // Tam ekran "yükleniyor" yalnızca ilk yüklemede (henüz veri yokken) gösterilir.
    // Böylece odak/çekerek tazeleme sırasında ekran çakmaz; mevcut veri ekranda kalır.
    if (!hasData.current) setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setDataState(result);
      hasData.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    setDataState((prev) => updater(prev));
  }, []);

  return { data, loading, error, refetch: run, setData };
}
