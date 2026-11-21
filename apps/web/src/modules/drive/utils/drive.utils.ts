export function formatBytes(bytes: string | number | bigint): string {
  const num = typeof bytes === "bigint" ? Number(bytes) : Number(bytes);
  if (isNaN(num) || num <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  const formatted = (num / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${formatted} ${units[i]}`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown";

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export interface FileTypeInfo {
  category: "folder" | "image" | "video" | "audio" | "pdf" | "document" | "code" | "archive" | "file";
  label: string;
  color: string;
  bgLight: string;
}

export function getFileTypeInfo(mimeType?: string | null, filename?: string): FileTypeInfo {
  if (!mimeType) {
    const ext = filename?.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return { category: "pdf", label: "PDF Document", color: "text-red-500", bgLight: "bg-red-50 dark:bg-red-950/40" };
    if (["zip", "rar", "tar", "gz", "7z"].includes(ext || ""))
      return { category: "archive", label: "ZIP Archive", color: "text-amber-500", bgLight: "bg-amber-50 dark:bg-amber-950/40" };
    return { category: "file", label: "File", color: "text-slate-500", bgLight: "bg-slate-50 dark:bg-slate-900/40" };
  }

  const mime = mimeType.toLowerCase();

  if (mime.startsWith("image/")) {
    return { category: "image", label: "Image", color: "text-red-500", bgLight: "bg-red-50 dark:bg-red-950/40" };
  }
  if (mime.startsWith("video/")) {
    return { category: "video", label: "Video", color: "text-cyan-500", bgLight: "bg-cyan-50 dark:bg-cyan-950/40" };
  }
  if (mime.startsWith("audio/")) {
    return { category: "audio", label: "Audio", color: "text-amber-500", bgLight: "bg-amber-50 dark:bg-amber-950/40" };
  }
  if (mime === "application/pdf") {
    return { category: "pdf", label: "PDF Document", color: "text-rose-600", bgLight: "bg-rose-50 dark:bg-rose-950/40" };
  }
  if (
    mime.includes("word") ||
    mime.includes("document") ||
    mime.includes("opendocument.text") ||
    filename?.endsWith(".docx") ||
    filename?.endsWith(".doc")
  ) {
    return { category: "document", label: "Word Document", color: "text-blue-600", bgLight: "bg-blue-50 dark:bg-blue-950/40" };
  }
  if (
    mime.includes("sheet") ||
    mime.includes("excel") ||
    mime.includes("csv") ||
    filename?.endsWith(".xlsx") ||
    filename?.endsWith(".csv")
  ) {
    return { category: "document", label: "Spreadsheet", color: "text-emerald-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/40" };
  }
  if (
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    filename?.endsWith(".pptx")
  ) {
    return { category: "document", label: "Presentation", color: "text-orange-500", bgLight: "bg-orange-50 dark:bg-orange-950/40" };
  }
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/javascript" ||
    mime === "application/xml" ||
    mime === "application/sql"
  ) {
    return { category: "code", label: "Text / Code", color: "text-indigo-500", bgLight: "bg-indigo-50 dark:bg-indigo-950/40" };
  }
  if (
    mime.includes("zip") ||
    mime.includes("tar") ||
    mime.includes("compressed") ||
    mime.includes("archive")
  ) {
    return { category: "archive", label: "Archive", color: "text-amber-600", bgLight: "bg-amber-50 dark:bg-amber-950/40" };
  }

  return { category: "file", label: "File", color: "text-slate-500", bgLight: "bg-slate-50 dark:bg-slate-900/40" };
}
