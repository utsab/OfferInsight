import type {
  BoardTimeFilter,
  OpenSourceColumnId,
  OpenSourceEntry,
} from "../components/types";
import { buildPartnershipNameMatchSet, normalizePartnerName } from "./partnership-name-match";

type CompletedPartnershipLite = {
  partnershipId?: number;
  partnershipName: string;
  startedAt?: string | null;
  completedAt?: string | null;
};

type NameOption = { id: number; name: string };

type Params = {
  openSourceColumns: Record<OpenSourceColumnId, OpenSourceEntry[]>;
  openSourceFilter: BoardTimeFilter;
  selectedPartnership: string | null;
  selectedPartnershipId: number | null;
  viewingCompletedPartnershipName: string | null;
  completedPartnerships: CompletedPartnershipLite[];
  availablePartnerships: NameOption[];
  fullPartnerships: NameOption[];
  isWithinCurrentMonth: (value?: string | null) => boolean;
};

function openSourceDateForMonthFilter(entry: OpenSourceEntry): string | null {
  return entry.dateModified ?? entry.dateCreated ?? null;
}

function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function entryDateForCompletedWindow(entry: OpenSourceEntry): Date | null {
  return parseIsoDate(entry.dateCreated ?? entry.dateModified ?? null);
}

export function getFilteredOpenSourceColumns({
  openSourceColumns,
  openSourceFilter,
  selectedPartnership,
  selectedPartnershipId,
  viewingCompletedPartnershipName,
  completedPartnerships,
  availablePartnerships,
  fullPartnerships,
  isWithinCurrentMonth,
}: Params): Record<OpenSourceColumnId, OpenSourceEntry[]> {
  let filtered: Record<OpenSourceColumnId, OpenSourceEntry[]> = {
    plan: [],
    babyStep: [],
    inProgress: [],
    done: [],
  };

  const effectiveTimeFilter: BoardTimeFilter = viewingCompletedPartnershipName ? "allTime" : openSourceFilter;

  if (effectiveTimeFilter === "allTime") {
    filtered = { ...openSourceColumns };
  } else {
    (Object.keys(openSourceColumns) as OpenSourceColumnId[]).forEach((columnId) => {
      filtered[columnId] = openSourceColumns[columnId].filter((entry) =>
        isWithinCurrentMonth(openSourceDateForMonthFilter(entry))
      );
    });
  }

  const completedForView = viewingCompletedPartnershipName
    ? completedPartnerships.find(
        (c) => normalizePartnerName(c.partnershipName) === normalizePartnerName(viewingCompletedPartnershipName)
      )
    : undefined;

  let nameSet: Set<string> | null = null;
  if (viewingCompletedPartnershipName) {
    nameSet = buildPartnershipNameMatchSet(
      completedForView?.partnershipId ?? null,
      viewingCompletedPartnershipName,
      availablePartnerships,
      fullPartnerships
    );
  } else if (selectedPartnership) {
    nameSet = buildPartnershipNameMatchSet(
      selectedPartnershipId,
      selectedPartnership,
      availablePartnerships,
      fullPartnerships
    );
  }

  if (nameSet && nameSet.size > 0) {
    const isActiveView = Boolean(selectedPartnership && !viewingCompletedPartnershipName);
    (Object.keys(filtered) as OpenSourceColumnId[]).forEach((columnId) => {
      filtered[columnId] = filtered[columnId].filter((entry) => {
        const n = normalizePartnerName(entry.partnershipName);
        if (n === "") return isActiveView;
        return nameSet.has(n);
      });
    });
  }

  if (selectedPartnership && !viewingCompletedPartnershipName) {
    const total = (Object.keys(filtered) as OpenSourceColumnId[]).reduce(
      (acc, k) => acc + filtered[k].length,
      0
    );
    const timeTotal = (Object.keys(openSourceColumns) as OpenSourceColumnId[]).reduce((acc, k) => {
      const arr =
        effectiveTimeFilter === "allTime"
          ? openSourceColumns[k]
          : openSourceColumns[k].filter((entry) => isWithinCurrentMonth(openSourceDateForMonthFilter(entry)));
      return acc + arr.length;
    }, 0);
    if (total === 0 && timeTotal > 0) {
      const fallback: Record<OpenSourceColumnId, OpenSourceEntry[]> = {
        plan: [],
        babyStep: [],
        inProgress: [],
        done: [],
      };
      (Object.keys(openSourceColumns) as OpenSourceColumnId[]).forEach((columnId) => {
        fallback[columnId] =
          effectiveTimeFilter === "allTime"
            ? [...openSourceColumns[columnId]]
            : openSourceColumns[columnId].filter((entry) =>
                isWithinCurrentMonth(openSourceDateForMonthFilter(entry))
              );
      });
      return fallback;
    }
  }

  if (viewingCompletedPartnershipName) {
    const total = (Object.keys(filtered) as OpenSourceColumnId[]).reduce(
      (acc, k) => acc + filtered[k].length,
      0
    );
    const start = parseIsoDate(completedForView?.startedAt ?? null);
    const end = parseIsoDate(completedForView?.completedAt ?? null);
    if (total === 0 && start) {
      const windowFiltered: Record<OpenSourceColumnId, OpenSourceEntry[]> = {
        plan: [],
        babyStep: [],
        inProgress: [],
        done: [],
      };
      (Object.keys(openSourceColumns) as OpenSourceColumnId[]).forEach((columnId) => {
        windowFiltered[columnId] = openSourceColumns[columnId].filter((entry) => {
          const d = entryDateForCompletedWindow(entry);
          if (!d) return false;
          if (d < start) return false;
          if (end && d > end) return false;
          return true;
        });
      });
      const windowTotal = (Object.keys(windowFiltered) as OpenSourceColumnId[]).reduce(
        (acc, k) => acc + windowFiltered[k].length,
        0
      );
      if (windowTotal > 0) return windowFiltered;
    }
  }

  if (!viewingCompletedPartnershipName) {
    const finalTotal = (Object.keys(filtered) as OpenSourceColumnId[]).reduce(
      (acc, k) => acc + filtered[k].length,
      0
    );
    if (finalTotal === 0) {
      const base: Record<OpenSourceColumnId, OpenSourceEntry[]> = {
        plan: [],
        babyStep: [],
        inProgress: [],
        done: [],
      };
      (Object.keys(openSourceColumns) as OpenSourceColumnId[]).forEach((columnId) => {
        base[columnId] =
          effectiveTimeFilter === "allTime"
            ? [...openSourceColumns[columnId]]
            : openSourceColumns[columnId].filter((entry) =>
                isWithinCurrentMonth(openSourceDateForMonthFilter(entry))
              );
      });
      const baseTotal = (Object.keys(base) as OpenSourceColumnId[]).reduce(
        (acc, k) => acc + base[k].length,
        0
      );
      if (baseTotal > 0) return base;
    }
  }

  return filtered;
}
