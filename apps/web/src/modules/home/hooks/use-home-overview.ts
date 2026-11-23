import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { homeApi } from "../api/home.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useSocket } from "@/modules/chat/hooks/use-socket";
import type { UserDashboardPreferences } from "../types/home.types";

export const homeKeys = {
  all: ["home"] as const,
  overview: (timezone?: string) => [...homeKeys.all, "overview", timezone] as const,
  mail: () => [...homeKeys.all, "mail"] as const,
  chat: () => [...homeKeys.all, "chat"] as const,
  calendar: (timezone?: string) => [...homeKeys.all, "calendar", timezone] as const,
  meet: () => [...homeKeys.all, "meet"] as const,
  drive: () => [...homeKeys.all, "drive"] as const,
  tasks: () => [...homeKeys.all, "tasks"] as const,
  activity: () => [...homeKeys.all, "activity"] as const,
  preferences: () => [...homeKeys.all, "preferences"] as const,
  search: (q: string) => [...homeKeys.all, "search", q] as const,
};

export const useHomeOverview = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();

  useEffect(() => {
    if (!isAuthenticated) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: homeKeys.overview(timezone) });
      }, 500);
    };

    const unsubMsg = subscribe("message:received", scheduleRefetch);
    const unsubReceipt = subscribe("message:read_receipt", scheduleRefetch);
    const unsubPresence = subscribe("presence:state", scheduleRefetch);
    const unsubKnock = subscribe("meet:knock_received", scheduleRefetch);
    const unsubMeetEnd = subscribe("meet:ended", scheduleRefetch);

    return () => {
      if (timer) clearTimeout(timer);
      unsubMsg();
      unsubReceipt();
      unsubPresence();
      unsubKnock();
      unsubMeetEnd();
    };
  }, [isAuthenticated, timezone, queryClient, subscribe]);

  return useQuery({
    queryKey: homeKeys.overview(timezone),
    queryFn: () => homeApi.getOverview(timezone),
    enabled: isAuthenticated,
    staleTime: 30000,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
};

export const useDashboardPreferences = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: homeKeys.preferences(),
    queryFn: () => homeApi.getPreferences(),
    enabled: isAuthenticated,
    staleTime: 60000,
  });

  const mutation = useMutation({
    mutationFn: (updates: Partial<UserDashboardPreferences>) =>
      homeApi.updatePreferences(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: homeKeys.preferences() });
      const previous = queryClient.getQueryData<UserDashboardPreferences>(
        homeKeys.preferences(),
      );

      if (previous) {
        queryClient.setQueryData<UserDashboardPreferences>(homeKeys.preferences(), {
          ...previous,
          ...updates,
        });
      }

      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(homeKeys.preferences(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: homeKeys.preferences() });
    },
  });

  const setWidgetSize = (
    widgetId: string,
    size: "full" | "half" | "third" | "two-thirds"
  ) => {
    const currentSizes = query.data?.widgetSizes || {};
    mutation.mutate({
      widgetSizes: {
        ...currentSizes,
        [widgetId]: size,
      },
    });
  };

  return {
    preferences: query.data ?? {
      widgetOrder: ["calendar", "meet", "mail", "chat", "drive", "tasks", "activity"],
      hiddenWidgets: [],
      collapsedWidgets: [],
      widgetSizes: {},
      summaryStrip: true,
    },
    isLoading: query.isLoading,
    updatePreferences: mutation.mutate,
    setWidgetSize,
    isUpdating: mutation.isPending,
  };
};

export const useGlobalSearch = (query: string, enabled = true) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const trimmed = query.trim();

  return useQuery({
    queryKey: homeKeys.search(trimmed),
    queryFn: () => homeApi.searchGlobal(trimmed, 4),
    enabled: isAuthenticated && enabled && trimmed.length > 0,
    staleTime: 15000,
  });
};
