"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  clear: () => void;
}

// User info (non-sensitive) persists across tabs via localStorage.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      clear: () => set({ user: null, token: null }),
    }),
    {
      name: "bb_auth",
      // Token lives only for the browser session (sessionStorage), user info in localStorage.
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          const user = localStorage.getItem(key);
          const token = sessionStorage.getItem(`${key}_token`);
          if (!user) return null;
          try {
            const parsed = JSON.parse(user);
            if (token) {
              const tokenParsed = JSON.parse(token);
              parsed.state = { ...parsed.state, token: tokenParsed };
            }
            return JSON.stringify(parsed);
          } catch {
            return user;
          }
        },
        setItem: (key, value) => {
          try {
            const parsed = JSON.parse(value);
            const token = parsed.state?.token ?? null;
            // Strip token from localStorage value
            const withoutToken = { ...parsed, state: { ...parsed.state, token: null } };
            localStorage.setItem(key, JSON.stringify(withoutToken));
            // Token goes to sessionStorage only
            if (token !== null) {
              sessionStorage.setItem(`${key}_token`, JSON.stringify(token));
            } else {
              sessionStorage.removeItem(`${key}_token`);
            }
          } catch {
            localStorage.setItem(key, value);
          }
        },
        removeItem: (key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(`${key}_token`);
        },
      })),
    }
  )
);
