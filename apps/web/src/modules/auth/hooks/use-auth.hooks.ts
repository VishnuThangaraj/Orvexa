import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginCredentials,
  ResetPasswordRequest,
} from "../types";

export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
};

// Reactive auth state from Zustand store
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  return {
    user,
    accessToken,
    isAuthenticated,
    hasHydrated,
  };
};

// Login mutation & store sync
export const useLogin = () => {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      login(data);
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
  });
};

// Logout mutation & store cleanup
export const useLogout = () => {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken),
    onSettled: () => {
      logout();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
};

// Fetch current user profile
export const useProfile = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      const user = await authApi.getProfile();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
  });
};

// Fetch active user sessions
export const useSessions = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: authKeys.sessions(),
    queryFn: () => authApi.getSessions(),
    enabled: isAuthenticated,
  });
};

// Revoke a single session
export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
};

// Revoke all other active sessions
export const useRevokeAllSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.revokeAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
};

// Request password reset email
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) =>
      authApi.forgotPassword(payload),
  });
};

// Reset password with token
export const useResetPassword = () => {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      authApi.resetPassword(payload),
  });
};

// Change password for logged-in user
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) =>
      authApi.changePassword(payload),
  });
};
