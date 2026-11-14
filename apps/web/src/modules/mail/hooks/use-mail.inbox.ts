import { useQuery } from "@tanstack/react-query";
import { mailApi } from "../api/mail.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { FetchInboxOptions } from "../types";

export const mailKeys = {
  all: ["mail"] as const,
  inbox: (options?: FetchInboxOptions) =>
    [...mailKeys.all, "inbox", options] as const,
  starred: (options?: FetchInboxOptions) =>
    [...mailKeys.all, "starred", options] as const,
  sent: (options?: FetchInboxOptions) =>
    [...mailKeys.all, "sent", options] as const,
  drafts: (options?: FetchInboxOptions) =>
    [...mailKeys.all, "drafts", options] as const,
  snoozed: (options?: FetchInboxOptions) =>
    [...mailKeys.all, "snoozed", options] as const,
  trash: (options?: FetchInboxOptions) =>
    [...mailKeys.all, "trash", options] as const,
  counts: () => [...mailKeys.all, "counts"] as const,
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
