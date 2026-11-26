import React from "react";
import { File } from "lucide-react";
import useDrafts from "../../hooks/use-mail.drafts";
import { useMailStore } from "../../store/mail.store";
import MailCategoryView from "./MailCategoryView";

const MailDrafts: React.FC = () => {
  const { page, limit } = useMailStore();
  const { data, isLoading, isError, error } = useDrafts({ page, limit });

  return (
    <MailCategoryView
      category="drafts"
      data={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      emptyIcon={File}
      emptyTitle="You don't have any saved drafts"
      emptyDescription="Saving a draft lets you keep a message you aren't ready to send yet."
      errorLabel="Error loading drafts"
    />
  );
};

export default MailDrafts;
