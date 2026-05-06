import partnershipsData from "@/partnerships/partnerships.json";

type NameOption = { id: number; name: string };

export function normalizePartnerName(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function buildPartnershipNameMatchSet(
  partnershipId: number | null,
  displayName: string | null,
  availablePartnerships: NameOption[],
  fullPartnerships: NameOption[]
): Set<string> {
  const out = new Set<string>();
  if (displayName) out.add(normalizePartnerName(displayName));
  if (partnershipId != null) {
    const fromJson = partnershipsData.partnerships.find((p) => p.id === partnershipId)?.name;
    if (fromJson) out.add(normalizePartnerName(fromJson));
    const fromAvail = availablePartnerships.find((p) => p.id === partnershipId)?.name;
    if (fromAvail) out.add(normalizePartnerName(fromAvail));
    const fromFull = fullPartnerships.find((p) => p.id === partnershipId)?.name;
    if (fromFull) out.add(normalizePartnerName(fromFull));
  }
  return out;
}
