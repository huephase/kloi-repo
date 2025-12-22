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

// 🟡🟡🟡 - [EMAIL SANITIZATION] Normalize and sanitize email input
export function sanitizeEmail(email: string | undefined | null): string | null {
  console.log('🟡🟡🟡 - [sanitizeEmail] Input email:', email);
  
  // Handle null/undefined
  if (!email) {
    console.log('🟡🟡🟡 - [sanitizeEmail] No email provided, returning null');
    return null;
  }
  
  // Trim whitespace
  const trimmed = email.trim();
  console.log('🟡🟡🟡 - [sanitizeEmail] Trimmed email:', trimmed);
  
  // Convert empty string to null
  if (trimmed === '') {
    console.log('🟡🟡🟡 - [sanitizeEmail] Empty string after trim, returning null');
    return null;
  }
  
  // Convert to lowercase for consistency
  const normalized = trimmed.toLowerCase();
  console.log('✅✅✅ - [sanitizeEmail] Normalized email:', normalized);
  
  return normalized;
}

// 🟡🟡🟡 - [SESSION UTILITIES] Extract guest count from session data
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [SESSION UTILITIES] Centralized guest count extraction to eliminate DRY violations
export function extractGuestCountFromSession(sessionData: any): number | null {
  console.log('🟡🟡🟡 - [extractGuestCountFromSession] Extracting guest count from session data');
  
  const eventSetup = sessionData?.eventSetup;
  if (!eventSetup) {
    console.log('🟡🟡🟡 - [extractGuestCountFromSession] No eventSetup found in session data');
    return null;
  }
  
  // 🟡🟡🟡 - [GUEST COUNT EXTRACTION] Try productQuantities first
  if (eventSetup.productQuantities && typeof eventSetup.productQuantities === 'object') {
    const guestCountValue = eventSetup.productQuantities['guest-count'];
    if (typeof guestCountValue === 'number' && guestCountValue > 0) {
      console.log('✅✅✅ - [extractGuestCountFromSession] Guest count extracted from productQuantities:', guestCountValue);
      return guestCountValue;
    }
  }
  
  // 🟡🟡🟡 - [GUEST COUNT EXTRACTION] Fallback to calculator.guestCount if not found
  if (eventSetup.calculator && typeof eventSetup.calculator === 'object') {
    const calculatorGuestCount = eventSetup.calculator.guestCount;
    if (typeof calculatorGuestCount === 'number' && calculatorGuestCount > 0) {
      console.log('✅✅✅ - [extractGuestCountFromSession] Guest count extracted from calculator:', calculatorGuestCount);
      return calculatorGuestCount;
    }
  }
  
  console.log('🟡🟡🟡 - [extractGuestCountFromSession] No valid guest count found in session data');
  return null;
}

// 🟡🟡🟡 - [SESSION UTILITIES] Calculate number of days from dateInfo session data
// 2025-12-20T00:00:00Z 🟡🟡🟡 - [SESSION UTILITIES] Centralized numberOfDays calculation to eliminate DRY violations
export function calculateNumberOfDaysFromDateInfo(dateInfo: any): number {
  console.log('🟡🟡🟡 - [calculateNumberOfDaysFromDateInfo] Calculating number of days from dateInfo');
  
  if (dateInfo && dateInfo.dates && Array.isArray(dateInfo.dates) && dateInfo.dates.length > 0) {
    const numberOfDays = dateInfo.dates.length;
    console.log('✅✅✅ - [calculateNumberOfDaysFromDateInfo] Number of days calculated:', numberOfDays, 'from dates:', dateInfo.dates);
    return numberOfDays;
  }
  
  console.warn('⚠️⚠️⚠️ - [calculateNumberOfDaysFromDateInfo] No valid dates found in dateInfo, using default numberOfDays: 1');
  return 1; // Default to 1 day if dateInfo invalid or dates array empty
}
