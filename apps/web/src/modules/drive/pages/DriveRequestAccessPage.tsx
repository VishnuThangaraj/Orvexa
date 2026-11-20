import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, ArrowLeft, Loader2, Send } from "lucide-react";
import { driveApi } from "../api/drive.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { DriveResolvedLinkResult } from "../types/drive.types";

export const DriveRequestAccessPage: React.FC = () => {
  const { token } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const fileIdParam = searchParams.get("fileId");
  const folderIdParam = searchParams.get("folderId");
  const tokenParam = token || searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<DriveResolvedLinkResult | null>(null);

  // Form states
  const [message, setMessage] = useState("");
  const [requestedRole, setRequestedRole] = useState<"VIEWER" | "COMMENTER" | "EDITOR">("VIEWER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      if (!tokenParam) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await driveApi.resolveShareLink(tokenParam);
        setResolved(res);

        // If the user already has access via this link or direct permission
        if (res.hasAccess) {
          if (res.item.type === "folder") {
            navigate(`/drive/folders/${res.item.id}`, { replace: true });
          } else {
            navigate(`/drive?preview=${res.item.id}&token=${tokenParam}`, { replace: true });
          }
        }
      } catch (err: any) {
        console.error("Failed to resolve share link:", err);
        setError(err.response?.data?.message || err.message || "Failed to resolve link");
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, [tokenParam, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const targetFileId = resolved?.item.type === "file" ? resolved.item.id : fileIdParam || undefined;
    const targetFolderId = resolved?.item.type === "folder" ? resolved.item.id : folderIdParam || undefined;

    try {
      await driveApi.createAccessRequest({
        fileId: targetFileId,
        folderId: targetFolderId,
        requestedRole,
        message: message.trim() || undefined,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Failed to request access:", err);
      setError(err.response?.data?.message || err.message || "Failed to submit access request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-[#1a73e8]" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Checking access permissions...
          </p>
        </div>
      </div>
    );
  }

  const itemName = resolved?.item.name || "this item";
  const ownerName = resolved?.item.owner.fullName || "the owner";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center text-center">
        {/* Success View */}
        {isSubmitted ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Access request sent
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
              We notified <span className="font-semibold text-slate-800 dark:text-slate-200">{ownerName}</span>.
              You will be granted access once they approve your request.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => navigate("/drive")}
                className="px-6 py-2 text-xs font-medium bg-[#1a73e8] text-white hover:bg-[#1557b0] rounded-full cursor-pointer transition-colors shadow-xs"
              >
                Go to My Drive
              </button>
            </div>
          </div>
        ) : (
          /* Request Form View */
          <div className="w-full space-y-5">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
              <Lock size={28} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                You need access
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Ask for access to &ldquo;<span className="font-semibold text-slate-800 dark:text-slate-200">{itemName}</span>&rdquo;,
                or switch to an account with access.
              </p>
            </div>

            {/* Current Signed In Account Pill */}
            {user && (
              <div className="flex items-center justify-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-700 dark:text-slate-300">
                <div className="w-5 h-5 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[10px] font-semibold uppercase">
                  {user.fullName.charAt(0)}
                </div>
                <span className="font-medium truncate max-w-[200px]">{user.email}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 rounded-lg text-left">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Requested role
                </label>
                <select
                  value={requestedRole}
                  onChange={(e) =>
                    setRequestedRole(e.target.value as "VIEWER" | "COMMENTER" | "EDITOR")
                  }
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#1a73e8] text-slate-900 dark:text-slate-100"
                >
                  <option value="VIEWER">Viewer (view and download)</option>
                  <option value="COMMENTER">Commenter (view and comment)</option>
                  <option value="EDITOR">Editor (edit and organize)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message (optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain why you need access to this item..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#1a73e8] text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/drive")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium bg-[#1a73e8] text-white hover:bg-[#1557b0] rounded-full cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>Request access</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriveRequestAccessPage;
