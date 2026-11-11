import React from "react";
import useMail from "../hooks/use-mail.inbox";
import { LoaderInPage } from "@/common/components/ui/Loader/Loader";

const MailInbox: React.FC = () => {
  const { data, isLoading, isError, error } = useMail();
  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="relative px-6 overflow-y-auto flex-1 min-h-50">
        {isLoading && <LoaderInPage />}
        {isError && (
          <div>
            Error loading inbox:{" "}
            {error instanceof Error ? error.message : "Something went wrong"}
          </div>
        )}
        {!isLoading && !isError && data?.messages.length === 0 && (
          <div>No messages in inbox</div>
        )}
        {data?.messages.map((message) => (
          <div key={message.id}>{message.subject}</div>
        ))}
      </div>
    </div>
  );
};

export default MailInbox;
