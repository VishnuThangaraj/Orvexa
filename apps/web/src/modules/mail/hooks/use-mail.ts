import { useState } from "react";
import type { MailMenuItem } from "../constants/mail.constants";

export const useMail = (defaultActive: string = "inbox") => {
  const [activeItem, setActiveItem] = useState<string>(defaultActive);

  const handleSelectItem = (id: string) => {
    setActiveItem(id);
  };

  const handleSelect = (item: MailMenuItem) => {
    setActiveItem(item.id);
  };

  return {
    activeId: activeItem,
    activeItem,
    setActiveItem,
    handleSelectItem,
    handleSelect,
    onSelectItem: handleSelectItem,
  };
};

export default useMail;
