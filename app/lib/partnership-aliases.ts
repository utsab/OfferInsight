import partnershipsData from '@/partnerships/partnerships.json';
import { normalizePartnerName } from '@/app/lib/partnership-name';

/** Un-trimmed, unique name strings to match on DB `partnershipName` and for API query params. */
export function getPartnershipNameAliasStrings(
  partnershipId: number | null,
  displayName: string | null,
  availablePartnerships: Array<{ id: number; name: string }>,
  fullPartnerships: Array<{ id: number; name: string }>
): string[] {
  const raw: string[] = [];
  if (displayName) raw.push(displayName);
  if (partnershipId != null) {
    const fromJson = partnershipsData.partnerships.find(p => p.id === partnershipId)?.name;
    if (fromJson) raw.push(fromJson);
    const fromAvail = availablePartnerships.find(p => p.id === partnershipId)?.name;
    if (fromAvail) raw.push(fromAvail);
    const fromFull = fullPartnerships.find(p => p.id === partnershipId)?.name;
    if (fromFull) raw.push(fromFull);
  }
  return [...new Set(raw.map(s => s.trim()).filter(Boolean))];
}

/** Normalized set for client-side / resilient matching. */
export function buildPartnershipNameMatchSet(
  partnershipId: number | null,
  displayName: string | null,
  availablePartnerships: Array<{ id: number; name: string }>,
  fullPartnerships: Array<{ id: number; name: string }>
): Set<string> {
  return new Set(
    getPartnershipNameAliasStrings(
      partnershipId,
      displayName,
      availablePartnerships,
      fullPartnerships
    ).map(s => normalizePartnerName(s))
  );
}
