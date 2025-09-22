import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  avatarUrl?: string;
};

type AuthStore = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  expiresAt: number | null;
  setAuthDetails: (token: string, user: User) => void;
  removeAuthDetails: () => void;
  isTokenExpired: () => boolean;
  validateAndGetToken: () => string | null;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      expiresAt: null,
      setAuthDetails: (token, user) =>
        set({
          user,
          token,
          isAuthenticated: true,
          expiresAt: new Date().getTime() + 24 * 60 * 60 * 1000,
        }),
      removeAuthDetails: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          expiresAt: null,
        }),
      isTokenExpired: () => {
        const state = get();
        if (!state.expiresAt) return true;
        return new Date().getTime() > state.expiresAt;
      },
      validateAndGetToken: () => {
        const state = get();
        if (!state.token || !state.expiresAt) return null;

        if (new Date().getTime() > state.expiresAt) {
          state.removeAuthDetails();
          return null;
        }

        return state.token;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
