import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

async function checkAdmin(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    loading: true,
  });

  // Track last userId so we don't re-check admin on every token refresh
  const lastUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const handleSession = useCallback(async (session: Session | null) => {
    const user = session?.user ?? null;
    const userId = user?.id ?? null;

    // If same user, skip re-checking admin (prevents loop on token refresh)
    if (userId === lastUserIdRef.current && lastUserIdRef.current !== null) {
      // Just update session in case token refreshed
      if (mountedRef.current) setState((s) => ({ ...s, session, loading: false }));
      return;
    }

    lastUserIdRef.current = userId;

    const isAdmin = user ? await checkAdmin(user.id) : false;

    if (mountedRef.current) {
      setState({ user, session, isAdmin, loading: false });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    // Fallback: if onAuthStateChange hasn't fired in 4s, force via getSession
    const fallback = setTimeout(async () => {
      if (!mountedRef.current) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await handleSession(session);
      } catch {
        if (mountedRef.current) setState((s) => ({ ...s, loading: false }));
      }
    }, 4000);

    return () => {
      mountedRef.current = false;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    lastUserIdRef.current = null;
    await supabase.auth.signOut();
    setState({ user: null, session: null, isAdmin: false, loading: false });
  }, []);

  return { ...state, signIn, signOut };
}
