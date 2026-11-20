const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Formats a date into "Tue, 4 Feb 2025, 16:52"
 */
export function formatFullMessageDate(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const dayName = DAY_NAMES[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${dayName}, ${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Formats a date for the detailed recipient popover header:
 * "4 February 2025 at 16:52"
 */
export function formatDetailHeaderDate(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const fullMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = d.getDate();
  const month = fullMonths[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} at ${hours}:${minutes}`;
}

/**
 * Formats file size in bytes to "124 KB", "2.4 MB"
 */
export function formatFileSize(bytesInput: string | number | bigint): string {
  const bytes = Number(bytesInput);
  if (isNaN(bytes) || bytes <= 0) return "0 B";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generates user avatar initials, e.g. "Shubhojit Lahiri" -> "S", "hr@vertexautos.com" -> "H"
 */
export function getAvatarInitial(nameOrEmail?: string): string {
  if (!nameOrEmail) return "?";
  const clean = nameOrEmail.trim();
  return clean.charAt(0).toUpperCase();
}

/**
 * Deterministic background color for avatars based on user name/email
 */
export function getAvatarColor(identifier?: string): string {
  if (!identifier) return "bg-blue-600";
  const colors = [
    "bg-[#1a73e8]",
    "bg-[#0b57d0]",
    "bg-[#188038]",
    "bg-[#c5221f]",
    "bg-[#7b1fa2]",
    "bg-[#e37400]",
    "bg-[#007b83]",
    "bg-[#5f6368]",
  ];

  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Splits message body into main text and trimmed/quoted reply history
 */
export function splitMessageQuotes(body: string): {
  main: string;
  quoted: string | null;
} {
  if (!body) return { main: "", quoted: null };

  // Common quoted reply markers
  const quoteMarkers = [
    /\n\s*(?:On\s+.+?wrote:)/i,
    /\n\s*(?:From:\s+.+)/i,
    /\n\s*-+\s*Original Message\s*-+/i,
    /\n\s*>+/i,
  ];

  for (const marker of quoteMarkers) {
    const match = body.match(marker);
    if (match && match.index !== undefined && match.index > 0) {
      return {
        main: body.slice(0, match.index).trim(),
        quoted: body.slice(match.index).trim(),
      };
    }
  }

  return { main: body, quoted: null };
}
