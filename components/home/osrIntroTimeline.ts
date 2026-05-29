/**
 * Ordered homepage scroll phases (viewport-height multiples).
 * Insert new phases between `howLettersMove` and `howSectionOut`.
 */
import {
  getPersonalBarContentEndY,
  getPersonalBarScrollDurationPercent,
} from './osrScrollUtils';

export type OsrScrollPhase = {
  at: number;
  durationPercent: number;
};

export const OSR_SCROLL_PHASES = {
  typingFadeOut: { at: 0, durationPercent: 40 },
  pageIndicator: { at: 0, durationPercent: 520 },
  whoSectionIn: { at: 1.0, durationPercent: 50 },
  whoLettersMove: { at: 1.2, durationPercent: 170 },
  whoContentIn: { at: 2.6, durationPercent: 40 },
  whoSectionOut: { at: 4.1, durationPercent: 40 },
  howSectionIn: { at: 4.45, durationPercent: 30 },
  howLettersMove: { at: 4.9, durationPercent: 80 },
  howSectionOut: { at: 5.7, durationPercent: 28 },
  whoopPersonalBarScroll: { at: 5.88, durationPercent: 400 },
  whoopToMicrosoft: { at: 9.9, durationPercent: 32 },
  microsoftPersonalBarScroll: { at: 10.26, durationPercent: 420 },
  microsoftToMeta: { at: 14.5, durationPercent: 32 },
  metaPersonalBarScroll: { at: 14.86, durationPercent: 420 },
  metaToAffiliations: { at: 19.1, durationPercent: 36 },
  affiliationsLogos: { at: 19.34, durationPercent: 88 },
} as const satisfies Record<string, OsrScrollPhase>;

/** Extra scroll after the last scrub scene so logo stagger can finish. */
const SCROLL_TAIL_HOLD_VH = 0.65;

/** Mobile overrides for phases that differ from desktop. */
export const OSR_SCROLL_PHASES_MOBILE: Partial<
  Record<keyof typeof OSR_SCROLL_PHASES, OsrScrollPhase>
> = {
  typingFadeOut: { at: 0, durationPercent: 20 },
  whoSectionIn: { at: 0.4, durationPercent: 20 },
  whoLettersMove: { at: 0.5, durationPercent: 30 },
  whoContentIn: { at: 0.8, durationPercent: 20 },
  howLettersMove: { at: 4.9, durationPercent: 80 },
  whoopPersonalBarScroll: { at: 5.88, durationPercent: 430 },
  whoopToMicrosoft: { at: 10.22, durationPercent: 34 },
  microsoftPersonalBarScroll: { at: 10.58, durationPercent: 450 },
  microsoftToMeta: { at: 15.12, durationPercent: 34 },
  metaPersonalBarScroll: { at: 15.48, durationPercent: 450 },
  metaToAffiliations: { at: 20.02, durationPercent: 28 },
  affiliationsLogos: { at: 20.14, durationPercent: 12 },
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
  const tailHold = isMobile ? 0.04 : SCROLL_TAIL_HOLD_VH;
  const logos = getScrollPhase('affiliationsLogos', isMobile);
  return phaseEnd(logos) + tailHold;
}

export type CompactPersonalBarMeasurements = {
  viewportHeight: number;
  whoopContentHeight: number;
  microsoftContentHeight: number;
  metaContentHeight: number;
};

export type CompactPersonalBarMotion = {
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
    metaToAffiliations: OsrScrollPhase;
    affiliationsLogos: OsrScrollPhase;
  },
>(phases: T, measurements: CompactPersonalBarMeasurements): { phases: T; motion: CompactPersonalBarMotion; scrollHeightVh: number } {
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

  const metaToAffiliations: OsrScrollPhase = {
    ...phases.metaToAffiliations,
    at: phaseEnd(metaPersonalBarScroll),
  };

  const affiliationsLogos: OsrScrollPhase = {
    ...phases.affiliationsLogos,
    at: phaseEnd(metaToAffiliations),
  };

  const nextPhases = {
    ...phases,
    whoopPersonalBarScroll,
    whoopToMicrosoft,
    microsoftPersonalBarScroll,
    microsoftToMeta,
    metaPersonalBarScroll,
    metaToAffiliations,
    affiliationsLogos,
  };

  const tailHold = 0.04;
  const scrollHeightVh = phaseEnd(affiliationsLogos) + tailHold;

  return {
    phases: nextPhases,
    motion: {
      whoopEndY: getPersonalBarContentEndY(whoopContentHeight, viewportHeight, 135),
      microsoftEndY: getPersonalBarContentEndY(microsoftContentHeight, viewportHeight, 185),
      metaEndY: getPersonalBarContentEndY(metaContentHeight, viewportHeight, 185),
    },
    scrollHeightVh,
  };
}

