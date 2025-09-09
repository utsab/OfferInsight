/**
 * Date utility functions to prevent hydration mismatches
 * by ensuring consistent date handling between server and client
 */

/**
 * Get a consistent date object that works the same on server and client
 * This normalizes timezone differences that can cause hydration mismatches
 */
export function getConsistentDate(): Date {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset();
  
  // Normalize to UTC to ensure consistency between server and client
  return new Date(now.getTime() + (timezoneOffset * 60000));
}

/**
 * Get the start and end of the current week (Monday to Sunday)
 * Uses consistent date handling to avoid hydration mismatches
 */
export function getCurrentWeekDateRange() {
  const utcNow = getConsistentDate();
  
  // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const currentDay = utcNow.getDay();

  // Calculate days to Monday (if today is Sunday, we need to go back 6 days)
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

  // Create a new date for Monday (start of the week)
  const monday = new Date(utcNow);
  monday.setDate(utcNow.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  // Create a new date for Sunday (end of the week)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

/**
 * Get the start and end of the current month
 * Uses consistent date handling to avoid hydration mismatches
 */
export function getCurrentMonthDateRange() {
  const utcNow = getConsistentDate();
  
  const firstDayOfMonth = new Date(utcNow);
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const lastDayOfMonth = new Date(utcNow);
  lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
  lastDayOfMonth.setDate(0);
  lastDayOfMonth.setHours(23, 59, 59, 999);

  return { firstDayOfMonth, lastDayOfMonth };
}

/**
 * Format a date consistently for display
 * Handles both Date objects and date strings
 */
export function formatDateForDisplay(date: Date | string): string {
  let dateObj: Date;

  if (date instanceof Date) {
    dateObj = date;
  } else {
    dateObj = new Date(date);
  }

  // Fix date display by using UTC methods
  const year = dateObj.getUTCFullYear();
  const month = dateObj.getUTCMonth() + 1; // getUTCMonth() returns 0-11
  const day = dateObj.getUTCDate();

  // Format as MM/DD/YYYY
  return `${month}/${day}/${year}`;
}
