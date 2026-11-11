import { useQuery } from "@tanstack/react-query";
import { mailApi } from "../api/mail.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { FetchInboxOptions } from "../types";

export const mailKeys = {
  all: ["mail"] as const,
  inbox: (options?: FetchInboxOptions) =>
    [...mailKeys.all, "inbox", options] as const,
};

export const useInbox = (options?: FetchInboxOptions) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: mailKeys.inbox(options),
    queryFn: () => mailApi.getInbox(options),
    enabled: isAuthenticated,
  });
};

export const useMail = (options?: FetchInboxOptions) => {
  return useInbox(options);
};

export default useMail;
