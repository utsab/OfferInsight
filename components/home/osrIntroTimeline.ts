/**
 * Ordered homepage scroll phases (viewport-height multiples).
 * Insert new phases between `howLettersMove` and `howToWhoop`.
 */
import {
  getPersonalBarContentEndY,
  getPersonalBarScrollDurationPercent,
} from './osrScrollUtils';

type OsrScrollPhase = {
  at: number;
  durationPercent: number;
};

const OSR_SCROLL_PHASES = {
  typingFadeOut: { at: 0, durationPercent: 40 },
  pageIndicator: { at: 0, durationPercent: 520 },
  whoSectionIn: { at: 1.0, durationPercent: 50 },
  whoLettersMove: { at: 1.2, durationPercent: 170 },
  whoContentIn: { at: 2.6, durationPercent: 40 },
  whoSectionOut: { at: 4.1, durationPercent: 40 },
  howSectionIn: { at: 4.45, durationPercent: 30 },
  howLettersMove: { at: 4.9, durationPercent: 80 },
  howToWhoop: { at: 5.7, durationPercent: 8 },
  whoopPersonalBarScroll: { at: 5.78, durationPercent: 400 },
  whoopToMicrosoft: { at: 9.9, durationPercent: 32 },
  microsoftPersonalBarScroll: { at: 10.26, durationPercent: 420 },
  microsoftToMeta: { at: 14.5, durationPercent: 32 },
  metaPersonalBarScroll: { at: 14.86, durationPercent: 420 },
  // `at` for affiliations/actions is recomputed in OsrIntroScroll from metaPersonalBarScroll end.
  affiliationsScroll: { at: 0, durationPercent: 90 },
  actionsScroll: { at: 0, durationPercent: 34 },
} as const satisfies Record<string, OsrScrollPhase>;

/** Mobile overrides for phases that differ from desktop. */
const OSR_SCROLL_PHASES_MOBILE: Partial<
  Record<keyof typeof OSR_SCROLL_PHASES, OsrScrollPhase>
> = {
  typingFadeOut: { at: 0, durationPercent: 20 },
  whoSectionIn: { at: 0.4, durationPercent: 20 },
  whoLettersMove: { at: 0.5, durationPercent: 30 },
  whoContentIn: { at: 0.8, durationPercent: 20 },
  howLettersMove: { at: 4.9, durationPercent: 80 },
  howToWhoop: { at: 5.7, durationPercent: 6 },
  whoopPersonalBarScroll: { at: 5.76, durationPercent: 430 },
  whoopToMicrosoft: { at: 10.22, durationPercent: 34 },
  microsoftPersonalBarScroll: { at: 10.58, durationPercent: 450 },
  microsoftToMeta: { at: 15.12, durationPercent: 34 },
  metaPersonalBarScroll: { at: 15.48, durationPercent: 450 },
  affiliationsScroll: { at: 0, durationPercent: 70 },
  actionsScroll: { at: 0, durationPercent: 34 },
};

export function getScrollPhase(
  key: keyof typeof OSR_SCROLL_PHASES,
  isMobile: boolean,
): OsrScrollPhase {
  const desktop = OSR_SCROLL_PHASES[key];
  const mobile = OSR_SCROLL_PHASES_MOBILE[key];
  if (isMobile && mobile) {
    return { ...desktop, ...mobile };
  }
  return desktop;
}

/** Total scroll track height — always past the final animation. */
export function getOsrScrollHeightVh(isMobile: boolean): number {
  const meta = getScrollPhase('metaPersonalBarScroll', isMobile);
  const affiliationsScroll = getScrollPhase('affiliationsScroll', isMobile);
  const actionsScroll = getScrollPhase('actionsScroll', isMobile);
  const affiliationsAt = phaseEnd(meta);
  const actionsAt = affiliationsAt + affiliationsScroll.durationPercent / 100;
  return actionsAt + actionsScroll.durationPercent / 100;
}

type CompactPersonalBarMeasurements = {
  viewportHeight: number;
  whoopContentHeight: number;
  microsoftContentHeight: number;
  metaContentHeight: number;
};

type CompactPersonalBarMotion = {
  whoopEndY: string;
  microsoftEndY: string;
  metaEndY: string;
};

function phaseEnd(phase: OsrScrollPhase): number {
  return phase.at + phase.durationPercent / 100;
}

/** Re-chain compact personal-bar phases from measured content heights (no fixed reference resolution). */
export function applyCompactPersonalBarAdaptivePhases<
  T extends {
    whoopPersonalBarScroll: OsrScrollPhase;
    whoopToMicrosoft: OsrScrollPhase;
    microsoftPersonalBarScroll: OsrScrollPhase;
    microsoftToMeta: OsrScrollPhase;
    metaPersonalBarScroll: OsrScrollPhase;
    affiliationsScroll: OsrScrollPhase;
    actionsScroll: OsrScrollPhase;
  },
>(phases: T, measurements: CompactPersonalBarMeasurements): { phases: T; motion: CompactPersonalBarMotion } {
  const { viewportHeight, whoopContentHeight, microsoftContentHeight, metaContentHeight } =
    measurements;

  const whoopPersonalBarScroll: OsrScrollPhase = {
    ...phases.whoopPersonalBarScroll,
    durationPercent: getPersonalBarScrollDurationPercent(
      whoopContentHeight,
      viewportHeight,
      phases.whoopPersonalBarScroll.durationPercent,
    ),
  };

  const whoopToMicrosoft: OsrScrollPhase = {
    ...phases.whoopToMicrosoft,
    at: phaseEnd(whoopPersonalBarScroll),
  };

  const microsoftPersonalBarScroll: OsrScrollPhase = {
    ...phases.microsoftPersonalBarScroll,
    at: phaseEnd(whoopToMicrosoft),
    durationPercent: getPersonalBarScrollDurationPercent(
      microsoftContentHeight,
      viewportHeight,
      phases.microsoftPersonalBarScroll.durationPercent,
    ),
  };

  const microsoftToMeta: OsrScrollPhase = {
    ...phases.microsoftToMeta,
    at: phaseEnd(microsoftPersonalBarScroll),
  };

  const metaPersonalBarScroll: OsrScrollPhase = {
    ...phases.metaPersonalBarScroll,
    at: phaseEnd(microsoftToMeta),
    durationPercent: getPersonalBarScrollDurationPercent(
      metaContentHeight,
      viewportHeight,
      phases.metaPersonalBarScroll.durationPercent,
    ),
  };

  const affiliationsScroll: OsrScrollPhase = {
    ...phases.affiliationsScroll,
    at: phaseEnd(metaPersonalBarScroll),
  };

  const actionsScroll: OsrScrollPhase = {
    ...phases.actionsScroll,
    at: phaseEnd(affiliationsScroll),
  };

  const nextPhases = {
    ...phases,
    whoopPersonalBarScroll,
    whoopToMicrosoft,
    microsoftPersonalBarScroll,
    microsoftToMeta,
    metaPersonalBarScroll,
    affiliationsScroll,
    actionsScroll,
  };

  return {
    phases: nextPhases,
    motion: {
      whoopEndY: getPersonalBarContentEndY(whoopContentHeight, viewportHeight, 135),
      microsoftEndY: getPersonalBarContentEndY(microsoftContentHeight, viewportHeight, 185),
      metaEndY: getPersonalBarContentEndY(metaContentHeight, viewportHeight, 185),
    },
  };
}

