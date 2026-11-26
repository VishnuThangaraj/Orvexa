import React from "react";
import { SendHorizontal } from "lucide-react";
import useSent from "../../hooks/use-mail.sent";
import { useMailStore } from "../../store/mail.store";
import MailCategoryView from "./MailCategoryView";

const MailSent: React.FC = () => {
  const { page, limit } = useMailStore();
  const { data, isLoading, isError, error } = useSent({ page, limit });

  return (
    <MailCategoryView
      category="sent"
      data={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      emptyIcon={SendHorizontal}
      emptyTitle="No sent messages"
      emptyDescription="Emails you send to recipients will show up here."
      errorLabel="Error loading sent messages"
    />
  );
};

export default MailSent;
