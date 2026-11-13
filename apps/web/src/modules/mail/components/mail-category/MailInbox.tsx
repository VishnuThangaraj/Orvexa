import React from "react";
import useMail from "../../hooks/use-mail.inbox";
import { LoaderInPage } from "@/common/components/ui/Loader/Loader";
import MailLayout from "../MailLayout";

const MailInbox: React.FC = () => {
  const { data, isLoading, isError, error } = useMail();
  console.log(data);
  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="relative px-6 overflow-y-auto flex-1 min-h-50">
        {isLoading && <LoaderInPage />}

        {isError && (
          <div className="flex h-full w-full text-center align-middle justify-center items-center pb-[10%] animate-pulse">
            Error loading inbox:{" "}
            {error instanceof Error ? error.message : "Something went wrong"}
          </div>
        )}
        {!isLoading && !isError && data?.messages.length === 0 && (
          <div className="flex h-full w-full text-center align-middle justify-center items-center pb-[10%] animate-pulse">
            No messages in inbox
          </div>
        )}
        {data?.messages.map((mail) => (
          <MailLayout key={mail.id} mail={mail} />
        ))}
      </div>
    </div>
  );
};

export default MailInbox;
