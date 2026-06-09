/**
 * Ordered homepage scroll phases (viewport-height multiples).
 * Insert new phases between `howLettersMove` and `howToWhoop`.
 */
import {
  getActionsContentEndY,
  getActionsScrollTravelVh,
  getMatchedScrollDurationPercent,
  getPersonalBarContentEndY,
  getPersonalBarScrollDurationPercent,
  parseNegativeVh,
  PERSONAL_BAR_CONTENT_START_VH,
} from './osrScrollUtils';

type OsrScrollPhase = {
  at: number;
  durationPercent: number;
};

const OSR_SCROLL_PHASES = {
  typingFadeOut: { at: 0, durationPercent: 40 },
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
  // Tail phases (`at`) are recomputed from measured content in applyIntroContentPhaseChain.
  metaToAffiliations: { at: 0, durationPercent: 32 },
  affiliationsScroll: { at: 0, durationPercent: 90 },
  affiliationsToActions: { at: 0, durationPercent: 32 },
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
  metaToAffiliations: { at: 0, durationPercent: 34 },
  affiliationsScroll: { at: 0, durationPercent: 70 },
  affiliationsToActions: { at: 0, durationPercent: 34 },
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

function phaseEnd(phase: OsrScrollPhase): number {
  return phase.at + phase.durationPercent / 100;
}

/** Total scroll track height — always past the final animation. */
export function getOsrScrollHeightVh(isMobile: boolean): number {
  const meta = getScrollPhase('metaPersonalBarScroll', isMobile);
  const metaToAffiliations = getScrollPhase('metaToAffiliations', isMobile);
  const affiliationsScroll = getScrollPhase('affiliationsScroll', isMobile);
  const affiliationsToActions = getScrollPhase('affiliationsToActions', isMobile);
  const actionsScroll = getScrollPhase('actionsScroll', isMobile);
  return (
    phaseEnd(meta) +
    metaToAffiliations.durationPercent / 100 +
    affiliationsScroll.durationPercent / 100 +
    affiliationsToActions.durationPercent / 100 +
    actionsScroll.durationPercent / 100
  );
}

type IntroContentMeasurements = {
  viewportHeight: number;
  layoutReferenceHeight: number;
  whoopContentHeight: number;
  microsoftContentHeight: number;
  metaContentHeight: number;
  affiliationsContentHeight: number;
  actionsContentHeight: number;
};

type IntroContentMotion = {
  whoopEndY: string;
  microsoftEndY: string;
  metaEndY: string;
  affiliationsEndY: string;
  actionsEndY: string;
};

/** Re-chain personal-bar and tail phases from measured content heights. */
export function applyIntroContentPhaseChain<
  T extends {
    whoopPersonalBarScroll: OsrScrollPhase;
    whoopToMicrosoft: OsrScrollPhase;
    microsoftPersonalBarScroll: OsrScrollPhase;
    microsoftToMeta: OsrScrollPhase;
    metaPersonalBarScroll: OsrScrollPhase;
    metaToAffiliations: OsrScrollPhase;
    affiliationsScroll: OsrScrollPhase;
    affiliationsToActions: OsrScrollPhase;
    actionsScroll: OsrScrollPhase;
  },
>(
  phases: T,
  measurements: IntroContentMeasurements,
): { phases: T; motion: IntroContentMotion } {
  const {
    viewportHeight,
    layoutReferenceHeight,
    whoopContentHeight,
    microsoftContentHeight,
    metaContentHeight,
    affiliationsContentHeight,
    actionsContentHeight,
  } = measurements;

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

  const affiliationsEndY = getPersonalBarContentEndY(
    affiliationsContentHeight,
    layoutReferenceHeight,
    40,
  );

  const affiliationsScroll: OsrScrollPhase = {
    ...phases.affiliationsScroll,
    at: phaseEnd(metaToAffiliations),
    durationPercent: getPersonalBarScrollDurationPercent(
      affiliationsContentHeight,
      viewportHeight,
      phases.affiliationsScroll.durationPercent,
    ),
  };

  const affiliationsToActions: OsrScrollPhase = {
    ...phases.affiliationsToActions,
    at: phaseEnd(affiliationsScroll),
  };

  const actionsEndY = getActionsContentEndY(actionsContentHeight, layoutReferenceHeight);
  const affiliationsTravelVh =
    PERSONAL_BAR_CONTENT_START_VH + parseNegativeVh(affiliationsEndY);
  const actionsTravelVh = getActionsScrollTravelVh(actionsEndY);

  const actionsScroll: OsrScrollPhase = {
    ...phases.actionsScroll,
    at: phaseEnd(affiliationsToActions),
    durationPercent: getMatchedScrollDurationPercent(
      affiliationsScroll.durationPercent,
      affiliationsTravelVh,
      actionsTravelVh,
      phases.actionsScroll.durationPercent,
    ),
  };

  return {
    phases: {
      ...phases,
      whoopPersonalBarScroll,
      whoopToMicrosoft,
      microsoftPersonalBarScroll,
      microsoftToMeta,
      metaPersonalBarScroll,
      metaToAffiliations,
      affiliationsScroll,
      affiliationsToActions,
      actionsScroll,
    },
    motion: {
      whoopEndY: getPersonalBarContentEndY(whoopContentHeight, viewportHeight, 135),
      microsoftEndY: getPersonalBarContentEndY(microsoftContentHeight, viewportHeight, 185),
      metaEndY: getPersonalBarContentEndY(metaContentHeight, viewportHeight, 185),
      affiliationsEndY,
      actionsEndY,
    },
  };
}
