import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

export interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = () => {
  const location = useLocation();
  const isChat = location.pathname.startsWith("/chat");
  const isCalendar = location.pathname.startsWith("/calendar");
  const isDrive = location.pathname.startsWith("/drive");

  return (
    <div className="flex flex-col h-screen w-full bg-[#F0F4F9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      <Navbar />
      <div className="flex flex-1 w-full overflow-hidden">
        <Sidebar />
        <main
          className={cn(
            "flex-1 h-full",
            isChat || isCalendar || isDrive ? "overflow-hidden" : "overflow-y-auto",
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
