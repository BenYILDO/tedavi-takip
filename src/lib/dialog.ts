import { Alert, Platform } from 'react-native';

/**
 * Platforma duyarlı onay kutusu. React Native'in Alert.alert buton geri çağırmaları
 * web'de çalışmadığından, web'de window.confirm kullanılır.
 */
export function confirmAsync(
  title: string,
  message: string,
  options?: { confirmLabel?: string; cancelLabel?: string; destructive?: boolean },
): Promise<boolean> {
  const confirmLabel = options?.confirmLabel ?? 'Devam';
  const cancelLabel = options?.cancelLabel ?? 'Vazgeç';

  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false;
    return Promise.resolve(ok);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: options?.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

/**
 * Platforma duyarlı bilgilendirme kutusu. onClose verilirse kullanıcı kutuyu
 * kapatınca çağrılır — böylece "Tamam → yönlendir" akışı web'de de çalışır
 * (RN Alert buton geri çağırmaları web'de tetiklenmez).
 */
export function alertAsync(title: string, message: string, onClose?: () => void): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    onClose?.();
    return;
  }
  Alert.alert(title, message, onClose ? [{ text: 'Tamam', onPress: onClose }] : undefined);
}
