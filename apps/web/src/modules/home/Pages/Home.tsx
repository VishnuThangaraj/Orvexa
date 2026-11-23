import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Video,
  Calendar,
  MessageSquare,
  HardDrive,
  SlidersHorizontal,
} from "lucide-react";
import { GreetingHeader } from "../components/GreetingHeader";
import { SummaryStrip } from "../components/SummaryStrip";
import { WidgetCustomizerModal } from "../components/WidgetCustomizerModal";
import { MailWidget } from "../components/MailWidget";
import { ChatWidget } from "../components/ChatWidget";
import { CalendarWidget } from "../components/CalendarWidget";
import { MeetWidget } from "../components/MeetWidget";
import { DriveWidget } from "../components/DriveWidget";
import { TasksWidget } from "../components/TasksWidget";
import { ActivityWidget } from "../components/ActivityWidget";
import {
  useHomeOverview,
  useDashboardPreferences,
} from "../hooks/use-home-overview";
import { cn } from "@/lib/utils";

const DEFAULT_WIDGET_SIZES: Record<string, "full" | "half"> = {
  calendar: "full",
  meet: "half",
  mail: "half",
  chat: "half",
  drive: "half",
  tasks: "half",
  activity: "full",
};

const SIZE_TO_CLASS: Record<string, string> = {
  full: "col-span-12",
  half: "col-span-12 lg:col-span-6",
  third: "col-span-12 sm:col-span-6 lg:col-span-4",
  "two-thirds": "col-span-12 lg:col-span-8",
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const { data: overview, isLoading, refetch } = useHomeOverview();
  const { preferences, updatePreferences, setWidgetSize, isUpdating } =
    useDashboardPreferences();

  const activeWidgets = (preferences.widgetOrder || []).filter(
    (id) => !(preferences.hiddenWidgets || []).includes(id)
  );

  const getWidgetSize = (widgetId: string): "full" | "half" => {
    const size = preferences.widgetSizes?.[widgetId];
    if (size === "full" || size === "half") return size;
    return DEFAULT_WIDGET_SIZES[widgetId] || "half";
  };

  const renderWidget = (widgetId: string) => {
    const currentSize = getWidgetSize(widgetId);
    const onResize = (newSize: "full" | "half") => setWidgetSize(widgetId, newSize);

    switch (widgetId) {
      case "mail":
        return (
          <MailWidget
            data={overview?.mail?.data}
            isLoading={isLoading}
            error={overview?.mail?.error}
            size={currentSize}
            onResize={onResize}
            onRetry={refetch}
          />
        );
      case "chat":
        return (
          <ChatWidget
            data={overview?.chat?.data}
            isLoading={isLoading}
            error={overview?.chat?.error}
            size={currentSize}
            onResize={onResize}
            onRetry={refetch}
          />
        );
      case "calendar":
        return (
          <CalendarWidget
            data={overview?.calendar?.data}
            isLoading={isLoading}
            error={overview?.calendar?.error}
            size={currentSize}
            onResize={onResize}
            onRetry={refetch}
          />
        );
      case "meet":
        return (
          <MeetWidget
            data={overview?.meet?.data}
            isLoading={isLoading}
            error={overview?.meet?.error}
            size={currentSize}
            onResize={onResize}
            onRetry={refetch}
          />
        );
      case "drive":
        return (
          <DriveWidget
            data={overview?.drive?.data}
            isLoading={isLoading}
            error={overview?.drive?.error}
            size={currentSize}
            onResize={onResize}
            onRetry={refetch}
          />
        );
      case "tasks":
        return (
          <TasksWidget
            data={overview?.tasks?.data}
            isLoading={isLoading}
            error={overview?.tasks?.error}
            size={currentSize}
            onResize={onResize}
            onRetry={refetch}
          />
        );
      case "activity":
        return (
          <ActivityWidget
            data={overview?.activity?.data}
            isLoading={isLoading}
            error={overview?.activity?.error}
            size={currentSize}
            onResize={onResize}
            onRetry={refetch}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full pb-20 bg-[#F8FAFD] dark:bg-[#0B0F17]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-7 space-y-7">
        {/* Header with Greeting & Customizer Trigger */}
        <GreetingHeader onOpenCustomizer={() => setIsCustomizerOpen(true)} />

        {/* Top Summary Stat Strip */}
        {preferences.summaryStrip !== false && (
          <SummaryStrip summary={overview?.summary} isLoading={isLoading} />
        )}

        {/* Orvexa Quick Action Shortcuts Strip */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 shrink-0">
              Quick actions:
            </span>
            <button
              type="button"
              onClick={() => navigate("/mail")}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#ea4335]/5 hover:border-[#ea4335]/30 hover:text-[#ea4335] dark:hover:text-[#ea4335] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <Mail className="w-3.5 h-3.5 text-[#ea4335] group-hover:scale-110 transition-transform" />
              <span>Compose mail</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/meet")}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#00897b]/5 hover:border-[#00897b]/30 hover:text-[#00897b] dark:hover:text-[#00897b] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <Video className="w-3.5 h-3.5 text-[#00897b] group-hover:scale-110 transition-transform" />
              <span>New meeting</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/calendar")}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#1a73e8]/5 hover:border-[#1a73e8]/30 hover:text-[#1a73e8] dark:hover:text-[#1a73e8] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <Calendar className="w-3.5 h-3.5 text-[#1a73e8] group-hover:scale-110 transition-transform" />
              <span>Schedule event</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#0f9d58]/5 hover:border-[#0f9d58]/30 hover:text-[#0f9d58] dark:hover:text-[#0f9d58] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#0f9d58] group-hover:scale-110 transition-transform" />
              <span>Start chat</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/drive")}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#f9ab00]/5 hover:border-[#f9ab00]/30 hover:text-[#f9ab00] dark:hover:text-[#f9ab00] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <HardDrive className="w-3.5 h-3.5 text-[#f9ab00] group-hover:scale-110 transition-transform" />
              <span>Upload to Drive</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#1a73e8] dark:text-slate-400 dark:hover:text-blue-400 cursor-pointer transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Customize layout</span>
          </button>
        </div>

        {/* Responsive 12-Column Widget Grid */}
        <div className="grid grid-cols-12 gap-5 sm:gap-6">
          {activeWidgets.map((widgetId) => {
            const currentSize = getWidgetSize(widgetId);
            const spanClass =
              SIZE_TO_CLASS[currentSize] || "col-span-12 lg:col-span-6";
            const rendered = renderWidget(widgetId);
            if (!rendered) return null;

            return (
              <div
                key={widgetId}
                className={cn(
                  spanClass,
                  "transition-all duration-300 ease-in-out"
                )}
              >
                {rendered}
              </div>
            );
          })}
        </div>

        {/* Preferences Customizer Modal */}
        <WidgetCustomizerModal
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
          preferences={preferences}
          onSave={updatePreferences}
          isSaving={isUpdating}
        />
      </div>
    </div>
  );
};

export default Home;
