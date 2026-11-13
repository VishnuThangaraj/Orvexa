import React from "react";
import type { FormattedInboxMessage } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { DateMonth } from "@/common/utils/timstamp-convert";

export interface MailLayoutProps {
  mail: FormattedInboxMessage;
}

const MailLayout: React.FC<MailLayoutProps> = ({ mail }) => {
  return (
    <div className="flex items-center justify-between gap-5 py-2 text-sm">
      <div className="flex gap-3 items-center w-[23%]">
        <Checkbox />
        <div>{mail.sender.fullName}</div>
      </div>
      <div className="flex">{mail.body}</div>
      <div className="flex items-center justify-end text-right w-[7%] whitespace-nowrap">
        {DateMonth(new Date(mail.sentAt))}
      </div>
    </div>
  );
};

export default MailLayout;
