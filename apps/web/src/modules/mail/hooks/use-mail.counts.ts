import { useQuery } from "@tanstack/react-query";
import { mailApi } from "../api/mail.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { mailKeys } from "./use-mail.inbox";

export const useMailCounts = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: mailKeys.counts(),
    queryFn: () => mailApi.getCounts(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll counts every 30 seconds
  });
};

export default useMailCounts;
