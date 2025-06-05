// Utility functions (dates, etc.)

// Format a JS Date as UTC ISO string
export function formatUTC(date: Date): string {
  console.log('🟡🟡🟡 - [formatUTC] called:', date);
  const iso = date.toISOString();
  console.log('🟡🟡🟡 - [formatUTC] return:', iso);
  return iso;
}

// Convert a JS Date to UAE time (UTC+4) and return ISO string
export function toUAETime(date: Date): string {
  console.log('🟡🟡🟡 - [toUAETime] called:', date);
  const uaeOffset = 4 * 60; // minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const uae = new Date(utc + uaeOffset * 60000);
  const iso = uae.toISOString();
  console.log('🟡🟡🟡 - [toUAETime] return:', iso);
  return iso;
}

// Remove undefined/null keys from an object
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  console.log('🟡🟡🟡 - [sanitizeObject] called:', obj);
  const clean = Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  ) as T;
  console.log('🟡🟡🟡 - [sanitizeObject] return:', clean);
  return clean;
}
