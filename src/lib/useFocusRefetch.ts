import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Ekran her yeniden odaklandığında verileri tazeler (ilk yükleme hariç — onu
 * useAsync zaten yapar). Yönetici panellerinin güncel kalması için kullanılır.
 */
export function useFocusRefetch(refetch: () => void): void {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
