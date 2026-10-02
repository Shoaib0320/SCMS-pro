import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Strictly format any time string (24-hour HH:mm, ISO, or 12-hour) into 12-hour format with AM/PM (e.g. 09:30 AM).
 */
export function formatTo12Hour(timeStr) {
  if (!timeStr) return "";
  if (typeof timeStr !== "string") return String(timeStr);
  const trimmed = timeStr.trim();
  if (!trimmed) return "";

  // If already contains AM or PM (e.g. "09:00 AM", "9:30pm", "02:15 pm")
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  }

  // If standard 24h format e.g. "14:30", "09:00", "14:30:00"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    const m = match24[2];
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
  }

  return trimmed;
}

/**
 * Parse any time string (typed or pasted in 12h or 24h format) into standard 24-hour format "HH:mm".
 */
export function parseTo24Hour(str) {
  if (!str || typeof str !== "string") return "";
  const trimmed = str.trim();
  if (!trimmed) return "";

  // Match "09:30 AM", "9:30am", "14:30", "9:30"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const meridian = match[3] ? match[3].toUpperCase() : null;
    if (m < 0 || m > 59) return "";
    if (meridian) {
      if (h < 1 || h > 12) return "";
      if (meridian === "PM" && h < 12) h += 12;
      if (meridian === "AM" && h === 12) h = 0;
    } else {
      if (h < 0 || h > 23) return "";
    }
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // Match digits without colon like "0930", "1430", "930", "930am"
  const matchDigits = trimmed.match(/^(\d{1,2})(\d{2})\s*(am|pm)?$/i);
  if (matchDigits) {
    let h = parseInt(matchDigits[1], 10);
    const m = parseInt(matchDigits[2], 10);
    const meridian = matchDigits[3] ? matchDigits[3].toUpperCase() : null;
    if (m < 0 || m > 59) return "";
    if (meridian) {
      if (h < 1 || h > 12) return "";
      if (meridian === "PM" && h < 12) h += 12;
      if (meridian === "AM" && h === 12) h = 0;
    } else {
      if (h < 0 || h > 23) return "";
    }
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return "";
}

export * from "./academicYearUtils";
