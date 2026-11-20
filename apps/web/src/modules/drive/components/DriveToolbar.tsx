import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  List,
  LayoutGrid,
  Info,
  ArrowUpDown,
  Download,
  Trash2,
  FolderInput,
  Star,
  Check,
  UserPlus,
} from "lucide-react";
import { useDriveStore } from "../store/drive.store";
import { cn } from "@/lib/utils";

interface DriveToolbarProps {
  onDownloadSelected?: () => void;
  onMoveSelected?: () => void;
  onDeleteSelected?: () => void;
  onStarSelected?: () => void;
  onShareSelected?: () => void;
}

export const DriveToolbar: React.FC<DriveToolbarProps> = ({
  onDownloadSelected,
  onMoveSelected,
  onDeleteSelected,
  onStarSelected,
  onShareSelected,
}) => {
  const {
    viewMode,
    setViewMode,
    sortBy,
    sortOrder,
    setSort,
    searchQuery,
    setSearchQuery,
    searchFilters,
    setSearchFilters,
    isDetailsPanelOpen,
    toggleDetailsPanel,
    selectedItemIds,
    clearSelection,
  } = useDriveStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const hasSelection = selectedItemIds.length > 0;

  const sortOptions = [
    { id: "name", label: "Name" },
    { id: "updatedAt", label: "Last modified" },
    { id: "size", label: "File size" },
  ];

  return (
    <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 select-none">
      {/* Search Bar with Filter Dialog */}
      <div className="flex-1 max-w-2xl relative" ref={filterRef}>
        <div className="relative flex items-center w-full">
          <Search
            size={18}
            className="absolute left-3.5 text-slate-400 pointer-events-none"
          />
          <input
            id="drive-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in Drive (/)"
            aria-label="Search in Drive"
            className="w-full pl-10 pr-20 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 rounded-full text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#1a73e8]/30 transition-all border border-transparent focus:border-slate-200 dark:focus:border-slate-700"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              title="Search options"
              className={cn(
                "p-1.5 rounded-full transition-colors cursor-pointer",
                isFilterOpen || Object.keys(searchFilters).length > 0
                  ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700",
              )}
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Search Options Popover */}
        {isFilterOpen && (
          <div className="absolute top-12 left-0 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Search Filters
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Type
                </label>
                <select
                  value={searchFilters.type || ""}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, type: e.target.value || undefined })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm outline-none"
                >
                  <option value="">Any</option>
                  <option value="folder">Folders</option>
                  <option value="document">Documents & Spreadsheets</option>
                  <option value="pdf">PDFs</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="archive">Archives (ZIP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Owner
                </label>
                <select
                  value={searchFilters.owner || ""}
                  onChange={(e) =>
                    setSearchFilters({ ...searchFilters, owner: e.target.value || undefined })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm outline-none"
                >
                  <option value="">Anyone</option>
                  <option value="me">Owned by me</option>
                  <option value="not-me">Not owned by me</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setSearchFilters({});
                    setIsFilterOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="px-3 py-1.5 text-xs bg-[#1a73e8] text-white rounded-md hover:bg-[#1557b0] cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Multi-selection Action Toolbar OR View Controls */}
      <div className="flex items-center gap-2">
        {hasSelection ? (
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700 animate-in fade-in duration-150">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 mr-2">
              {selectedItemIds.length} selected
            </span>

            {selectedItemIds.length === 1 && onShareSelected && (
              <button
                type="button"
                onClick={onShareSelected}
                title="Share item"
                className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <UserPlus size={16} />
              </button>
            )}

            {onDownloadSelected && (
              <button
                type="button"
                onClick={onDownloadSelected}
                title="Download selected"
                className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Download size={16} />
              </button>
            )}

            {onMoveSelected && (
              <button
                type="button"
                onClick={onMoveSelected}
                title="Move selected"
                className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <FolderInput size={16} />
              </button>
            )}

            {onStarSelected && (
              <button
                type="button"
                onClick={onStarSelected}
                title="Star selected"
                className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Star size={16} />
              </button>
            )}

            {onDeleteSelected && (
              <button
                type="button"
                onClick={onDeleteSelected}
                title="Move to trash"
                className="p-1.5 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            )}

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

            <button
              type="button"
              onClick={clearSelection}
              title="Clear selection"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                title="Sort options"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-colors"
              >
                <ArrowUpDown size={14} className="text-slate-500" />
                <span>Sort</span>
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-9 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSort(opt.id as any);
                        setIsSortOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.id && (
                        <Check size={14} className="text-[#1a73e8] dark:text-[#8ab4f8]" />
                      )}
                    </button>
                  ))}
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setSort(sortBy, sortOrder === "asc" ? "desc" : "asc");
                      setIsSortOpen(false);
                    }}
                    className="w-full px-3.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                  >
                    {sortOrder === "asc" ? "Ascending (A to Z)" : "Descending (Z to A)"}
                  </button>
                </div>
              )}
            </div>

            {/* View Mode Toggle: List / Grid */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="List view"
                className={cn(
                  "p-1.5 rounded-full transition-colors cursor-pointer",
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
                )}
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={cn(
                  "p-1.5 rounded-full transition-colors cursor-pointer",
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
                )}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Info / Details Panel Toggle */}
            <button
              type="button"
              onClick={() => toggleDetailsPanel()}
              title="View details"
              className={cn(
                "p-2 rounded-full transition-colors cursor-pointer border border-transparent",
                isDetailsPanelOpen
                  ? "bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff] border-slate-200/80"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              <Info size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
