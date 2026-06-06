import { LoadingState } from '@/components';

/**
 * Kök rota. Gerçek yönlendirme app/_layout.tsx içindeki RootNavigator
 * tarafından oturum/role göre yapılır; burada yalnızca bekleme gösterilir.
 */
export default function Index() {
  return <LoadingState label="Yönlendiriliyor…" />;
}
