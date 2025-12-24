/**
 * Get headers for API requests
 */
export function getApiHeaders(additionalHeaders: Record<string, string> = {}) {
  return {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
}

