import { useState, useCallback, useEffect } from "react";

const TOKEN_KEY = "evolv_admin_token";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  token: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
    token: null,
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState({ user: null, isAdmin: false, loading: false, token: null });
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.id) {
          setState({ user: data, isAdmin: true, loading: false, token });
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setState({ user: null, isAdmin: false, loading: false, token: null });
        }
      })
      .catch(() => setState({ user: null, isAdmin: false, loading: false, token: null }));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || "Login failed") };
      localStorage.setItem(TOKEN_KEY, data.token);
      setState({ user: data.user, isAdmin: true, loading: false, token: data.token });
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, isAdmin: false, loading: false, token: null });
  }, []);

  return { ...state, signIn, signOut };
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
