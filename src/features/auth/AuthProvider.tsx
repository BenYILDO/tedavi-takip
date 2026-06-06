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
import { regNoToEmail, supabase } from '@/lib/supabase';
import { rememberedRegNo } from '@/lib/storage';
import { Profile } from '@/types/db';

export type AccountStatus = 'not_found' | 'needs_password' | 'ready';

interface AuthContextValue {
  initializing: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Kullanıcı adının (kayıt no) hesap durumunu sorgular. */
  checkAccount: (regNo: string) => Promise<AccountStatus>;
  /** Kayıt no + şifre ile giriş yapar. */
  signIn: (regNo: string, password: string) => Promise<void>;
  /** İlk kez şifre belirleyip ardından giriş yapar (hasta). */
  setPasswordAndSignIn: (regNo: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[auth] profile fetch error', error.message);
    return null;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted.current) return;
      setSession(data.session);
      if (data.session?.user) {
        setProfile(await fetchProfile(data.session.user.id));
      }
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted.current) return;
      setSession(newSession);
      if (newSession?.user) {
        setProfile(await fetchProfile(newSession.user.id));
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const checkAccount = useCallback(async (regNo: string): Promise<AccountStatus> => {
    const { data, error } = await supabase.rpc('account_status', {
      p_reg: regNo.trim(),
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
    await rememberedRegNo.set(regNo.trim());
  }, []);

  const setPasswordAndSignIn = useCallback(
    async (regNo: string, password: string) => {
      const { error } = await supabase.functions.invoke('patient-set-password', {
        body: { registration_number: regNo.trim(), password },
      });
      if (error) {
        throw new Error('Şifre belirlenemedi. Lütfen tekrar deneyin.');
      }
      await signIn(regNo, password);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      setProfile(await fetchProfile(session.user.id));
    }
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      session,
      profile,
      checkAccount,
      signIn,
      setPasswordAndSignIn,
      signOut,
      refreshProfile,
    }),
    [initializing, session, profile, checkAccount, signIn, setPasswordAndSignIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
