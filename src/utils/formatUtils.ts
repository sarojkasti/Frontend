import moment from "moment";

/**
 * Format business status enum to readable text
 */
export const formatBusinessStatus = (status?: string): string => {
  if (!status) return '';
  
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a time string into 12-hour format with AM/PM (e.g., "09:13:12 pm").
 * Gracefully fixes malformed strings like "21:13:12 pm", raw 24-hr times "20:15:39",
 * and ISO timestamps.
 */
export const formatTime12Hour = (timeStr?: string | null): string => {
  if (!timeStr) return "-";
  const trimmed = String(timeStr).trim();
  if (!trimmed || trimmed === "N/A" || trimmed === "-" || trimmed === "null" || trimmed === "undefined") {
    return "-";
  }

  // 1. Direct Regex Match for "HH:mm:ss a" or "HH:mm:ss" or "HH:mm"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const second = match[3] || "00";
    let meridiem = match[4]?.toLowerCase();

    // Determine meridiem if missing
    if (!meridiem) {
      meridiem = hour >= 12 ? "pm" : "am";
    }

    // Convert hour to 12-hour format (1 - 12)
    if (hour > 12) {
      hour = hour - 12;
    } else if (hour === 0) {
      hour = 12;
    }

    const paddedHour = hour.toString().padStart(2, "0");
    return `${paddedHour}:${minute}:${second} ${meridiem}`;
  }

  // 2. Parse using moment for ISO or full datetime strings
  const parsed = moment(trimmed);
  if (parsed.isValid()) {
    return parsed.format("hh:mm:ss a");
  }

  return trimmed;
};

/**
 * Safely parse a time string to a moment object for duration calculations and sorting.
 */
export const parseTimeMoment = (timeStr?: string | null, dateStr?: string): moment.Moment | null => {
  if (!timeStr) return null;
  const trimmed = String(timeStr).trim();
  if (!trimmed || trimmed === "N/A" || trimmed === "-" || trimmed === "null") return null;

  const formatted = formatTime12Hour(trimmed);
  if (formatted === "-") return null;

  const baseDate = dateStr ? moment(dateStr).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
  const parsed = moment(`${baseDate} ${formatted}`, "YYYY-MM-DD hh:mm:ss a");
  return parsed.isValid() ? parsed : null;
};

/**
 * Strips HTML tags and entities, converting rich text to clean plain text.
 */
export const stripHtml = (html?: string | null): string => {
  if (!html) return "";
  const str = String(html);
  if (!str.includes("<") && !str.includes("&")) return str.trim();

  return str
    .replace(/<br\s*[\/]?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<\/li>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Checks if a string contains HTML tags.
 */
export const hasHtmlTags = (str?: string | null): boolean => {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(String(str));
};

