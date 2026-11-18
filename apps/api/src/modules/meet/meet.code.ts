import crypto from "node:crypto";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

/**
 * Generates a Google Meet style meeting code: 3 letters - 4 letters - 3 letters.
 * e.g., "abc-defg-hij"
 */
export function generateMeetingCode(): string {
  const getRandomLetters = (length: number): string => {
    const bytes = crypto.randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++) {
      result += LETTERS[bytes[i] % LETTERS.length];
    }
    return result;
  };

  const part1 = getRandomLetters(3);
  const part2 = getRandomLetters(4);
  const part3 = getRandomLetters(3);

  return `${part1}-${part2}-${part3}`;
}

/**
 * Normalizes and validates user input meeting codes or URLs.
 * Accepts:
 * - "abc-defg-hij"
 * - "ABC-DEFG-HIJ"
 * - "abcdefghij" (formats with hyphens)
 * - "https://orvexa.com/meet/abc-defg-hij"
 * - "http://localhost:5155/meet/abc-defg-hij?authuser=0"
 * Returns normalized "abc-defg-hij" or null if invalid.
 */
export function normalizeMeetingCode(input: string): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  let cleaned = input.trim();

  // If a URL was provided, extract the last path segment before query params
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
    // If not a valid URL, continue with raw cleaned string
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

  // If 10 contiguous letters without hyphens: "abcdefghij"
  const rawLetters = cleaned.replace(/-/g, "");
  if (rawLetters.length === 10 && /^[a-z]{10}$/.test(rawLetters)) {
    return `${rawLetters.slice(0, 3)}-${rawLetters.slice(3, 7)}-${rawLetters.slice(7, 10)}`;
  }

  return null;
}
