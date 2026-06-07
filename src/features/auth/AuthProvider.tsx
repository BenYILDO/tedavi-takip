import { Session } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { unregisterCurrentPush } from '@/features/notifications/push';
import { readFunctionError } from '@/lib/functionError';
import { regNoToEmail, supabase } from '@/lib/supabase';
import { rememberedRegNo } from '@/lib/storage';
import { Profile } from '@/types/db';

export type AccountStatus = 'not_found' | 'needs_password' | 'ready';

interface AuthContextValue {
  initializing: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Oturum var ama profil yüklenemedi (ağ hatası veya eksik profil kaydı). */
  profileError: boolean;
  /** Kullanıcı adının (kayıt no) hesap durumunu sorgular. */
  checkAccount: (regNo: string) => Promise<AccountStatus>;
  /** Kayıt no + şifre ile giriş yapar. */
  signIn: (regNo: string, password: string) => Promise<void>;
  /** İlk kez şifre belirleyip ardından giriş yapar (hasta). Aktivasyon kodu gerekir. */
  setPasswordAndSignIn: (
    regNo: string,
    password: string,
    activationCode: string,
  ) => Promise<void>;
  /** Giriş yapmış kullanıcının şifresini değiştirir. */
  changePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Profil getirir. Ağ/sunucu hatasında fırlatır; kayıt yoksa null döner. */
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const mounted = useRef(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await fetchProfile(userId);
      if (!mounted.current) return;
      setProfile(p);
      setProfileError(!p); // oturum var ama profil kaydı yoksa hata olarak işaretle
    } catch (e) {
      console.warn('[auth] profile fetch error', e);
      if (!mounted.current) return;
      setProfile(null);
      setProfileError(true);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted.current) return;
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted.current) return;
      setSession(newSession);
      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setProfileError(false);
      }
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const checkAccount = useCallback(async (regNo: string): Promise<AccountStatus> => {
    const { data, error } = await supabase.rpc('account_status', {
      p_reg: regNo.trim().toLowerCase(),
    });
    if (error) {
      console.warn('[auth] account_status error', error.message);
      throw new Error('Hesap durumu kontrol edilemedi. İnternet bağlantınızı kontrol edin.');
    }
    if (data === 'ready' || data === 'needs_password') return data;
    return 'not_found';
  }, []);

  const signIn = useCallback(async (regNo: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: regNoToEmail(regNo),
      password,
    });
    if (error) {
      throw new Error('Kullanıcı adı veya şifre hatalı.');
    }
    await rememberedRegNo.set(regNo.trim().toLowerCase());
  }, []);

  const setPasswordAndSignIn = useCallback(
    async (regNo: string, password: string, activationCode: string) => {
      const { error } = await supabase.functions.invoke('patient-set-password', {
        body: {
          registration_number: regNo.trim().toLowerCase(),
          password,
          activation_code: activationCode.trim().toUpperCase(),
        },
      });
      if (error) {
        const message = await readFunctionError(error, 'Şifre belirlenemedi. Lütfen tekrar deneyin.');
        throw new Error(message);
      }
      await signIn(regNo, password);
    },
    [signIn],
  );

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message || 'Şifre değiştirilemedi.');
    }
  }, []);

  const signOut = useCallback(async () => {
    // Çıkmadan önce bu cihazın push token'ını sil (oturum hâlâ geçerliyken).
    await unregisterCurrentPush();
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }, [session, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      session,
      profile,
      profileError,
      checkAccount,
      signIn,
      setPasswordAndSignIn,
      changePassword,
      signOut,
      refreshProfile,
    }),
    [
      initializing,
      session,
      profile,
      profileError,
      checkAccount,
      signIn,
      setPasswordAndSignIn,
      changePassword,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
