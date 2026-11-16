import React from "react";

export const EmptyConversationView: React.FC = () => {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 relative select-none">
      {/* Central Illustration matching Screenshot 1 */}
      <div className="w-48 h-48 mb-6 relative flex items-center justify-center">
        {/* Chat bubble outline */}
        <div className="w-36 h-32 border-2 border-slate-800 dark:border-slate-200 rounded-3xl relative flex flex-col p-4 bg-white dark:bg-slate-800 shadow-xs">
          {/* Internal chat preview elements */}
          <div className="w-14 h-9 bg-[#c2e7ff] dark:bg-[#004a77] rounded-lg self-end mb-2 border border-[#b3dbf7] dark:border-blue-800" />
          <div className="w-8 h-8 rounded-full bg-[#d3e3fd] dark:bg-[#004a77] flex items-center justify-center border border-[#0b57d0]/40">
            <div className="w-4 h-0.5 bg-[#001d35] dark:bg-[#c2e7ff] rounded-full mb-1" />
          </div>

          {/* Chat bubble pointer */}
          <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white dark:bg-slate-800 border-b-2 border-l-2 border-slate-800 dark:border-slate-200 rotate-45" />
        </div>

        {/* Tapping hand illustration */}
        <div className="absolute bottom-2 right-8 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[#c2e7ff]/80 dark:bg-blue-900/60 -mr-4 -mb-2" />
          <div className="w-9 h-14 bg-[#0b57d0] rounded-2xl border-2 border-slate-900 dark:border-slate-100 shadow-md transform rotate-12 flex flex-col justify-end p-1">
            <div className="w-full h-4 bg-slate-900 dark:bg-slate-100 rounded-sm mb-1" />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        No conversation selected
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center leading-relaxed">
        Use the toggle to switch between single and split pane modes, or pick a
        conversation from the list to start messaging.
      </p>
    </div>
  );
};

export default EmptyConversationView;
