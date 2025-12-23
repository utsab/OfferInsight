/**
 * Server-side date utilities for handling user timezone
 */

/**
 * Get the current date - stored in UTC
 * The display layer will convert to user's timezone
 * 
 * Note: We store dates in UTC and let the client-side display code
 * handle timezone conversion. This ensures consistency regardless of
 * server location or timezone.
 */
export function getDateInUserTimezone(): Date {
  return new Date();
}
