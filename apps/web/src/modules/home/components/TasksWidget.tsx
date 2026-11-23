import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  Calendar as CalendarIcon,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import WidgetCard from "./WidgetCard";
import type { HomeTaskItem } from "../types/home.types";
import calendarApi from "@/modules/calendar/api/calendar.api";
import { cn } from "@/lib/utils";

interface TasksWidgetProps {
  data?: HomeTaskItem[];
  isLoading?: boolean;
  error?: string | null;
  size?: "full" | "half" | string;
  onResize?: (size: "full" | "half") => void;
  onRetry?: () => void;
}

export const TasksWidget: React.FC<TasksWidgetProps> = ({
  data,
  isLoading = false,
  error = null,
  size = "half",
  onResize,
  onRetry,
}) => {
  const tasks = data || [];
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const handleToggleComplete = async (taskId: string) => {
    // Optimistic toggle
    setCompletedIds((prev) => new Set([...prev, taskId]));

    try {
      await calendarApi.updateTask(taskId, { isCompleted: true });
      if (onRetry) onRetry();
    } catch (err) {
      console.error("Failed to complete task:", err);
      // Revert optimistic update
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await calendarApi.createTask({
        title: newTitle.trim(),
      });
      setNewTitle("");
      if (onRetry) onRetry();
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTasks = tasks.filter((t) => !completedIds.has(t.id));
  const pendingCount = activeTasks.length;

  const formatDueDate = (dueString?: string | null) => {
    if (!dueString) return null;
    try {
      const d = new Date(dueString);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      if (isToday) return { text: "Today", isToday: true, isOverdue: false };

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow =
        d.getDate() === tomorrow.getDate() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getFullYear() === tomorrow.getFullYear();

      if (isTomorrow) return { text: "Tomorrow", isToday: false, isOverdue: false };

      const isOverdue = d.getTime() < now.getTime() && !isToday;
      return {
        text: d.toLocaleDateString([], { month: "short", day: "numeric" }),
        isToday: false,
        isOverdue,
      };
    } catch {
      return { text: dueString, isToday: false, isOverdue: false };
    }
  };

  return (
    <WidgetCard
      id="tasks"
      title="Tasks"
      icon={CheckSquare}
      iconColor="text-[#1a73e8]"
      iconBg="bg-[#e8f0fe] dark:bg-blue-950/50"
      openTo="/calendar"
      openLabel="Open Tasks"
      badge={pendingCount > 0 ? `${pendingCount} pending` : undefined}
      badgeColor="bg-[#e8f0fe] text-[#1967d2] dark:bg-blue-900/40 dark:text-blue-300 font-medium"
      size={size}
      onResize={onResize}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      <div className="space-y-4">
        {/* Quick Add Task Input in Orvexa Style */}
        <form onSubmit={handleCreateTask} className="relative group">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400 group-focus-within:text-[#1a73e8] transition-colors pointer-events-none">
              <Plus className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Add a new task..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full pl-10 pr-20 py-2.5 text-xs font-normal rounded-full border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || isSubmitting}
              className="absolute right-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Add</span>
              )}
            </button>
          </div>
        </form>

        {/* Task Items List */}
        {activeTasks.length > 0 ? (
          <div className="space-y-1.5">
            {activeTasks.slice(0, 6).map((task) => {
              const dueInfo = formatDueDate(task.dueDate);

              return (
                <div
                  key={task.id}
                  className="group flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50/90 dark:hover:bg-slate-800/40 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all"
                >
                  {/* Circular Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task.id)}
                    className="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-[#1a73e8] dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex items-center justify-center transition-all cursor-pointer shrink-0 text-transparent hover:text-[#1a73e8]"
                    title="Mark complete"
                  >
                    <Check className="w-3 h-3 transition-transform group-hover:scale-100" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug break-words group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                      {task.title}
                    </p>
                    {task.details && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-normal">
                        {task.details}
                      </p>
                    )}
                  </div>

                  {dueInfo && (
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 border",
                        dueInfo.isOverdue
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50"
                          : dueInfo.isToday
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50"
                          : "bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-transparent"
                      )}
                    >
                      <CalendarIcon className="w-2.5 h-2.5" />
                      {dueInfo.text}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 px-4 text-center rounded-2xl bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/20 border border-dashed border-blue-200/60 dark:border-blue-900/40 space-y-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#e8f0fe] dark:bg-blue-950/60 text-[#1a73e8] dark:text-blue-400 flex items-center justify-center mx-auto shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                All caught up on tasks!
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-0.5">
                Type above to capture quick to-dos or open Calendar to schedule time blocks.
              </p>
            </div>
          </div>
        )}
      </div>
    </WidgetCard>
  );
};

export default TasksWidget;
