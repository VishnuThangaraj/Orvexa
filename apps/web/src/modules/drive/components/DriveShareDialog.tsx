import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Link2,
  Check,
  Globe,
  Lock,
  Settings,
  Loader2,
  UserCheck,
} from "lucide-react";
import { driveApi } from "../api/drive.api";
import type {
  DriveItem,
  DriveUserSummary,
  ListPermissionsResult,
} from "../types/drive.types";

interface DriveShareDialogProps {
  isOpen: boolean;
  item: DriveItem | null;
  onClose: () => void;
  onItemUpdated?: (updated: Partial<DriveItem>) => void;
}

export const DriveShareDialog: React.FC<DriveShareDialogProps> = ({
  isOpen,
  item,
  onClose,
  onItemUpdated,
}) => {
  const [data, setData] = useState<ListPermissionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Search & add collaborator state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DriveUserSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DriveUserSummary | null>(null);
  const [selectedRole, setSelectedRole] = useState<"VIEWER" | "COMMENTER" | "EDITOR">("VIEWER");
  const [notify, setNotify] = useState(true);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Security restrictions state
  const [preventEditorSharing, setPreventEditorSharing] = useState(false);
  const [preventDownload, setPreventDownload] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load permissions and link info
  const loadPermissions = async () => {
    if (!item) return;
    setLoading(true);
    setActionError(null);
    try {
      const target = item.type === "file" ? { fileId: item.id } : { folderId: item.id };
      const res = await driveApi.listPermissions(target);
      setData(res);

      if (item.type === "file") {
        setPreventEditorSharing(item.preventEditorSharing || false);
        setPreventDownload(item.preventDownload || false);
      }
    } catch (err: any) {
      console.error("Failed to load permissions:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && item) {
      loadPermissions();
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      setShowSettings(false);
    }
  }, [isOpen, item]);

  // Debounced search for users
  useEffect(() => {
    if (!searchQuery.trim() || selectedUser) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await driveApi.searchUsers(searchQuery);
        // Exclude owner and existing collaborators from suggestions
        const existingEmails = new Set<string>();
        if (data?.owner?.email) existingEmails.add(data.owner.email.toLowerCase());
        data?.permissions.forEach((p) => existingEmails.add(p.user.email.toLowerCase()));

        const filtered = users.filter((u) => !existingEmails.has(u.email.toLowerCase()));
        setSearchResults(filtered);
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedUser, data]);

  if (!isOpen || !item) return null;

  // Add collaborator
  const handleAddCollaborator = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const target = item.type === "file" ? { fileId: item.id } : { folderId: item.id };
      await driveApi.addPermission(target, {
        email: selectedUser.email,
        accessLevel: selectedRole,
        notify,
      });

      setSelectedUser(null);
      setSearchQuery("");
      setMessage("");
      await loadPermissions();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to add person");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change collaborator role
  const handleRoleChange = async (
    permissionId: string,
    newRole: "VIEWER" | "COMMENTER" | "EDITOR" | "MANAGER" | "REMOVE",
  ) => {
    setActionError(null);
    try {
      if (newRole === "REMOVE") {
        await driveApi.removePermission(permissionId);
      } else {
        await driveApi.updatePermission(permissionId, newRole);
      }
      await loadPermissions();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to update permission");
    }
  };

  // Update General Access Link settings
  const handleGeneralAccessChange = async (
    type: "RESTRICTED" | "ANYONE",
    role: "VIEWER" | "COMMENTER" | "EDITOR" = "VIEWER",
  ) => {
    setActionError(null);
    try {
      const target = item.type === "file" ? { fileId: item.id } : { folderId: item.id };
      if (type === "RESTRICTED") {
        await driveApi.updateShareLink(target, { role: "VIEWER", revoke: true });
      } else {
        await driveApi.updateShareLink(target, {
          role,
          allowAnonymous: false,
          revoke: false,
        });
      }
      await loadPermissions();
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to update link");
    }
  };

  // Copy share link
  const handleCopyLink = () => {
    const shareUrl = data?.shareLink
      ? `${window.location.origin}/drive/s/${data.shareLink.token}`
      : `${window.location.origin}/drive/folders/${item.id}`;

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Toggle Security Restrictions
  const handleToggleRestriction = async (
    key: "preventEditorSharing" | "preventDownload",
    val: boolean,
  ) => {
    if (item.type !== "file") return;
    setIsSavingSecurity(true);
    try {
      await driveApi.updateFile(item.id, { [key]: val });
      if (key === "preventEditorSharing") setPreventEditorSharing(val);
      if (key === "preventDownload") setPreventDownload(val);
      onItemUpdated?.({ [key]: val });
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.message || "Failed to update setting");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const isOwner = data?.effectiveRole === "OWNER";
  const canManage = data?.canManagePermissions ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[340px]">
              Share &ldquo;{item.name}&rdquo;
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {item.type === "file" && isOwner && (
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                title="Sharing settings"
                className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors ${
                  showSettings ? "bg-slate-100 dark:bg-slate-800 text-[#1a73e8]" : ""
                }`}
              >
                <Settings size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Error Alert */}
        {actionError && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {actionError}
          </div>
        )}

        {/* Settings View (Overlay when Settings clicked) */}
        {showSettings ? (
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Settings for &ldquo;{item.name}&rdquo;
              </h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-xs text-[#1a73e8] hover:underline cursor-pointer"
              >
                Back to share
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isSavingSecurity}
                  checked={!preventEditorSharing}
                  onChange={(e) =>
                    handleToggleRestriction("preventEditorSharing", !e.target.checked)
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#1a73e8] focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Editors can change permissions and share
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    If disabled, only the owner can modify sharing and invite new collaborators.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isSavingSecurity}
                  checked={!preventDownload}
                  onChange={(e) =>
                    handleToggleRestriction("preventDownload", !e.target.checked)
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#1a73e8] focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                    Viewers and commenters can see the option to download, print, and copy
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    If disabled, viewers cannot download this file directly or via the web viewer.
                  </span>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            {/* Add People and Groups Input */}
            <div className="relative">
              {!selectedUser ? (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Add people and groups"
                    disabled={!canManage}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:bg-white dark:focus:bg-slate-850 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all disabled:opacity-50"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3">
                      <Loader2 size={15} className="animate-spin text-slate-400" />
                    </div>
                  )}

                  {/* Search Autocomplete Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-11 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto z-20 py-1">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchResults([]);
                          }}
                          className="w-full px-3.5 py-2 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-left cursor-pointer transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-semibold uppercase">
                            {user.fullName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                              {user.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Selected User Compose Box */
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-semibold uppercase">
                        {selectedUser.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {selectedUser.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRole}
                        onChange={(e) =>
                          setSelectedRole(
                            e.target.value as "VIEWER" | "COMMENTER" | "EDITOR",
                          )
                        }
                        className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-200 outline-none"
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="COMMENTER">Commenter</option>
                        <option value="EDITOR">Editor</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a message (optional)"
                    className="w-full p-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#1a73e8] text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notify}
                        onChange={(e) => setNotify(e.target.checked)}
                        className="rounded text-[#1a73e8] focus:ring-0 cursor-pointer"
                      />
                      <span>Notify people</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleAddCollaborator}
                        className="px-4 py-1.5 text-xs font-medium bg-[#1a73e8] text-white hover:bg-[#1557b0] rounded-full cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                      >
                        {isSubmitting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <UserCheck size={13} />
                        )}
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* People with Access List */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                People with access
              </h3>

              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-[#1a73e8]" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Owner Row */}
                  {data?.owner && (
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                          {data.owner.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                            {data.owner.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {data.owner.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                        Owner
                      </span>
                    </div>
                  )}

                  {/* Collaborators */}
                  {data?.permissions.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                          {p.user.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                            {p.user.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {p.user.email}
                          </p>
                        </div>
                      </div>

                      {canManage ? (
                        <select
                          value={p.accessLevel}
                          onChange={(e) =>
                            handleRoleChange(
                              p.id,
                              e.target.value as "VIEWER" | "COMMENTER" | "EDITOR" | "REMOVE",
                            )
                          }
                          className="text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="COMMENTER">Commenter</option>
                          <option value="EDITOR">Editor</option>
                          <option value="REMOVE">Remove access</option>
                        </select>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                          {p.accessLevel.toLowerCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Access Section */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                General access
              </h3>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                    {data?.shareLink ? <Globe size={16} /> : <Lock size={16} />}
                  </div>

                  <div>
                    {canManage ? (
                      <select
                        value={data?.shareLink ? "ANYONE" : "RESTRICTED"}
                        onChange={(e) =>
                          handleGeneralAccessChange(
                            e.target.value as "RESTRICTED" | "ANYONE",
                          )
                        }
                        className="text-xs font-medium bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md px-1.5 py-0.5 text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
                      >
                        <option value="RESTRICTED">Restricted</option>
                        <option value="ANYONE">Anyone with the link</option>
                      </select>
                    ) : (
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {data?.shareLink ? "Anyone with the link" : "Restricted"}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {data?.shareLink
                        ? "Anyone on the Internet with the link can view"
                        : "Only people with access can open with the link"}
                    </p>
                  </div>
                </div>

                {data?.shareLink && canManage && (
                  <select
                    value={data.shareLink.role}
                    onChange={(e) =>
                      handleGeneralAccessChange(
                        "ANYONE",
                        e.target.value as "VIEWER" | "COMMENTER" | "EDITOR",
                      )
                    }
                    className="text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="COMMENTER">Commenter</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1a73e8] hover:bg-[#1a73e8]/10 dark:hover:bg-[#1a73e8]/20 rounded-full cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Link copied</span>
              </>
            ) : (
              <>
                <Link2 size={14} />
                <span>Copy link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-medium bg-[#1a73e8] text-white hover:bg-[#1557b0] rounded-full cursor-pointer transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriveShareDialog;
