import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthStore = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  setAuthDetails: (user: User, token: string) => void;
  removeAuthDetails: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    set => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuthDetails: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      removeAuthDetails: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
