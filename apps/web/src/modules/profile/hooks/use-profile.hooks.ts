import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/modules/auth/hooks/use-auth.hooks";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useTheme } from "@/common/theme";
import type { Theme } from "@/common/theme";
import { profileApi } from "../api/profile.api";
import type {
  UpdatePreferencesRequest,
  UpdateProfileRequest,
} from "../types/profile.types";

export const profileKeys = {
  all: ["profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
  usernameAvailability: (username: string) =>
    [...profileKeys.all, "username-availability", username] as const,
};

export const useProfileDetail = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: async () => {
      const user = await profileApi.getProfile();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
  });
};

export const useUsernameAvailability = (username: string, enabled: boolean) => {
  const clean = username.trim().toLowerCase();
  return useQuery({
    queryKey: profileKeys.usernameAvailability(clean),
    queryFn: () => profileApi.checkUsernameAvailability(clean),
    enabled: enabled && clean.length >= 2,
    staleTime: 15_000,
    retry: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) =>
      profileApi.updateProfile(payload),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(profileKeys.detail(), updatedUser);
      queryClient.setQueryData(authKeys.profile(), updatedUser);
    },
  });
};

export const useUploadProfilePhoto = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (percent: number) => void;
    }) => profileApi.uploadPhoto(file, onProgress),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(profileKeys.detail(), updatedUser);
      queryClient.setQueryData(authKeys.profile(), updatedUser);
    },
  });
};

export const useRemoveProfilePhoto = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: () => profileApi.removePhoto(),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(profileKeys.detail(), updatedUser);
      queryClient.setQueryData(authKeys.profile(), updatedUser);
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const { setTheme } = useTheme();

  return useMutation({
    mutationFn: (payload: UpdatePreferencesRequest) =>
      profileApi.updatePreferences(payload),
    onSuccess: (preferences, variables) => {
      if (
        variables.theme === "light" ||
        variables.theme === "dark" ||
        variables.theme === "system"
      ) {
        setTheme(variables.theme as Theme);
      }
      updateUser({ preferences });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
};
