import { getUserTimezone } from './get-user-timezone';

/**
 * Get headers with user timezone information
 * Can be used when making API requests
 */
export function getHeadersWithTimezone(additionalHeaders: Record<string, string> = {}) {
  const timezoneInfo = getUserTimezone();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  if (timezoneInfo) {
    headers['X-User-Timezone-Offset'] = timezoneInfo.offset.toString();
    headers['X-User-Timezone'] = timezoneInfo.timezone;
  }
  
  return headers;
}

