import React, { useState } from "react";
import { X, Plus, Check, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { useCalendarStore } from "../store/calendar.store";

export const TasksSidePanel: React.FC = () => {
  const {
    isRightPanelOpen,
    setRightPanelOpen,
    activeRightPanelTab,
    tasks,
    createTask,
    toggleTaskCompleted,
    deleteTask,
  } = useCalendarStore();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDetails, setTaskDetails] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  if (!isRightPanelOpen) {
    return null;
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await createTask({
      title: taskTitle.trim(),
      details: taskDetails.trim() || undefined,
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
    });

    setTaskTitle("");
    setTaskDetails("");
    setTaskDueDate("");
    setIsAddingTask(false);
  };

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <div className="w-80 shrink-0 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between select-none z-10 shadow-xs">
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <h2 className="text-base font-medium text-slate-800 dark:text-slate-100 capitalize">
          {activeRightPanelTab || "Tasks"}
        </h2>
        <button
          type="button"
          onClick={() => setRightPanelOpen(false)}
          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {activeRightPanelTab === "tasks" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Add a Task Trigger / Form */}
          {isAddingTask ? (
            <form
              onSubmit={handleCreateTask}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2 shadow-2xs"
            >
              <input
                type="text"
                placeholder="Title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
                className="w-full text-sm font-medium bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
              <textarea
                placeholder="Details"
                value={taskDetails}
                onChange={(e) => setTaskDetails(e.target.value)}
                rows={2}
                className="w-full text-xs bg-transparent border-none outline-none text-slate-600 dark:text-slate-300 placeholder-slate-400 resize-none"
              />
              <div className="flex items-center justify-between pt-1">
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="text-xs text-slate-600 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-full cursor-pointer shadow-2xs"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTask(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full font-medium transition-colors cursor-pointer"
            >
              <Plus size={18} />
              <span>Add a task</span>
            </button>
          )}

          {/* Pending Tasks */}
          <div className="space-y-1">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                {/* Circular checkbox */}
                <button
                  type="button"
                  onClick={() => toggleTaskCompleted(task.id, true)}
                  className="w-4 h-4 mt-0.5 rounded-full border-2 border-slate-400 hover:border-blue-600 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-tight">
                    {task.title}
                  </p>
                  {task.details && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {task.details}
                    </p>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                      <CalendarIcon size={12} />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Completed Tasks section */}
          {completedTasks.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Completed ({completedTasks.length})
              </span>
              <div className="space-y-1">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-start gap-3 p-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskCompleted(task.id, false)}
                      className="w-4 h-4 mt-0.5 rounded-full bg-blue-600 border-2 border-blue-600 flex items-center justify-center shrink-0 cursor-pointer text-white"
                    >
                      <Check size={10} strokeWidth={3} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-through text-slate-500 dark:text-slate-400">
                        {task.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <p className="text-sm capitalize font-medium text-slate-600 dark:text-slate-300">
            {activeRightPanelTab} panel
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Orvexa Workspace integration placeholder
          </p>
        </div>
      )}
    </div>
  );
};

export default TasksSidePanel;
