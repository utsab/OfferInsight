/**
 * Get the user's timezone information
 * Returns both IANA timezone name and UTC offset in minutes
 */
export function getUserTimezone() {
  if (typeof window === 'undefined') {
    // Server-side: return null (will use server timezone)
    return null;
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset(); // Offset in minutes, negative means ahead of UTC
    return {
      timezone, // e.g., "America/Los_Angeles"
      offset, // e.g., 480 for PST (UTC-8), -300 for EST (UTC+5)
    };
  } catch (error) {
    console.error('Error detecting timezone:', error);
    return null;
  }
}

