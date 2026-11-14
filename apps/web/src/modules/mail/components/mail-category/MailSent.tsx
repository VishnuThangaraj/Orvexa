import React from "react";
import useSent from "../../hooks/use-mail.sent";
import { LoaderInPage } from "@/common/components/ui/Loader/Loader";
import MailLayout from "../MailLayout";
import { useMailStore } from "../../store/mail.store";

const MailSent: React.FC = () => {
  const { page, limit, selectedIds, toggleSelect } = useMailStore();
  const { data, isLoading, isError, error } = useSent({ page, limit });

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="relative py-2 overflow-y-auto flex-1 min-h-50">
        {isLoading && <LoaderInPage />}

        {isError && (
          <div className="flex h-full w-full text-center align-middle justify-center items-center pb-[10%] animate-pulse">
            Error loading sent:{" "}
            {error instanceof Error ? error.message : "Something went wrong"}
          </div>
        )}
        {!isLoading && !isError && data?.messages.length === 0 && (
          <div className="flex h-full w-full text-center align-middle justify-center items-center pb-[10%] animate-pulse">
            No sent messages
          </div>
        )}
        {data?.messages.map((mail) => (
          <MailLayout
            key={mail.id}
            mail={mail}
            selected={selectedIds.includes(mail.id)}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default MailSent;
