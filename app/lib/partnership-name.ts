/** Trims and lowercases for matching when names drift between DB, JSON, and API lists. */
export function normalizePartnerName(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}
