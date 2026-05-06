import type { OpenSourceColumnId, OpenSourceEntry } from "@/app/dashboard/components/types";
import { getFilteredOpenSourceColumns } from "@/app/dashboard/lib/open-source-filter";

const COLUMNS: OpenSourceColumnId[] = ["plan", "babyStep", "inProgress", "done"];

function makeColumns(rows: Partial<OpenSourceEntry>[]): Record<OpenSourceColumnId, OpenSourceEntry[]> {
  const out: Record<OpenSourceColumnId, OpenSourceEntry[]> = {
    plan: [],
    babyStep: [],
    inProgress: [],
    done: [],
  };
  rows.forEach((r, idx) => {
    const status = (r.status ?? "plan") as OpenSourceColumnId;
    out[status].push({
      id: r.id ?? idx + 1,
      partnershipName: r.partnershipName ?? "",
      status: status,
      userId: r.userId ?? "u1",
      criteriaType: r.criteriaType ?? "issue",
      metric: r.metric ?? "m",
      selectedExtras: r.selectedExtras ?? [],
      planFields: r.planFields ?? [],
      planResponses: r.planResponses ?? {},
      babyStepFields: r.babyStepFields ?? [],
      babyStepResponses: r.babyStepResponses ?? {},
      proofOfCompletion: r.proofOfCompletion ?? [],
      proofResponses: r.proofResponses ?? {},
      dateCreated: r.dateCreated ?? "2026-04-10T12:00:00.000Z",
      dateModified: r.dateModified ?? "2026-04-11T12:00:00.000Z",
    });
  });
  return out;
}

function total(columns: Record<OpenSourceColumnId, OpenSourceEntry[]>): number {
  return COLUMNS.reduce((acc, c) => acc + columns[c].length, 0);
}

describe("getFilteredOpenSourceColumns", () => {
  const isWithinCurrentMonth = (value?: string | null) => {
    if (!value) return false;
    return value.startsWith("2026-04");
  };

  const baseParams = {
    openSourceFilter: "allTime" as const,
    selectedPartnership: null as string | null,
    selectedPartnershipId: null as number | null,
    viewingCompletedPartnershipName: null as string | null,
    completedPartnerships: [] as Array<{
      id: number;
      partnershipName: string;
      partnershipId?: number;
      startedAt?: string | null;
      completedAt?: string | null;
    }>,
    availablePartnerships: [] as Array<{ id: number; name: string }>,
    fullPartnerships: [] as Array<{ id: number; name: string }>,
    isWithinCurrentMonth,
  };

  it("shows active cards despite display-name drift via alias set", () => {
    const openSourceColumns = makeColumns([
      { id: 1, status: "plan", partnershipName: "Kevin M." },
      { id: 2, status: "done", partnershipName: "Someone Else" },
    ]);

    const filtered = getFilteredOpenSourceColumns({
      ...baseParams,
      openSourceColumns,
      selectedPartnership: "Kevin Mershon",
      selectedPartnershipId: 7,
      availablePartnerships: [{ id: 7, name: "Kevin M." }],
      fullPartnerships: [{ id: 7, name: "Kevin M." }],
    });

    expect(total(filtered)).toBe(1);
    expect(filtered.plan[0]?.partnershipName).toBe("Kevin M.");
  });

  it("does not leak current cards when viewing an empty completed partnership", () => {
    const openSourceColumns = makeColumns([
      { id: 1, status: "plan", partnershipName: "Current Partner" },
      { id: 2, status: "done", partnershipName: "Current Partner" },
    ]);

    const filtered = getFilteredOpenSourceColumns({
      ...baseParams,
      openSourceColumns,
      selectedPartnership: "Current Partner",
      viewingCompletedPartnershipName: "Completed With No Cards",
      completedPartnerships: [
        {
          id: 101,
          partnershipName: "Completed With No Cards",
          startedAt: "2026-01-01T00:00:00.000Z",
          completedAt: "2026-01-31T23:59:59.000Z",
        },
      ],
    });

    expect(total(filtered)).toBe(0);
  });

  it("uses completed date-window fallback when name filter has zero matches", () => {
    const openSourceColumns = makeColumns([
      { id: 1, status: "plan", partnershipName: "Other Name", dateCreated: "2026-03-15T00:00:00.000Z" },
      { id: 2, status: "done", partnershipName: "Other Name", dateCreated: "2026-03-20T00:00:00.000Z" },
      { id: 3, status: "done", partnershipName: "Other Name", dateCreated: "2026-04-20T00:00:00.000Z" },
    ]);

    const filtered = getFilteredOpenSourceColumns({
      ...baseParams,
      openSourceColumns,
      viewingCompletedPartnershipName: "Target Completed",
      completedPartnerships: [
        {
          id: 222,
          partnershipName: "Target Completed",
          startedAt: "2026-03-01T00:00:00.000Z",
          completedAt: "2026-03-31T23:59:59.000Z",
        },
      ],
    });

    expect(total(filtered)).toBe(2);
    expect(filtered.done).toHaveLength(1);
  });

  it("falls back to time-filtered rows when active name filtering removes all cards", () => {
    const openSourceColumns = makeColumns([
      { id: 1, status: "plan", partnershipName: "Name A", dateModified: "2026-04-10T00:00:00.000Z" },
      { id: 2, status: "done", partnershipName: "Name B", dateModified: "2026-04-11T00:00:00.000Z" },
    ]);

    const filtered = getFilteredOpenSourceColumns({
      ...baseParams,
      openSourceColumns,
      openSourceFilter: "modifiedThisMonth",
      selectedPartnership: "No Match Name",
      selectedPartnershipId: 99999,
    });

    expect(total(filtered)).toBe(2);
  });
});
