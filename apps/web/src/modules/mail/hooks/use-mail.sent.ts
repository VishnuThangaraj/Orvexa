import { useQuery } from "@tanstack/react-query";
import { mailApi } from "../api/mail.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { mailKeys } from "./use-mail.inbox";
import type { FetchInboxOptions } from "../types";

export const useSent = (options?: FetchInboxOptions) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: mailKeys.sent(options),
    queryFn: () => mailApi.getSent(options),
    enabled: isAuthenticated,
  });
};

export default useSent;
