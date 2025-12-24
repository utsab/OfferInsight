/**
 * Date utility functions
 */

/**
 * Get the start and end of the current month
 */
export function getCurrentMonthDateRange() {
  const now = new Date();
  
  const firstDayOfMonth = new Date(now);
  firstDayOfMonth.setUTCDate(1);
  firstDayOfMonth.setUTCHours(0, 0, 0, 0);

  const lastDayOfMonth = new Date(now);
  lastDayOfMonth.setUTCMonth(lastDayOfMonth.getUTCMonth() + 1);
  lastDayOfMonth.setUTCDate(0);
  lastDayOfMonth.setUTCHours(23, 59, 59, 999);

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
