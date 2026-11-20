/**
 * Normalizes and validates user input meeting codes or URLs.
 * Returns normalized "abc-defg-hij" or null if invalid.
 */
export function normalizeMeetingCode(input: string): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  let cleaned = input.trim();

  // If a URL was entered
  try {
    if (cleaned.includes("://") || cleaned.includes("/")) {
      const url = new URL(cleaned.startsWith("http") ? cleaned : `https://${cleaned}`);
      const segments = url.pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (last) {
        cleaned = last;
      }
    }
  } catch {
    const match = cleaned.match(/([a-zA-Z-]{10,12})/);
    if (match) {
      cleaned = match[1];
    }
  }

  cleaned = cleaned.toLowerCase().replace(/[^a-z-]/g, "");

  // If already in 3-4-3 format
  if (/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(cleaned)) {
    return cleaned;
  }

  // If 10 contiguous letters without hyphens
  const rawLetters = cleaned.replace(/-/g, "");
  if (rawLetters.length === 10 && /^[a-z]{10}$/.test(rawLetters)) {
    return `${rawLetters.slice(0, 3)}-${rawLetters.slice(3, 7)}-${rawLetters.slice(7, 10)}`;
  }

  return null;
}

export function formatMeetingUrl(code: string): string {
  const origin = window.location.origin;
  return `${origin}/meet/${code}`;
}
