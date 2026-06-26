import type { OpenSourceEntry } from "../components/types";
import { normalizePartnerName } from "./partnership-name-match";

type ProofFieldDef = {
  type?: string;
  text?: string;
};

type PartnershipCriteriaDef = {
  type?: string;
  proof_of_completion?: ProofFieldDef[];
};

export function getEffectiveProofOfCompletionFields(
  entry: OpenSourceEntry,
  partnershipCriteria: PartnershipCriteriaDef[] = []
): ProofFieldDef[] {
  const proofFields: ProofFieldDef[] = [...(entry.proofOfCompletion ?? [])];

  if (entry.criteriaType !== "issue" || !entry.selectedExtras?.length) {
    return proofFields;
  }

  for (const extraType of entry.selectedExtras) {
    const extraCriteria = partnershipCriteria.find((c) => c.type === extraType);
    if (extraCriteria?.proof_of_completion?.length) {
      proofFields.push(...extraCriteria.proof_of_completion);
    }
  }

  return proofFields;
}

export function isProofOfWorkComplete(
  entry: OpenSourceEntry,
  partnershipCriteria: PartnershipCriteriaDef[] = []
): boolean {
  const proofFields = getEffectiveProofOfCompletionFields(entry, partnershipCriteria);
  if (proofFields.length === 0) return true;

  const responses = entry.proofResponses ?? {};
  for (const field of proofFields) {
    const key = field?.text;
    if (!key) continue;
    const val = responses[key];
    const fieldType = (field?.type ?? "").toLowerCase();
    if (fieldType === "checkbox") {
      if (!val) return false;
    } else if (val == null || String(val).trim() === "") {
      return false;
    }
  }

  return true;
}

export function getPartnershipCriteriaForEntry(
  entry: OpenSourceEntry,
  activePartnershipCriteria: PartnershipCriteriaDef[],
  completedPartnerships: Array<{
    partnershipName: string;
    criteria?: PartnershipCriteriaDef[];
  }> = []
): PartnershipCriteriaDef[] {
  const completed = completedPartnerships.find(
    (p) =>
      normalizePartnerName(p.partnershipName) ===
      normalizePartnerName(entry.partnershipName)
  );
  if (completed?.criteria?.length) {
    return completed.criteria;
  }
  return activePartnershipCriteria;
}
