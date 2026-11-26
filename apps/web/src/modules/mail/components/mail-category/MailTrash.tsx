import React from "react";
import { Trash2 } from "lucide-react";
import useTrash from "../../hooks/use-mail.trash";
import { useMailStore } from "../../store/mail.store";
import MailCategoryView from "./MailCategoryView";

const MailTrash: React.FC = () => {
  const { page, limit } = useMailStore();
  const { data, isLoading, isError, error } = useTrash({ page, limit });

  return (
    <MailCategoryView
      category="trash"
      data={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      emptyIcon={Trash2}
      emptyTitle="No conversations in Trash"
      emptyDescription="Messages moved to Trash will appear here."
      errorLabel="Error loading trash"
    />
  );
};

export default MailTrash;
