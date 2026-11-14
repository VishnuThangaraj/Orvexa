import { useQuery } from "@tanstack/react-query";
import { mailApi } from "../api/mail.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { mailKeys } from "./use-mail.inbox";
import type { FetchInboxOptions } from "../types";

export const useStarred = (options?: FetchInboxOptions) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: mailKeys.starred(options),
    queryFn: () => mailApi.getStarred(options),
    enabled: isAuthenticated,
  });
};

export default useStarred;
