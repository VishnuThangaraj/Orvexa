import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthStore, LoginPayload, User } from "../types/auth.types";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: (data: LoginPayload) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          sessionId: data.sessionId ?? null,
          isAuthenticated: true,
          isLoading: false,
        }),

      setTokens: ({ accessToken, refreshToken }) =>
        set((state) => ({
          accessToken,
          refreshToken:
            refreshToken !== undefined ? refreshToken : state.refreshToken,
        })),

      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: Boolean(user),
        }),

      updateUser: (updates: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          sessionId: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        sessionId: state.sessionId,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
