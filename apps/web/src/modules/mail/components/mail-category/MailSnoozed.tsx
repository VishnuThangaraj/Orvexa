import React from "react";
import { Clock } from "lucide-react";
import useSnoozed from "../../hooks/use-mail.snoozed";
import { useMailStore } from "../../store/mail.store";
import MailCategoryView from "./MailCategoryView";

const MailSnoozed: React.FC = () => {
  const { page, limit } = useMailStore();
  const { data, isLoading, isError, error } = useSnoozed({ page, limit });

  return (
    <MailCategoryView
      category="snoozed"
      data={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      emptyIcon={Clock}
      emptyTitle="No snoozed messages"
      emptyDescription="Messages you snooze will reappear at the top of your inbox later."
      errorLabel="Error loading snoozed messages"
    />
  );
};

export default MailSnoozed;
