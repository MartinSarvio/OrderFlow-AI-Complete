import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  profile: CustomerProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<CustomerProfile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children, restaurantId }: { children: ReactNode; restaurantId: string }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    // Try to find customer by app_user_id
    const { data } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('app_user_id', userId)
      .maybeSingle();

    if (data) {
      setProfile({ id: data.id, name: data.name || '', email: data.email || '', phone: data.phone || '' });
    } else if (userEmail) {
      // Try by email
      const { data: byEmail } = await supabase
        .from('customers')
        .select('id, name, email, phone')
        .eq('email', userEmail)
        .maybeSingle();
      if (byEmail) {
        // Link app_user_id
        await supabase.from('customers').update({ app_user_id: userId }).eq('id', byEmail.id);
        setProfile({ id: byEmail.id, name: byEmail.name || '', email: byEmail.email || '', phone: byEmail.phone || '' });
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id, s.user.email);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id, s.user.email);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } }
    });
    if (error) return { error: error.message };

    // Create customer record
    if (data.user) {
      const { error: custErr } = await supabase.from('customers').insert({
        tenant_id: restaurantId,
        name,
        email,
        phone: phone || null,
        app_user_id: data.user.id,
      });
      if (custErr && !custErr.message.includes('duplicate')) {
        console.warn('Customer create warning:', custErr.message);
      }
      await fetchProfile(data.user.id, email);
    }
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (data: Partial<CustomerProfile>) => {
    if (!profile) return { error: 'Ikke logget ind' };
    const { error } = await supabase
      .from('customers')
      .update({ name: data.name, email: data.email, phone: data.phone })
      .eq('id', profile.id);
    if (error) return { error: error.message };
    setProfile(prev => prev ? { ...prev, ...data } : null);
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
