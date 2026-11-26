import React from "react";
import { Star } from "lucide-react";
import useStarred from "../../hooks/use-mail.starred";
import { useMailStore } from "../../store/mail.store";
import MailCategoryView from "./MailCategoryView";

const MailStarred: React.FC = () => {
  const { page, limit } = useMailStore();
  const { data, isLoading, isError, error } = useStarred({ page, limit });

  return (
    <MailCategoryView
      category="starred"
      data={data}
      isLoading={isLoading}
      isError={isError}
      error={error}
      emptyIcon={Star}
      emptyTitle="No starred messages"
      emptyDescription="Stars let you give messages a special status to make them easier to find."
      errorLabel="Error loading starred messages"
    />
  );
};

export default MailStarred;
